#!/usr/bin/env node

/**
 * One-time script to migrate data from JSON file storage to SQLite.
 *
 * Usage:
 *   node scripts/seed-from-json.js
 *
 * Reads cluster-fallback-configs.json from DATA_DIR and inserts
 * all records into the cluster_fallback_configs table.
 * Skips records that already exist (matched by id).
 */

const fs = require('fs');
const path = require('path');
const { Sequelize, QueryTypes } = require('sequelize');
require('dotenv').config();

const dataDir = process.env.DATA_DIR || './data';
const dialect = process.env.DB_DIALECT || 'sqlite';

function createSequelize() {
  if (dialect === 'sqlite') {
    return new Sequelize({
      dialect: 'sqlite',
      storage: path.join(dataDir, 'database.sqlite'),
      logging: false,
    });
  }

  return new Sequelize({
    dialect: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'admin',
    password: process.env.DB_PASSWORD || 'admin123',
    database: process.env.DB_NAME || 'cluster_management',
    logging: false,
  });
}

async function main() {
  const jsonPath = path.join(dataDir, 'cluster-fallback-configs.json');

  if (!fs.existsSync(jsonPath)) {
    console.error(`JSON file not found: ${jsonPath}`);
    process.exit(1);
  }

  const raw = fs.readFileSync(jsonPath, 'utf-8');
  const records = JSON.parse(raw);

  if (!Array.isArray(records) || records.length === 0) {
    console.log('JSON file is empty. Nothing to seed.');
    process.exit(0);
  }

  console.log(`Found ${records.length} records in ${jsonPath}`);

  const sequelize = createSequelize();

  try {
    await sequelize.authenticate();
    console.log('Connected to database.');

    let inserted = 0;
    let skipped = 0;

    for (const r of records) {
      const existing = await sequelize.query(
        'SELECT id FROM cluster_fallback_configs WHERE id = :id',
        { replacements: { id: r.id }, type: QueryTypes.SELECT },
      );

      if (existing.length > 0) {
        console.log(`  Skipping (already exists): ${r.id}`);
        skipped++;
        continue;
      }

      await sequelize.query(
        `INSERT INTO cluster_fallback_configs
          (id, sourceClusterId, sourceWorkspaceId, sourceJobId,
           destinationClusterId, destinationWorkspaceId, destinationWorkspaceFqn,
           createdBy, createdAt, updatedAt)
        VALUES
          (:id, :sourceClusterId, :sourceWorkspaceId, :sourceJobId,
           :destinationClusterId, :destinationWorkspaceId, :destinationWorkspaceFqn,
           :createdBy, :createdAt, :updatedAt)`,
        {
          replacements: {
            id: r.id,
            sourceClusterId: r.sourceClusterId,
            sourceWorkspaceId: r.sourceWorkspaceId,
            sourceJobId: r.sourceJobId || null,
            destinationClusterId: r.destinationClusterId,
            destinationWorkspaceId: r.destinationWorkspaceId,
            destinationWorkspaceFqn: r.destinationWorkspaceFqn,
            createdBy: r.createdBy || null,
            createdAt: r.createdAt,
            updatedAt: r.updatedAt,
          },
          type: QueryTypes.INSERT,
        },
      );

      console.log(`  Inserted: ${r.id}`);
      inserted++;
    }

    console.log(`\nDone. Inserted: ${inserted}, Skipped: ${skipped}`);
  } finally {
    await sequelize.close();
  }
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
