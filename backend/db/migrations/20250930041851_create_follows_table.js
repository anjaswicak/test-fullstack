/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('follows', function(table) {
    // table.increments('id').primary();
    table.integer('follower_id').unsigned().references('id').inTable('users').onDelete('CASCADE');
    table.integer('followee_id').unsigned().references('id').inTable('users').onDelete('CASCADE');
    table.timestamps(true, true);
    table.unique(['follower_id', 'followee_id']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
    return knex.schema.dropTableIfExists('follows');
};
