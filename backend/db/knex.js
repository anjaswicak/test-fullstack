const knexLib = require('knex');
const knexConfig = require('../knexfile');

const env = process.env.NODE_ENV || 'development';
const config = knexConfig[env];

if (!config) {
  throw new Error(`Knex configuration for environment "${env}" not found`);
}

const knex = knexLib(config);

module.exports = knex;
