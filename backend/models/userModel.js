const knex = require('../db/knex');
const bcrypt = require('bcrypt');

const TABLE = 'users';

async function create({ username, password }) {
    if (!username) throw new Error('username is required');
    if (!password) throw new Error('password is required');

    const password_hash = await bcrypt.hash(password, 10);
    try {
        const [user] = await knex(TABLE)
            .insert({ username, password_hash })
            .returning(['id', 'username', 'created_at', 'updated_at']);
        return user;
    } catch (err) {
        // Postgres unique violation
        // if (err && err.code === '23505') {
            // Either username unique or PK sequence drift; try to check by username existence
            const exists = await knex(TABLE).where({ username }).first('id');
            if (exists) {
                const e = new Error('Conflict');
                e.status = 409;
                throw e;
            }else{
                throw err;
            }
        // }
        // throw err;
    }
}

async function authenticate(username, password) {
    const user = await knex(TABLE).where({ username }).first();
    if (!user) return null;
    const match = await bcrypt.compare(password, user.password_hash);
    if (match) {
        // return user without password_hash
        // eslint-disable-next-line no-unused-vars
        const { password_hash, ...rest } = user;
        return rest;
    }
    return null;
}
function findAll() {
    return knex(TABLE).select('id', 'username', 'created_at', 'updated_at').orderBy('id');
}

function findById(id) {
    return knex(TABLE).select('id', 'username', 'created_at', 'updated_at').where({ id }).first();
}

async function updateById(id, { username, password }) {
    const patch = {};
    if (username) patch.username = username;
    if (password) patch.password_hash = await bcrypt.hash(password, 10);
    if (Object.keys(patch).length === 0) return findById(id);

    const [user] = await knex(TABLE)
        .where({ id })
        .update(patch)
        .returning(['id', 'username', 'created_at', 'updated_at']);
    return user;
}

async function deleteById(id) {
    const deleted = await knex(TABLE).where({ id }).del();
    return { deleted };
}

async function listWithStats(viewerId, { limit = 20, offset = 0 } = {}) {
    // exclude the viewer
    const base = knex({ u: TABLE })
        .whereNot('u.id', viewerId)
        .select(
            'u.id',
            'u.username',
            knex('posts as p').count('*').whereRaw('p.user_id = u.id').as('posts_count'),
            knex('follows as f1').count('*').whereRaw('f1.followee_id = u.id').as('followers_count'),
            knex('follows as f2').count('*').where({ follower_id: viewerId }).whereRaw('f2.followee_id = u.id').as('is_following')
        )
        .orderBy('u.username')
        .limit(limit)
        .offset(offset);

    const rows = await base;
    return rows.map((r) => ({
        id: r.id,
        username: r.username,
        posts_count: Number(r.posts_count || 0),
        followers_count: Number(r.followers_count || 0),
        is_following: Number(r.is_following || 0) > 0,
    }));
}

module.exports = {
    create,
    authenticate,
    findAll,
    findById,
    updateById,
    deleteById,
    listWithStats,
};
