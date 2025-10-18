'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Location extends Model {
    static associate(models) {
      this.hasMany(models.Meter, { as: 'Meters', foreignKey: 'location_id' });
      this.hasMany(models.Tenant, { as: 'Tenants', foreignKey: 'location_id' });
      this.hasMany(models.Tariff, { foreignKey: 'location_id' });
      this.hasMany(models.Resource, { foreignKey: 'location_id' });
      this.hasMany(models.ResourceDelivery, { foreignKey: 'location_id' });
    }
  }

  Location.init(
    {
      name: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      address: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      created_at: {
        type: DataTypes.DATE,
        defaultValue: sequelize.literal('CURRENT_TIMESTAMP'),
      },
    },
    {
      sequelize,
      modelName: 'Location',
      tableName: 'locations',
      timestamps: false,
    }
  );

  return Location;
};
