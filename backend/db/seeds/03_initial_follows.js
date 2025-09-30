/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.seed = async function(knex) {
  // Deletes ALL existing entries
  await knex('follows').del()
  await knex('follows').insert([
    // Kolom pada migration adalah follower_id dan followee_id
    // User dengan ID 1 mengikuti User dengan ID 2
    { follower_id: 2, followee_id: 1 }
  ]);
};
