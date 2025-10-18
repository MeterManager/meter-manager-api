const { MeterReading, MeterTenant, Meter, Tenant, User, Location, EnergyResourceType } = require('../../models');
const { Op, Sequelize } = require('sequelize');
const ConsumptionCalculator = require('../utils/consumptionCalculator');
const tariffService = require('./tariffService');

class MeterReadingService {
  async getAllLocations() {
    return await Location.findAll({
      attributes: ['id', 'name', 'address', 'occupied_area'],
      order: [['name', 'ASC']],
    });
  }

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
            as: 'MeterTenant',
            attributes: ['id', 'tenant_id', 'meter_id'],
            include: [
              {
                model: Meter,
                as: 'Meter',
                attributes: ['id', 'serial_number', 'location_id', 'energy_resource_type_id'],
                include: [
                  {
                    model: EnergyResourceType,
                    as: 'EnergyResourceType',
                    attributes: ['id', 'name'],
                  },
                  {
                    model: Location,
                    as: 'Location',
                    attributes: ['id', 'name', 'address', 'occupied_area'],
                  },
                ],
              },
              {
                model: Tenant,
                as: 'Tenant',
                attributes: ['id', 'name'], // FIXED: Removed location_id
              },
            ],
          },
          {
            model: User,
            as: 'User',
            attributes: ['id', 'full_name'],
          },
        ],
        order: [['reading_date', 'DESC']],
        raw: false,
      });

      // Calculate total rented area from all meter-tenant associations
      // This gives us the sum of occupied areas for locations with active meters
      const meterTenants = await MeterTenant.findAll({
        include: [
          {
            model: Meter,
            as: 'Meter',
            attributes: ['id', 'location_id'],
            include: [
              {
                model: Location,
                as: 'Location',
                attributes: ['id', 'occupied_area'],
              },
            ],
          },
        ],
        raw: true,
      });

      // Calculate total area from unique locations (avoiding duplicates)
      const uniqueLocations = new Map();
      meterTenants.forEach((mt) => {
        // When raw: true, nested properties use dot notation in the property name
        const locationId = mt['Meter.Location.id'];
        const area = parseFloat(mt['Meter.Location.occupied_area'] || 0);
        if (locationId && !uniqueLocations.has(locationId)) {
          uniqueLocations.set(locationId, area);
        }
      });

      const totalRentedArea = Array.from(uniqueLocations.values()).reduce((sum, area) => sum + area, 0);

      return readings.map((reading) => {
        const plainReading = reading.get({ plain: true });
        const tenantArea = parseFloat(plainReading.MeterTenant?.Meter?.Location?.occupied_area || 0);
        const locationArea = parseFloat(plainReading.MeterTenant?.Meter?.Location?.occupied_area || 0);
        const areaPercentage = totalRentedArea > 0 ? (tenantArea / totalRentedArea) * 100 : 0;

        return {
          ...plainReading,
          tenant_occupied_area: tenantArea,
          location_occupied_area: locationArea,
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
          as: 'MeterTenant',
          attributes: ['id', 'tenant_id', 'meter_id'],
          include: [
            {
              model: Meter,
              as: 'Meter',
              attributes: ['id', 'serial_number', 'location_id', 'energy_resource_type_id'],
              include: [
                {
                  model: EnergyResourceType,
                  as: 'EnergyResourceType',
                  attributes: ['id', 'name'],
                },
                {
                  model: Location,
                  as: 'Location',
                  attributes: ['id', 'name', 'address', 'occupied_area'],
                },
              ],
            },
            {
              model: Tenant,
              as: 'Tenant',
              attributes: ['id', 'name'], // FIXED: Removed location_id
            },
          ],
        },
        {
          model: User,
          as: 'User',
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

    let finalPreviousReading = previous_reading;

    if (finalPreviousReading === null || finalPreviousReading === undefined) {
      const readingDateObj = new Date(reading_date);

      const previousReadingRecord = await MeterReading.findOne({
        where: {
          meter_tenant_id,
          reading_date: { [Op.lt]: readingDateObj },
        },
        order: [['reading_date', 'DESC']],
      });

      finalPreviousReading = previousReadingRecord ? previousReadingRecord.current_reading : 0;
    }

    const consumption = ConsumptionCalculator.calculateConsumption(current_reading, finalPreviousReading);

    const meterTenant = await MeterTenant.findByPk(meter_tenant_id, {
      include: [
        {
          model: Meter,
          as: 'Meter',
          include: [
            {
              model: Location,
              as: 'Location',
              attributes: ['occupied_area'],
            },
          ],
        },
      ],
    });

    if (!meterTenant) throw new Error('Meter tenant not found');
    if (!meterTenant.Meter) throw new Error('Meter not linked to this tenant');

    const tariff = await tariffService.getApplicableTariff(
      meterTenant.Meter.location_id,
      meterTenant.Meter.energy_resource_type_id,
      reading_date
    );

    let direct_consumption = 0;
    let final_area_consumption = 0;
    let total_consumption = 0;

    const areaPercent =
      parseFloat(total_rented_area_percentage) ||
      parseFloat(rental_area) ||
      parseFloat(meterTenant?.Meter?.Location?.occupied_area) ||
      100;
    const areaValue = parseFloat(meterTenant.Meter.Location.occupied_area) || 0;

    if (calculation_method === 'direct') {
      ({
        direct_consumption,
        area_based_consumption: final_area_consumption,
        total_consumption,
      } = ConsumptionCalculator.calculateDirect(consumption, calculation_coefficient, areaPercent));
    } else if (calculation_method === 'area_based') {
      ({
        direct_consumption,
        area_based_consumption: final_area_consumption,
        total_consumption,
      } = ConsumptionCalculator.calculateAreaBased(areaValue, energy_consumption_coefficient, areaPercent));
    } else if (calculation_method === 'mixed') {
      ({
        direct_consumption,
        area_based_consumption: final_area_consumption,
        total_consumption,
      } = ConsumptionCalculator.calculateMixed(
        consumption,
        areaValue,
        calculation_coefficient,
        energy_consumption_coefficient,
        areaPercent
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

      const meterTenant = await MeterTenant.findByPk(reading.meter_tenant_id, {
        include: [
          {
            model: Meter,
            as: 'Meter',
            include: [
              {
                model: Location,
                as: 'Location',
                attributes: ['occupied_area'],
              },
            ],
          },
        ],
      });

      if (!meterTenant?.Meter) throw new Error('Meter not linked to this tenant');

      const tariff = await tariffService.getApplicableTariff(
        meterTenant.Meter.location_id,
        meterTenant.Meter.energy_resource_type_id,
        updateData.reading_date || reading.reading_date
      );

      const calculationCoeff = updateData.calculation_coefficient ?? reading.calculation_coefficient ?? 1;
      const energyCoeff = updateData.energy_consumption_coefficient ?? reading.energy_consumption_coefficient ?? 1;

      let direct_consumption;
      let area_consumption;
      let total_consumption = 0;

      const areaPercent =
        reading.total_rented_area_percentage ||
        reading.rental_area ||
        meterTenant?.Meter?.Location?.occupied_area ||
        100;
      const areaValue = parseFloat(meterTenant.Meter.Location.occupied_area) || 0;

      if (reading.calculation_method === 'direct') {
        ({ total_consumption, direct_consumption } = ConsumptionCalculator.calculateDirect(
          consumption,
          calculationCoeff,
          areaPercent
        ));
        area_consumption = 0;
      } else if (reading.calculation_method === 'area_based') {
        ({ total_consumption, area_based_consumption: area_consumption } = ConsumptionCalculator.calculateAreaBased(
          areaValue,
          energyCoeff,
          areaPercent
        ));
        direct_consumption = 0;
      } else if (reading.calculation_method === 'mixed') {
        ({
          total_consumption,
          direct_consumption,
          area_based_consumption: area_consumption,
        } = ConsumptionCalculator.calculateMixed(consumption, areaValue, calculationCoeff, energyCoeff, areaPercent));
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

  async getReadingsSummary(filters = {}) {
    const where = {};

    if (filters.location_id) {
      where['$MeterTenant.Meter.location_id$'] = filters.location_id;
    }
    if (filters.date_from && filters.date_to) {
      where.reading_date = { [Op.between]: [filters.date_from, filters.date_to] };
    }

    const readings = await MeterReading.findAll({
      where,
      include: [
        {
          model: MeterTenant,
          as: 'MeterTenant',
          include: [
            {
              model: Meter,
              as: 'Meter',
              include: [
                {
                  model: EnergyResourceType,
                  as: 'EnergyResourceType',
                  attributes: ['id', 'name'],
                },
                {
                  model: Location,
                  as: 'Location',
                  attributes: ['id', 'name', 'address', 'occupied_area'],
                },
              ],
            },
            {
              model: Tenant,
              as: 'Tenant',
              attributes: ['id', 'name'],
            },
          ],
        },
      ],
      order: [['reading_date', 'ASC']],
    });

    const summary = {};
    readings.forEach((r) => {
      const resourceType = r.MeterTenant?.Meter?.EnergyResourceType?.name || 'Unknown';

      if (!summary[resourceType]) {
        summary[resourceType] = {
          totalConsumption: 0,
          totalCost: 0,
          readings: [],
        };
      }

      summary[resourceType].readings.push({
        tenant: r.MeterTenant?.Tenant?.name,
        meterId: r.MeterTenant?.Meter?.serial_number,
        date: r.reading_date,
        prev: r.previous_reading,
        curr: r.current_reading,
        diff: r.consumption,
        totalConsumption: r.total_consumption,
        totalCost: r.total_cost,
        price: r.unit_price,
      });

      summary[resourceType].totalConsumption += parseFloat(r.total_consumption || 0);
      summary[resourceType].totalCost += parseFloat(r.total_cost || 0);
    });

    return summary;
  }
}

module.exports = new MeterReadingService();