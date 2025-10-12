const { Location, Meter, ResourceDelivery, Tenant, sequelize } = require('../../models');
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
      include: [{ model: Tenant, as: 'Tenant' }], 
      order: [['created_at', 'DESC']],
    });
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

    await this.cascadeDeleteLocation(id);
    
    return await location.destroy();
  }

  async cascadeDeleteLocation(locationId) {
    const { MeterTenant } = require('../../models');
    const transaction = await sequelize.transaction();
    
    try {
      const meters = await Meter.findAll({
        where: { location_id: locationId },
        attributes: ['id'],
        transaction
      });

      const meterIds = meters.map(meter => meter.id);

      // Delete MeterTenant relations
      if (meterIds.length > 0) {
        await MeterTenant.destroy({
          where: { meter_id: { [Op.in]: meterIds } },
          transaction
        });
      }

      // Delete Deliveries
      await ResourceDelivery.destroy({
        where: { location_id: locationId },
        transaction
      });

      // Delete Meters
      await Meter.destroy({
        where: { location_id: locationId },
        transaction
      });

      // Delete Tenants
      await Tenant.destroy({
        where: { location_id: locationId },
        transaction
      });

      await transaction.commit();

      return {
        deleted_meters: meterIds.length,
        deleted_meter_tenants: meterIds.length > 0 ? await MeterTenant.count({
          where: { meter_id: { [Op.in]: meterIds } }
        }) : 0,
        deleted_deliveries: await ResourceDelivery.count({
          where: { location_id: locationId }
        }),
        deleted_tenants: await Tenant.count({
          where: { location_id: locationId }
        })
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}

module.exports = new LocationService();
