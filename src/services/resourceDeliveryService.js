const { ResourceDelivery } = require('../../models');
const { Op } = require('sequelize');

class ResourceDeliveryService {
  async getAllDeliveries(filters = {}) {
    const where = {};

    if (filters.location_id) {
      where.location_id = filters.location_id;
    }

    if (filters.resource_type) {
      where.resource_type = filters.resource_type;
    }

    if (filters.delivery_date) {
      where.delivery_date = filters.delivery_date;
    }

    return await ResourceDelivery.findAll({
      where,
      include: [{ model: Location }, { model: ResourceConfiguration }],
      order: [['delivery_date', 'DESC']],
    });
  }

  async getDeliveryById(id) {
    return await ResourceDelivery.findByPk(id, {
      include: [{ model: Location }, { model: ResourceConfiguration }],
    });
  }

  async createResourceDelivery(data) {
    const { location_id, resource_type, delivery_date, quantity, unit, price_per_unit, total_cost, supplier } = data;

    if (!location_id || !resource_type || !delivery_date || !quantity || !unit) {
      throw new Error('Required fields missing');
    }

    const existing = await ResourceDelivery.findOne({
      where: { location_id, resource_type, delivery_date },
    });
    if (existing) {
      throw new Error('Delivery for this location, resource type, and date already exists');
    }

    return await ResourceDelivery.create({
      location_id,
      resource_type,
      delivery_date,
      quantity,
      unit,
      price_per_unit,
      total_cost,
      supplier,
    });
  }

  async updateResourceDelivery(id, updateData) {
    const delivery = await ResourceDelivery.findByPk(id);
    if (!delivery) throw new Error('Delivery not found');

    if (updateData.location_id || updateData.resource_type || updateData.delivery_date) {
      const existing = await ResourceDelivery.findOne({
        where: {
          location_id: updateData.location_id || delivery.location_id,
          resource_type: updateData.resource_type || delivery.resource_type,
          delivery_date: updateData.delivery_date || delivery.delivery_date,
          id: { [Op.ne]: id },
        },
      });
      if (existing) {
        throw new Error('Another delivery for this location, resource type and date already exists');
      }
    }

    return await delivery.update(updateData);
  }

  async deleteDelivery(id) {
    const delivery = await ResourceDelivery.findByPk(id);
    if (!delivery) throw new Error('Delivery not found');

    return await delivery.destroy();
  }
}

module.exports = new ResourceDeliveryService();
