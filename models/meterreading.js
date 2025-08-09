'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class MeterReading extends Model {
    static associate(models) {
      this.belongsTo(models.MeterTenant, { foreignKey: 'meter_tenant_id' });
      this.belongsTo(models.User, { foreignKey: 'created_by' });
    }
  }
  MeterReading.init(
    {
      meter_tenant_id: { type: DataTypes.INTEGER, allowNull: false },
      reading_date: { type: DataTypes.DATEONLY, allowNull: false },
      current_reading: { type: DataTypes.DECIMAL(12, 4) },
      consumption: { type: DataTypes.DECIMAL(12, 4) },
      unit_price: { type: DataTypes.DECIMAL(10, 4), allowNull: false },
      direct_consumption: { type: DataTypes.DECIMAL(12, 4), allowNull: false },
      area_based_consumption: { type: DataTypes.DECIMAL(12, 4), allowNull: false },
      total_consumption: { type: DataTypes.DECIMAL(12, 4), allowNull: false },
      total_cost: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
      calculation_method: { type: DataTypes.STRING(50), allowNull: false },
      executor_name: { type: DataTypes.STRING(255) },
      tenant_representative: { type: DataTypes.STRING(255) },
      created_at: { type: DataTypes.DATE, defaultValue: sequelize.literal('CURRENT_TIMESTAMP') },
      created_by: { type: DataTypes.INTEGER, allowNull: false },
    },
    {
      sequelize,
      modelName: 'MeterReading',
      tableName: 'meter_readings',
      timestamps: false,
    }
  );
  return MeterReading;
};
