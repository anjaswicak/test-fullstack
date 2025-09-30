/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.seed = async function(knex) {
  // Deletes ALL existing entries
  await knex('posts').del()
  await knex('posts').insert([
    {
      user_id: 1, // Post dari author
      content: 'Halo dunia! Ini post pertama saya di sistem feed baru.',
      created_at: knex.fn.now() // Gunakan fungsi knex untuk waktu saat ini
    },
    {
      user_id: 1,
      content: 'Mulai tes fungsionalitas follow dan unfollow.',
      created_at: knex.fn.now()
    },
    {
      user_id: 1, 
      content: 'Mengerjakan fitur bonus JWT. Semoga berhasil!',
      created_at: knex.fn.now()
    }
  ]);
};
