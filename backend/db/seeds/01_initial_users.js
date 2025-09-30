/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.seed = async function(knex) {
  // Deletes ALL existing entries
  await knex('users').del()
  await knex('users').insert([
    {
      id: 1, 
      username: 'author', 
      password_hash: '$2b$10$YrRp1S4DM8PyV7bTqa4RI.WUwUR6TgImYRd5gNrxXLEZapvgRek5K' // plaintext: authorpass
    },
    {
      id: 2, 
      username: 'follower', 
      password_hash: '$2b$10$O.PdNnKfn/iDPgACnmhXZe4aQJ2g/o7q8UF53pTHOppQDF/pqeNfi' // plaintext: followerpass
    }
  ]);
};
