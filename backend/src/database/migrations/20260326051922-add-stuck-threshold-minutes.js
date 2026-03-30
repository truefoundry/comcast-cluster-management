'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add column with a default to backfill existing rows
    await queryInterface.addColumn('cluster_fallback_configs', 'stuckThresholdMinutes', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 60,
    });

    // Remove the DB-level default so new rows must provide the value explicitly
    await queryInterface.changeColumn('cluster_fallback_configs', 'stuckThresholdMinutes', {
      type: Sequelize.INTEGER,
      allowNull: false,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('cluster_fallback_configs', 'stuckThresholdMinutes');
  },
};
