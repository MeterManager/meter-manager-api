const { MeterReading, MeterTenant, Meter, Tenant, User, Location, EnergyResourceType } = require('../../models');
const { Op, Sequelize } = require('sequelize');
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
    if (filters.act_number) {
      where.act_number = { [Op.iLike]: `%${filters.act_number}%` };
    }
    if (filters.calculation_method) {
      where.calculation_method = filters.calculation_method;
    }

    try {
      const readings = await MeterReading.findAll({
        where,
        include: [
          {
            model: MeterTenant,
            attributes: ['id', 'tenant_id', 'meter_id'],
            include: [
              {
                model: Meter,
                attributes: ['id', 'serial_number', 'location_id', 'energy_resource_type_id'],
                include: [
                  {
                    model: EnergyResourceType,
                    attributes: ['id', 'name'],
                  },
                  {
                    model: Location,
                    as: 'Location',
                    attributes: ['id', 'name', 'address'],
                  },
                ],
              },
              {
                model: Tenant,
                attributes: ['id', 'name', 'occupied_area', 'location_id'],
                include: [
                  {
                    model: Location,
                    as: 'Location',
                    attributes: ['id', 'name', 'address'],
                  },
                ],
              },
            ],
          },
          {
            model: User,
            attributes: ['id', 'full_name'],
          },
        ],
        order: [['reading_date', 'DESC']],
        raw: false,
      });

      // Розраховуємо загальну площу всіх орендарів
      const allTenants = await Tenant.findAll({
        attributes: [[Sequelize.fn('SUM', Sequelize.col('occupied_area')), 'total_area']],
        raw: true,
      });

      const totalRentedArea = parseFloat(allTenants[0]?.total_area || 0);

      return readings.map((reading) => {
        const plainReading = reading.get({ plain: true });
        const tenantArea = parseFloat(plainReading.MeterTenant?.Tenant?.occupied_area || 0);
        const areaPercentage = totalRentedArea > 0 ? (tenantArea / totalRentedArea) * 100 : 0;

        return {
          ...plainReading,
          tenant_occupied_area: tenantArea,
          total_rented_area: totalRentedArea,
          area_percentage: areaPercentage,
        };
      });
    } catch (error) {
      console.error('Error in getAllReadings:', error);
      throw error;
    }
  }

  async getReadingById(id) {
    const reading = await MeterReading.findByPk(id, {
      include: [
        {
          model: MeterTenant,
          attributes: ['id', 'tenant_id', 'meter_id'],
          include: [
            {
              model: Meter,
              attributes: ['id', 'serial_number', 'location_id', 'energy_resource_type_id'],
              include: [
                {
                  model: EnergyResourceType,
                  attributes: ['id', 'name'],
                },
                {
                  model: Location,
                  as: 'Location',
                  attributes: ['id', 'name', 'address'],
                },
              ],
            },
            {
              model: Tenant,
              attributes: ['id', 'name', 'occupied_area', 'location_id'],
              include: [
                {
                  model: Location,
                  as: 'Location',
                  attributes: ['id', 'name', 'address'],
                },
              ],
            },
          ],
        },
        {
          model: User,
          attributes: ['id', 'full_name'],
        },
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
      previous_reading,
      area_based_consumption = 0,
      calculation_method,
      executor_name,
      tenant_representative,
      created_by,
      rental_area,
      total_rented_area_percentage = 0,
      energy_consumption_coefficient = 1,
      calculation_coefficient = 1,
      notes,
      act_number,
    } = data;

    // шукаємо попереднє показання
    let finalPreviousReading = previous_reading;
    if (!finalPreviousReading) {
      const previousReadingRecord = await MeterReading.findOne({
        where: { meter_tenant_id, reading_date: { [Op.lt]: reading_date } },
        order: [['reading_date', 'DESC']],
      });
      finalPreviousReading = previousReadingRecord ? previousReadingRecord.current_reading : 0;
    }

    // різниця між показниками
    const consumption = ConsumptionCalculator.calculateConsumption(current_reading, finalPreviousReading);

    // tenant + лічільник (для тарифу)
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
      ({
        direct_consumption,
        area_based_consumption: final_area_consumption,
        total_consumption,
      } = ConsumptionCalculator.calculateDirect(consumption, calculation_coefficient));
    } else if (calculation_method === 'area_based') {
      ({
        direct_consumption,
        area_based_consumption: final_area_consumption,
        total_consumption,
      } = ConsumptionCalculator.calculateAreaBased(area_based_consumption, energy_consumption_coefficient));
    } else if (calculation_method === 'mixed') {
      ({
        direct_consumption,
        area_based_consumption: final_area_consumption,
        total_consumption,
      } = ConsumptionCalculator.calculateMixed(
        consumption,
        area_based_consumption,
        calculation_coefficient,
        energy_consumption_coefficient
      ));
    } else {
      throw new Error('Unknown calculation method');
    }

    const total_cost = ConsumptionCalculator.calculateTotalCost(total_consumption, tariff.price);

    return await MeterReading.create({
      meter_tenant_id,
      reading_date,
      current_reading,
      previous_reading: finalPreviousReading,
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
      rental_area,
      total_rented_area_percentage,
      energy_consumption_coefficient,
      calculation_coefficient,
      notes,
      act_number,
    });
  }

  async updateReading(id, updateData) {
    const reading = await this.getReadingById(id);

    if (
      updateData.current_reading ||
      updateData.previous_reading ||
      updateData.direct_consumption ||
      updateData.area_based_consumption ||
      updateData.reading_date ||
      updateData.calculation_coefficient ||
      updateData.energy_consumption_coefficient
    ) {
      // Визначаємо попереднє показання
      let previousReading = updateData.previous_reading ?? reading.previous_reading;
      if (!previousReading && (updateData.current_reading || updateData.reading_date)) {
        const previousReadingRecord = await MeterReading.findOne({
          where: {
            meter_tenant_id: reading.meter_tenant_id,
            reading_date: {
              [Op.lt]: updateData.reading_date || reading.reading_date,
            },
          },
          order: [['reading_date', 'DESC']],
        });
        previousReading = previousReadingRecord ? previousReadingRecord.current_reading : 0;
      }

      const consumption = ConsumptionCalculator.calculateConsumption(
        updateData.current_reading ?? reading.current_reading,
        previousReading
      );

      // Отримуємо tenant + лічільник
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

      // Коефіцієнти
      const calculationCoeff = updateData.calculation_coefficient ?? reading.calculation_coefficient ?? 1;
      const energyCoeff = updateData.energy_consumption_coefficient ?? reading.energy_consumption_coefficient ?? 1;

      // Розрахунки споживання та загальної суми
      let direct_consumption = updateData.direct_consumption ?? reading.direct_consumption;
      let area_consumption = updateData.area_based_consumption ?? reading.area_based_consumption;
      let total_consumption = 0;

      if (reading.calculation_method === 'direct') {
        ({ total_consumption, direct_consumption } = ConsumptionCalculator.calculateDirect(
          consumption * calculationCoeff
        ));
      } else if (reading.calculation_method === 'area_based') {
        ({ total_consumption, area_consumption } = ConsumptionCalculator.calculateAreaBased(
          area_consumption * energyCoeff
        ));
      } else if (reading.calculation_method === 'mixed') {
        ({ total_consumption, direct_consumption, area_consumption } = ConsumptionCalculator.calculateMixed(
          consumption * calculationCoeff,
          area_consumption * energyCoeff
        ));
      }

      const total_cost = ConsumptionCalculator.calculateTotalCost(total_consumption, tariff.price);

      updateData = {
        ...updateData,
        previous_reading: previousReading,
        consumption,
        unit_price: tariff.price,
        direct_consumption,
        area_based_consumption: area_consumption,
        total_consumption,
        total_cost,
        calculation_coefficient: calculationCoeff,
        energy_consumption_coefficient: energyCoeff,
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
