'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('cluster_fallback_configs', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      sourceClusterId: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      sourceWorkspaceId: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      sourceJobId: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      destinationClusterId: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      destinationWorkspaceId: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      destinationWorkspaceFqn: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      createdBy: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('cluster_fallback_configs');
  },
};
