require('dotenv').config();
const path = require('path');

const dialect = process.env.DB_DIALECT || 'sqlite';
const dataDir = process.env.DATA_DIR || './data';

const sqliteConfig = {
  dialect: 'sqlite',
  storage: path.join(dataDir, 'database.sqlite'),
};

const postgresConfig = {
  dialect: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'admin',
  password: process.env.DB_PASSWORD || 'admin123',
  database: process.env.DB_NAME || 'cluster_management',
};

const config = dialect === 'sqlite' ? sqliteConfig : postgresConfig;

module.exports = {
  development: config,
  production: config,
};
