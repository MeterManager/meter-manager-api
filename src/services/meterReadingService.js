const { MeterReading, MeterTenant, Meter, Tenant, User, Location, EnergyResourceType, MeterReadingDistribution} = require('../../models');
const { Op } = require('sequelize');
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
  
    if (filters.meter_tenant_id) where.meter_tenant_id = filters.meter_tenant_id;
    if (filters.reading_date) where.reading_date = filters.reading_date;
    if (filters.executor_name)
      where.executor_name = { [Op.iLike]: `%${filters.executor_name}%` };
  
    const readings = await MeterReading.findAll({
      where,
      include: [
        {
          model: MeterTenant,
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
                  attributes: ['id', 'name', 'address', 'occupied_area'], 
                },
              ],
            },
            {
              model: Tenant,
              attributes: ['id', 'name'], 
            },
          ],
        },
        { model: User, attributes: ['id', 'full_name'] },
        { model: MeterReadingDistribution, as: 'distributions' },
      ],
      order: [['created_at', 'DESC']],
    });
  
  return readings.map((reading) => {
    const locationArea = parseFloat(reading.MeterTenant?.Meter?.Location?.occupied_area) || 0;
    const address = reading.MeterTenant?.Meter?.Location?.address;
    const locationName = reading.MeterTenant?.Meter?.Location?.name;

    return {
      ...reading.get({ plain: true }),
      address,
      location_name: locationName,
      location_occupied_area: locationArea, 
    };
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
              include: [
                {
                  model: EnergyResourceType,
                  attributes: ['id', 'name'],
                },
                {
                  model: Location, 
                  attributes: ['id', 'name', 'address', 'occupied_area'], 
              },
              ],
              
            },
            {
              model: Tenant,
              attributes: ['id', 'name'],
              include: [
                {
                  model: Location,
                  as: 'Locations',
                  attributes: ['id', 'name', 'address', 'occupied_area'],
                },
              ],
            },
          ],
        },
        { model: User, attributes: ['id', 'full_name'] },
        { model: MeterReadingDistribution, as: 'distributions' },
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
      distributions = [], 
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
  
      finalPreviousReading = previousReadingRecord
        ? previousReadingRecord.current_reading
        : 0;
    }
    const consumption = ConsumptionCalculator.calculateConsumption(
      current_reading,
      finalPreviousReading
    );
  
    const meterTenant = await MeterTenant.findByPk(meter_tenant_id, {
      include: [
        {
          model: Meter,
          include: [{ model: Location, attributes: ['occupied_area'] }],
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
  
    const areaPercent =
      parseFloat(total_rented_area_percentage) ||
      parseFloat(rental_area) ||
      parseFloat(meterTenant?.Meter?.Location?.occupied_area) ||
      100;
    const areaValue = parseFloat(meterTenant.Meter.Location.occupied_area);
  
    let direct_consumption = 0;
    let final_area_consumption = 0;
    let total_consumption = 0;

    if (calculation_method === 'direct') {
      ({ direct_consumption, area_based_consumption: final_area_consumption, total_consumption } =
        ConsumptionCalculator.calculateDirect(consumption, calculation_coefficient, areaPercent));
    } else if (calculation_method === 'area_based') {
      ({ direct_consumption, area_based_consumption: final_area_consumption, total_consumption } =
        ConsumptionCalculator.calculateAreaBased(areaValue, energy_consumption_coefficient, areaPercent));
    } else if (calculation_method === 'mixed') {
      ({ direct_consumption, area_based_consumption: final_area_consumption, total_consumption } =
        ConsumptionCalculator.calculateMixed(
          consumption,
          areaValue,
          calculation_coefficient,
          energy_consumption_coefficient,
          areaPercent
        ));
    } else {
      throw new Error('Unknown calculation method');
    }
  
    //const total_cost = ConsumptionCalculator.calculateTotalCost(total_consumption, tariff.price);
  
    let total_cost = 0;

    const distributionRecords = distributions.map((d) => {
      const difference = ConsumptionCalculator.calculateConsumption(
        d.current_reading,
        d.previous_reading
      );

      const method = d.calculation_method || calculation_method;
      let consumedEnergy = 0;
      const distCoeff = d.calculation_coefficient ?? calculation_coefficient;
      const distAreaPercent = d.area_percentage ?? total_rented_area_percentage ?? 100;

      consumedEnergy = (difference * distCoeff * distAreaPercent) / 100;

      consumedEnergy = parseFloat(consumedEnergy) || 0;

      if (method === 'direct') {
        ({ total_consumption: consumedEnergy } = ConsumptionCalculator.calculateDirect(
          difference,
          d.calculation_coefficient ?? calculation_coefficient,
          d.area_percentage ?? 100
        ));
      } else if (method === 'area_based') {
        ({ total_consumption: consumedEnergy } = ConsumptionCalculator.calculateAreaBased(
          areaValue,
          d.energy_consumption_coefficient ?? energy_consumption_coefficient,
          d.area_percentage ?? 100
        ));
      } else if (method === 'mixed') {
        ({ total_consumption: consumedEnergy } = ConsumptionCalculator.calculateMixed(
          difference,
          areaValue,
          d.calculation_coefficient ?? calculation_coefficient,
          d.energy_consumption_coefficient ?? energy_consumption_coefficient,
          d.area_percentage ?? 100
        ));
      }

      const cost = ConsumptionCalculator.calculateTotalCost(consumedEnergy, tariff.price);
      total_cost += parseFloat(cost) || 0; 

      return {
        category: d.category,
        current_reading: d.current_reading,
        previous_reading: d.previous_reading,
        difference,
        calculation_method: method,
        calculation_coefficient: distCoeff,
        energy_consumption_coefficient: d.energy_consumption_coefficient ?? energy_consumption_coefficient,
        area_percentage: d.area_percentage ?? 100,
        consumed_energy: consumedEnergy.toFixed(2),
        cost,
      };
    });

    if (distributionRecords.length === 0) {
      total_cost = ConsumptionCalculator.calculateTotalCost(total_consumption, tariff.price);
    }

    const reading = await MeterReading.create(
      {
        meter_tenant_id,
        reading_date,
        current_reading,
        previous_reading: finalPreviousReading,
        consumption,
        unit_price: tariff.price,
        direct_consumption,
        area_based_consumption: final_area_consumption,
        total_consumption,
        total_cost: total_cost.toFixed(2),
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
        distributions: distributionRecords,
      },
      {
        include: [{ model: MeterReadingDistribution, as: 'distributions' }],
      }
    );
    return reading;
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
      updateData.energy_consumption_coefficient ||
      updateData.distributions
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
            include: [{ model: Location, attributes: ['occupied_area'] }],
          },
        ],
      });
  
      if (!meterTenant?.Meter) throw new Error("Meter not linked to this tenant");

      const tariff = await tariffService.getApplicableTariff(
        meterTenant.Meter.location_id,
        meterTenant.Meter.energy_resource_type_id,
        updateData.reading_date || reading.reading_date
      );
  
      const price = parseFloat(tariff?.price ?? 0);
      const calculationCoeff =
        updateData.calculation_coefficient ?? reading.calculation_coefficient ?? 1;
      const energyCoeff =
        updateData.energy_consumption_coefficient ?? reading.energy_consumption_coefficient ?? 1;
  
      const areaValue = parseFloat(meterTenant.Meter.Location.occupied_area ?? 0);
      const areaPercent =
        reading.total_rented_area_percentage ||
        reading.rental_area ||
        areaValue ||
        100;
  
      let direct_consumption = 0;
      let area_consumption = 0;
      let total_consumption = 0;
      let total_cost = 0;
  
      if (updateData.distributions) {
        await MeterReadingDistribution.destroy({ where: { meter_reading_id: id } });
  
        const newDistributions = [];
  
        for (const d of updateData.distributions) {
          const difference = ConsumptionCalculator.calculateConsumption(
            d.current_reading,
            d.previous_reading
          );
  
          const method = d.calculation_method || reading.calculation_method;
          let consumedEnergy = 0;
          const distCoeff = d.calculation_coefficient ?? calculationCoeff;
          const distAreaPercent = d.area_percentage ?? reading.total_rented_area_percentage ?? 100;
          consumedEnergy = (difference * distCoeff * distAreaPercent) / 100;
          consumedEnergy = parseFloat(consumedEnergy) || 0;

          if (method === "direct") {
            ({ total_consumption: consumedEnergy } = ConsumptionCalculator.calculateDirect(
              difference,
              d.calculation_coefficient ?? calculationCoeff,
              d.area_percentage ?? 100
            ));
          } else if (method === "area_based") {
            ({ total_consumption: consumedEnergy } = ConsumptionCalculator.calculateAreaBased(
              areaValue,
              d.energy_consumption_coefficient ?? energyCoeff,
              d.area_percentage ?? 100
            ));
          } else if (method === "mixed") {
            ({ total_consumption: consumedEnergy } = ConsumptionCalculator.calculateMixed(
              difference,
              areaValue,
              d.calculation_coefficient ?? calculationCoeff,
              d.energy_consumption_coefficient ?? energyCoeff,
              d.area_percentage ?? 100
            ));
          }

          const cost = ConsumptionCalculator.calculateTotalCost(consumedEnergy, price);
          total_cost += parseFloat(cost) || 0;
  
          newDistributions.push({
            ...d,
            meter_reading_id: id,
            difference,
            consumed_energy: consumedEnergy.toFixed(2),
            cost: cost.toFixed(2),
          });
        }
        await MeterReadingDistribution.bulkCreate(newDistributions);
      }

      if (reading.calculation_method === "direct") {
        ({ total_consumption, direct_consumption } = ConsumptionCalculator.calculateDirect(
          consumption,
          calculationCoeff,
          areaPercent
        ));
      } else if (reading.calculation_method === "area_based") {
        ({ total_consumption, area_based_consumption: area_consumption } =
          ConsumptionCalculator.calculateAreaBased(areaValue, energyCoeff, areaPercent));
      } else if (reading.calculation_method === "mixed") {
        ({
          total_consumption,
          direct_consumption,
          area_based_consumption: area_consumption,
        } = ConsumptionCalculator.calculateMixed(
          consumption,
          areaValue,
          calculationCoeff,
          energyCoeff,
          areaPercent
        ));
      }
      // Якщо категорій немає — рахуємо cost як завжди
      if (!updateData.distributions || updateData.distributions.length === 0) {
        total_cost = ConsumptionCalculator.calculateTotalCost(total_consumption, price);
      }    
      updateData = {
        ...updateData,
        previous_reading: previousReading,
        consumption,
        unit_price: price,
        direct_consumption,
        area_based_consumption: area_consumption,
        total_consumption,
        total_cost:total_cost.toFixed(2),
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

    if (filters.location_id) where['$MeterTenant.Meter.location_id$'] = filters.location_id;
    if (filters.date_from && filters.date_to)
      where.reading_date = { [Op.between]: [filters.date_from, filters.date_to] };

    const readings = await MeterReading.findAll({
      where,
      include: [
        {
          model: MeterTenant,
          include: [
            {
              model: Meter,
              include: [{ model: EnergyResourceType, attributes: ['id', 'name'] }],
            },
            { model: Tenant, attributes: ['id', 'name'] },
          ],
        },
      ],
      order: [['reading_date', 'ASC']],
    });

    const summary = {};
    readings.forEach(r => {
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
