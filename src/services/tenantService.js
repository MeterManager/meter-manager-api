const { Tenant, MeterTenant } = require('../../models');
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

  async createTenant(tenantData) {
    const { name, location_id, occupied_area, contact_person, phone, email, is_active = true } = tenantData;

    const existingTenant = await Tenant.findOne({ where: { name } });
    if (existingTenant) throw new Error('Tenant with this name already exists');

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
    await MeterTenant.destroy({ where: { tenant_id: id } });
    return await tenant.destroy();
  }
}

module.exports = new TenantService();