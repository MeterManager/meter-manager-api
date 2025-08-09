'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('resource_deliveries', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      location_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'locations', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      resource_type: {
        type: Sequelize.STRING(50),
        allowNull: false,
        references: { model: 'resource_configurations', key: 'resource_type' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      delivery_date: { type: Sequelize.DATEONLY, allowNull: false },
      quantity: { type: Sequelize.DECIMAL(12, 4), allowNull: false },
      unit: { type: Sequelize.STRING(20), allowNull: false },
      price_per_unit: { type: Sequelize.DECIMAL(10, 4), allowNull: true },
      total_cost: { type: Sequelize.DECIMAL(12, 2), allowNull: true },
      supplier: { type: Sequelize.STRING(255), allowNull: true },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('resource_deliveries');
  },
};
