// Update with your config settings.

/**
 * @type { Object.<string, import("knex").Knex.Config> }
 */
require('dotenv').config({ path: './.env' });

module.exports = {

  development: {
    client: 'sqlite3',
    connection: {
      filename: './dev.sqlite3'
    }
  },

  development: {
    client: 'postgresql',
    connection: {
      host:     process.env.DB_HOST || 'localhost',
      port:     process.env.DB_PORT || 5432,
      database: process.env.DB_DATABASE || 'fullstack_test',
      user:     process.env.DB_USER || 'anjaswicaksana',
      password: process.env.DB_PASSWORD || ''
    },
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      tableName: 'knex_migrations',
      directory: './db/migrations'
    },
    seeds: {
      directory: './db/seeds'
    }
  },

  production: {
    client: 'postgresql',
    connection: {
      host:     process.env.DB_HOST || 'localhost',
      port:     process.env.DB_PORT || 5432,
      database: process.env.DB_DATABASE || 'fullstack_test',
      user:     process.env.DB_USER || 'anjaswicaksana',
      password: process.env.DB_PASSWORD || ''
    },
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      tableName: 'knex_migrations',
      directory: './db/migrations'
    },
    seeds: {
      directory: './db/seeds'
    }
  }

};
