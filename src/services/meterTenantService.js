const { MeterTenant, Tenant, Meter, Location } = require('../../models');
const { Op } = require('sequelize');

class MeterTenantService {
  async getAllMeterTenants(filters = {}) {
    const where = {};
    if (filters.tenant_id) {
      where.tenant_id = filters.tenant_id;
    }
    if (filters.meter_id) {
      where.meter_id = filters.meter_id;
    }
    if (filters.assigned_from || filters.assigned_to) {
      where.assigned_from = {
        [Op.between]: [
          filters.assigned_from || '1900-01-01',
          filters.assigned_to || new Date(),
        ],
      };
    }

    return await MeterTenant.findAll({
      where,
      include: [
        {
          model: Tenant,
          attributes: ['id', 'name', 'phone', 'email'],
        },
        {
          model: Meter,
          attributes: ['id', 'serial_number', 'energy_resource_type_id', 'location_id'],
          include: [
            {
              model: Location,
              attributes: ['id', 'name', 'address'],
            }
          ]
        },
      ],
    });
  }

  async getMeterTenantById(id) {
    const meterTenant = await MeterTenant.findByPk(id, {
      include: [
        { model: Tenant, attributes: ['id', 'name'] },
        { 
          model: Meter, 
          attributes: ['id', 'serial_number', 'location_id', 'energy_resource_type_id'] 
        },
      ],
    });

    if (!meterTenant) {
      throw new Error('MeterTenant not found');
    }
    return meterTenant;
  }

  async createMeterTenant(data) {
    const { tenant_id, meter_id, assigned_from, assigned_to } = data;

    const existing = await MeterTenant.findOne({
      where: {
        tenant_id,
        meter_id,
        [Op.or]: [
          { assigned_to: null },
          {
            assigned_from: { [Op.lte]: assigned_to || new Date() },
            assigned_to: { [Op.gte]: assigned_from },
          },
        ],
      },
    });

    if (existing) {
      throw new Error('This meter is already assigned to the tenant for the given period');
    }

    return await MeterTenant.create({
      tenant_id,
      meter_id,
      assigned_from,
      assigned_to: assigned_to || null,
    });
  }

  async updateMeterTenant(id, updateData) {
    const meterTenant = await this.getMeterTenantById(id);

    return await meterTenant.update({
      ...(updateData.tenant_id && { tenant_id: updateData.tenant_id }),
      ...(updateData.meter_id && { meter_id: updateData.meter_id }),
      ...(updateData.assigned_from && { assigned_from: updateData.assigned_from }),
      ...(updateData.assigned_to !== undefined && { assigned_to: updateData.assigned_to }),
    });
  }

  async deleteMeterTenant(id) {
    const meterTenant = await this.getMeterTenantById(id);
    return await meterTenant.destroy();
  }
}

module.exports = new MeterTenantService();

