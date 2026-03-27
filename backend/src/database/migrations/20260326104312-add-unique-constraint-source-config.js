'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addIndex('cluster_fallback_configs', {
      fields: ['sourceClusterId', 'sourceWorkspaceId', 'sourceJobId'],
      unique: true,
      where: { sourceJobId: { [Sequelize.Op.ne]: null } },
      name: 'uq_cluster_workspace_job',
    });

    await queryInterface.addIndex('cluster_fallback_configs', {
      fields: ['sourceClusterId', 'sourceWorkspaceId'],
      unique: true,
      where: { sourceJobId: null },
      name: 'uq_cluster_workspace_generic',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex(
      'cluster_fallback_configs',
      'uq_cluster_workspace_job',
    );
    await queryInterface.removeIndex(
      'cluster_fallback_configs',
      'uq_cluster_workspace_generic',
    );
  },
};
