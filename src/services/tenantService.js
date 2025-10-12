const { Tenant, MeterTenant, Location } = require('../../models');
const { Op } = require('sequelize');

class TenantService {
  async getAllTenants(filters = {}) {
    const where = {};
    if (filters.is_active !== undefined) where.is_active = filters.is_active;
    if (filters.name) where.name = { [Op.iLike]: `%${filters.name}%` };
    if (filters.location_id) where.location_id = filters.location_id;

    return await Tenant.findAll({
      where,
      include: [{ model: MeterTenant, as: 'MeterTenants' }],
      order: [['created_at', 'DESC']],
    });
  }

  async getTenantById(id) {
    const tenant = await Tenant.findByPk(id, {
      include: [{ model: MeterTenant, as: 'MeterTenants' }],
    });
    if (!tenant) throw new Error('Tenant not found');
    return tenant;
  }

  async getTenantDependencies(id) {
    const activeMeterTenants = await MeterTenant.count({
      where: { tenant_id: id, [Op.or]: [{ assigned_to: null }, { assigned_to: { [Op.gte]: new Date() } }] },
    });
    return { active_meter_tenants: activeMeterTenants };
  }

  async createTenant(tenantData) {
    const { name, location_id, occupied_area, contact_person, phone, email, is_active = true } = tenantData;

    const existingTenant = await Tenant.findOne({ where: { name } });
    if (existingTenant) throw new Error('Tenant with this name already exists');

    if (location_id) {
      const location = await Location.findByPk(location_id);
      if (!location) throw new Error('Location not found');
      if (!location.is_active) throw new Error('Cannot create tenant with inactive location');
    }

    return await Tenant.create({
      name,
      location_id,
      occupied_area,
      contact_person,
      phone,
      email,
      is_active,
    });
  }

  async updateTenant(id, updateData) {
    const tenant = await this.getTenantById(id);
    const { name, location_id, occupied_area, contact_person, phone, email, is_active } = updateData;

    if (name && name !== tenant.name) {
      const existingTenant = await Tenant.findOne({
        where: { name, id: { [Op.ne]: id } },
      });
      if (existingTenant) throw new Error('Tenant with this name already exists');
    }

    if (location_id && location_id !== tenant.location_id) {
      const location = await Location.findByPk(location_id);
      if (!location) throw new Error('Location not found');
      if (!location.is_active) throw new Error('Cannot update tenant with inactive location');
    }

    return await tenant.update({
      ...(name && { name }),
      ...(location_id && { location_id }),
      ...(occupied_area !== undefined && { occupied_area }),
      ...(contact_person !== undefined && { contact_person }),
      ...(phone !== undefined && { phone }),
      ...(email !== undefined && { email }),
      ...(is_active !== undefined && { is_active }),
    });
  }

  async deleteTenant(id) {
    const tenant = await this.getTenantById(id);
    if (tenant.is_active) throw new Error('Cannot delete active tenant. Deactivate it first.');

    await tenant.destroy();
    return { deleted: true };
  }
}

module.exports = new TenantService();