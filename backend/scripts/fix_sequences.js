#!/usr/bin/env node
/* Fix PostgreSQL sequences for tables that use serial IDs */
const knex = require('../db/knex');

async function fixSequence(table) {
  const sql = `SELECT setval(pg_get_serial_sequence('${table}', 'id'), COALESCE(MAX(id), 0)) FROM ${table}`;
  try {
    await knex.raw(sql);
    console.log(`✔ Sequence fixed for ${table}`);
  } catch (err) {
    console.error(`✖ Failed fixing sequence for ${table}:`, err.message);
    throw err;
  }
}

(async () => {
  try {
    await fixSequence('users');
    await fixSequence('posts');
    console.log('All sequences fixed.');
  } catch (e) {
    process.exitCode = 1;
  } finally {
    await knex.destroy();
  }
})();
