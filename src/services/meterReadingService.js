const { MeterReading, MeterTenant, Meter,Tenant, User, Location } = require('../../models');
const { Op } = require('sequelize');
const ConsumptionCalculator = require('../utils/consumptionCalculator');
const tariffService = require('./tariffService');

class MeterReadingService {
  async getAllReadings(filters = {}) {
    const where = {};

    if (filters.meter_tenant_id) {
      where.meter_tenant_id = filters.meter_tenant_id;
    }
    if (filters.reading_date) {
      where.reading_date = filters.reading_date;
    }
    if (filters.executor_name) {
      where.executor_name = { [Op.iLike]: `%${filters.executor_name}%` };
    }

    return await MeterReading.findAll({
      where,
      include: [
        {
          model: MeterTenant,
          include: [
            {
              model: Meter,
              attributes: ['id', 'serial_number', 'location_id', 'energy_resource_type_id'],
            },
            {
              model: Tenant,
              attributes: ['id', 'name', 'location_id'],
              include: [
                {
                  model: Location,
                  attributes: ['id', 'name', 'address'],
                }
              ]
            },
          ],
        },
        { model: User, attributes: ['id', 'full_name'] }, 
      ],
      order: [['created_at', 'DESC']],
    });
  }

  async getReadingById(id) {
    const reading = await MeterReading.findByPk(id, {
      include: [
        {
          model: MeterTenant,
          attributes: ['id', 'tenant_id'],
          include: [
            {
              model: Meter,
              attributes: ['id', 'serial_number', 'location_id', 'energy_resource_type_id'],
            },
            {
              model: Tenant,
              attributes: ['id', 'name'],
            },
          ],
        },
        { model: User, attributes: ['id', 'full_name'] },
      ],
    });

    if (!reading) {
      throw new Error('Meter reading not found');
    }
    return reading;
  }

  async createReading(data) {
    const {
      meter_tenant_id,
      reading_date,
      current_reading,
      area_based_consumption = 0,
      calculation_method,
      executor_name,
      tenant_representative,
      created_by,
    } = data;

    // шукаємо попереднє показання
    const previousReading = await MeterReading.findOne({
      where: { meter_tenant_id, reading_date: { [Op.lt]: reading_date } },
      order: [['reading_date', 'DESC']],
    });

    // різниця між показниками
    const consumption = ConsumptionCalculator.calculateConsumption(
      current_reading,
      previousReading ? previousReading.current_reading : null
    );

    // tenant + лічильник (для тарифу)
    const meterTenant = await MeterTenant.findByPk(meter_tenant_id, {
      include: [{ model: Meter }],
    });
    if (!meterTenant) {
      throw new Error('Meter tenant not found');
    }
    if (!meterTenant.Meter) {
      throw new Error('Meter not linked to this tenant');
    }

    // тариф на цю дату
    const tariff = await tariffService.getApplicableTariff(
      meterTenant.Meter.location_id,
      meterTenant.Meter.energy_resource_type_id,
      reading_date
    );

    let direct_consumption = 0;
    let final_area_consumption = 0;
    let total_consumption = 0;

    if (calculation_method === 'direct') {
      ({ direct_consumption, area_based_consumption: final_area_consumption, total_consumption } =
        ConsumptionCalculator.calculateDirect(consumption));
    } else if (calculation_method === 'area_based') {
      ({ direct_consumption, area_based_consumption: final_area_consumption, total_consumption } =
        ConsumptionCalculator.calculateAreaBased(area_based_consumption));
    } else if (calculation_method === 'mixed') {
      ({ direct_consumption, area_based_consumption: final_area_consumption, total_consumption } =
        ConsumptionCalculator.calculateMixed(consumption, area_based_consumption));
    } else {
      throw new Error('Unknown calculation method');
    }

    const total_cost = ConsumptionCalculator.calculateTotalCost(total_consumption, tariff.price);

    return await MeterReading.create({
      meter_tenant_id,
      reading_date,
      current_reading,
      consumption,
      unit_price: tariff.price,
      direct_consumption,
      area_based_consumption: final_area_consumption,
      total_consumption,
      total_cost,
      calculation_method,
      executor_name,
      tenant_representative,
      created_by,
    });
  }

  async updateReading(id, updateData) {
    const reading = await this.getReadingById(id);

    if (
      updateData.current_reading ||
      updateData.direct_consumption ||
      updateData.area_based_consumption ||
      updateData.reading_date
    ) {
      const previousReading = await MeterReading.findOne({
        where: {
          meter_tenant_id: reading.meter_tenant_id,
          reading_date: {
            [Op.lt]: updateData.reading_date || reading.reading_date,
          },
        },
        order: [['reading_date', 'DESC']],
      });

      const consumption = ConsumptionCalculator.calculateConsumption(
        updateData.current_reading ?? reading.current_reading,
        previousReading ? previousReading.current_reading : null
      );

      // Отримуємо tenant + лічильник
      const meterTenant = await MeterTenant.findByPk(reading.meter_tenant_id, {
        include: [{ model: Meter }],
      });

      if (!meterTenant?.Meter) {
        throw new Error('Meter not linked to this tenant');
      }

      // Підбираємо актуальний тариф (можливо змінилась дата)
      const tariff = await tariffService.getApplicableTariff(
        meterTenant.Meter.location_id,
        meterTenant.Meter.energy_resource_type_id,
        updateData.reading_date || reading.reading_date
      );

      // Перерахунок total_consumption і total_cost
      const total_consumption = ConsumptionCalculator.calculateTotalConsumption(
        consumption,
        updateData.direct_consumption ?? reading.direct_consumption,
        updateData.area_based_consumption ?? reading.area_based_consumption
      );

      const total_cost = ConsumptionCalculator.calculateTotalCost(total_consumption, tariff.price);

      updateData = {
        ...updateData,
        consumption,
        unit_price: tariff.price,
        total_consumption,
        total_cost,
      };
    }

    return await reading.update(updateData);
  }

  async deleteReading(id) {
    const reading = await this.getReadingById(id);
    return await reading.destroy();
  }
}

module.exports = new MeterReadingService();
