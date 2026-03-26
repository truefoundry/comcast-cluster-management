'use strict';

const fs = require('fs');
const path = require('path');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const dataDir = process.env.DATA_DIR || './data';
    const jsonPath = path.join(dataDir, 'cluster-fallback-configs.json');

    if (!fs.existsSync(jsonPath)) {
      console.log(`No JSON file found at ${jsonPath}, skipping seed.`);
      return;
    }

    const raw = fs.readFileSync(jsonPath, 'utf-8');
    const records = JSON.parse(raw);

    if (!Array.isArray(records) || records.length === 0) {
      console.log('JSON file is empty, skipping seed.');
      return;
    }

    console.log(`Seeding ${records.length} records from ${jsonPath}`);

    await queryInterface.bulkInsert(
      'cluster_fallback_configs',
      records.map((r) => ({
        id: r.id,
        sourceClusterId: r.sourceClusterId,
        sourceWorkspaceId: r.sourceWorkspaceId,
        sourceJobId: r.sourceJobId || null,
        destinationClusterId: r.destinationClusterId,
        destinationWorkspaceId: r.destinationWorkspaceId,
        destinationWorkspaceFqn: r.destinationWorkspaceFqn,
        stuckThresholdMinutes: r.stuckThresholdMinutes || 60,
        createdBy: r.createdBy || null,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      })),
    );

    console.log(`Seeded ${records.length} records successfully.`);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('cluster_fallback_configs', null, {});
  },
};
