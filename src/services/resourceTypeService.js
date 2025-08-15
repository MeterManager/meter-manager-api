const { EnergyResourceType } = require('../../models');
const { Op } = require('sequelize');

class EnergyResourceTypeService {
  async getAllResourceTypes(filters = {}) {
    const where = {};

    if (filters.is_active !== undefined) {
      where.is_active = filters.is_active;
    }

    if (filters.name) {
      where.name = {
        [Op.iLike]: `%${filters.name}%`,
      };
    }

    return await EnergyResourceType.findAll({
      where,
      order: [['name', 'ASC']],
    });
  }

  async getResourceTypeById(id) {
    const type = await EnergyResourceType.findByPk(id);
    if (!type) {
      throw new Error('Resource type not found');
    }
    return type;
  }

  async createResourceType(data) {
    const { name, unit, is_active = true } = data;

    if (!name || !unit) {
      throw new Error('Name and unit are required');
    }

    const existingType = await EnergyResourceType.findOne({
      where: { name },
    });
    if (existingType) {
      throw new Error('Resource type with this name already exists');
    }

    return await EnergyResourceType.create({
      name,
      unit,
      is_active,
    });
  }

  async updateResourceType(id, updateData) {
    const type = await this.getResourceTypeById(id);
    const { name, unit, is_active } = updateData;

    if (name && name !== type.name) {
      const existingType = await EnergyResourceType.findOne({
        where: {
          name,
          id: { [Op.ne]: id },
        },
      });
      if (existingType) {
        throw new Error('Resource type with this name already exists');
      }
    }

    return await type.update({
      ...(name && { name }),
      ...(unit !== undefined && { unit }),
      ...(is_active !== undefined && { is_active }),
    });
  }

  async deleteResourceType(id) {
    const type = await this.getResourceTypeById(id);
    if (type.is_active) {
      throw new Error('Cannot delete active resource type. Deactivate it first.');
    }
    return await type.destroy();
  }
}

module.exports = new EnergyResourceTypeService();
