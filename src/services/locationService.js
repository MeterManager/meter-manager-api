const { Location, Tenant } = require('../../models');
const { Op } = require('sequelize');

class LocationService {
  async getAllLocations(filters = {}) {
    try {
      const where = {};
      if (filters.is_active !== undefined) {
        where.is_active = filters.is_active;
      }
      if (filters.name) {
        where.name = {
          [Op.iLike]: `%${filters.name}%`,
        };
      }

      console.log('Fetching locations with where:', where);

      const locations = await Location.findAll({
        where,
        include: [{ model: Tenant, as: 'Tenant' }],
        order: [['created_at', 'DESC']],
      });

      console.log('Found locations:', locations.length);
      return locations;
    } catch (error) {
      console.error('Error in getAllLocations:', error);
      throw error;
    }
  }

  async getLocationById(id) {
    const location = await Location.findByPk(id, {
      include: [{ model: Tenant, as: 'Tenant' }],
    });
    if (!location) {
      throw new Error('Location not found');
    }
    return location;
  }

  async createLocation(locationData) {
    const { name, address, tenant_id = null, is_active = true, occupied_area = null } = locationData;

    const existingLocation = await Location.findOne({ where: { name } });
    if (existingLocation) {
      throw new Error('Location with this name already exists');
    }

    if (tenant_id) {
      const tenant = await Tenant.findByPk(tenant_id);
      if (!tenant) throw new Error('Invalid tenant_id: Tenant not found');
    }

    return await Location.create({
      name,
      address,
      tenant_id,
      is_active,
      occupied_area,
    });
  }

  async updateLocation(id, updateData) {
    const location = await this.getLocationById(id);
    const { name, address, tenant_id, is_active, occupied_area } = updateData;

    if (name && name !== location.name) {
      const existingLocation = await Location.findOne({
        where: { name, id: { [Op.ne]: id } },
      });
      if (existingLocation) throw new Error('Location with this name already exists');
    }

    if (tenant_id !== undefined) {
      if (tenant_id === null) {
        location.tenant_id = null;
      } else {
        const tenant = await Tenant.findByPk(tenant_id);
        if (!tenant) throw new Error('Invalid tenant_id: Tenant not found');
        location.tenant_id = tenant_id;
      }
    }

    return await location.update({
      ...(name && { name }),
      ...(address !== undefined && { address }),
      ...(is_active !== undefined && { is_active }),
      ...(occupied_area !== undefined && { occupied_area }),
      tenant_id: location.tenant_id,
    });
  }

  async deleteLocation(id) {
    const location = await this.getLocationById(id);
    if (location.is_active) {
      throw new Error('Cannot delete active location. Deactivate it first.');
    }

    return await location.destroy();
  }
}

module.exports = new LocationService();
