const knex = require('../db/knex');

const TABLE = 'follows';

async function follow({ follower_id, followee_id }) {
    if (!follower_id) throw new Error('follower_id is required');
    if (!followee_id) throw new Error('followee_id is required');
    if (follower_id === followee_id) throw new Error('cannot follow yourself');

    const query = knex(TABLE)
        .insert({ follower_id, followee_id })
        .onConflict(['follower_id', 'followee_id'])
        .ignore();


    const result = await query;
    const inserted = Array.isArray(result) ? result.length > 0 : !!result;
    return { message: inserted ? `you are now following user ${followee_id}` : `you already follow user ${followee_id}` };

}

async function unfollow({ follower_id, followee_id }) {
    if (!follower_id) throw new Error('follower_id is required');
    if (!followee_id) throw new Error('followee_id is required');

    const deleted = await knex(TABLE)
        .where({ follower_id, followee_id })
        .del();
    return { message: `you unfollowed user ${followee_id}` };
}

function listFollowing(follower_id) {
    return knex(`${TABLE} as f`)
        .join('users as u', 'u.id', 'f.followee_id')
        .where('f.follower_id', follower_id)
        .select('u.id', 'u.username');
}

function listFollowers(followee_id) {
    return knex(`${TABLE} as f`)
        .join('users as u', 'u.id', 'f.follower_id')
        .where('f.followee_id', followee_id)
        .select('u.id', 'u.username');
}

module.exports = {
    follow,
    unfollow,
    listFollowing,
    listFollowers,
};
