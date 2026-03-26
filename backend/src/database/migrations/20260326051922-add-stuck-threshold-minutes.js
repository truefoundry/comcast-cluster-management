'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('cluster_fallback_configs', 'stuckThresholdMinutes', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 60,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('cluster_fallback_configs', 'stuckThresholdMinutes');
  },
};
