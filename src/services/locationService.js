const { Location } = require('../../models');
const { Op } = require('sequelize');

class LocationService {
  async getAllLocations(filters = {}) {
    const where = {};
    if (filters.is_active !== undefined) {
      where.is_active = filters.is_active;
    }
    if (filters.name) {
      where.name = {
        [Op.iLike]: `%${filters.name}%`,
      };
    }
    return await Location.findAll({
      where,
      order: [['created_at', 'DESC']],
    });
  }

  async getLocationById(id) {
    const location = await Location.findByPk(id);
    if (!location) {
      throw new Error('Location not found');
    }
    return location;
  }

  async createLocation(locationData) {
    const { name, address, is_active = true } = locationData;

    const existingLocation = await Location.findOne({ where: { name } });
    if (existingLocation) {
      throw new Error('Location with this name already exists');
    }

    return await Location.create({
      name,
      address,
      is_active,
    });
  }

  async updateLocation(id, updateData) {
    const location = await this.getLocationById(id);
    const { name, address, is_active } = updateData;

    if (name && name !== location.name) {
      const existingLocation = await Location.findOne({
        where: {
          name,
          id: { [Op.ne]: id },
        },
      });
      if (existingLocation) {
        throw new Error('Location with this name already exists');
      }
    }

    return await location.update({
      ...(name && { name }),
      ...(address !== undefined && { address }),
      ...(is_active !== undefined && { is_active }),
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
