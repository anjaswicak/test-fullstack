const knex = require('../db/knex');

const TABLE = 'posts';

async function create({ user_id, content }) {
    if (!user_id) throw new Error('user_id is required');
    if (!content) throw new Error('content is required');
    if (content.length > 200) throw new Error('content exceeds 200 characters');
    const [post] = await knex(TABLE)
        .insert({ user_id, content })
        .returning(['id', 'user_id', 'content', 'created_at']);

    return {id: post.id, userid: post.user_id, content: post.content, created_at: post.created_at };
}

function findAll() {
    return knex(TABLE)
        .select('id', 'user_id', 'content', 'created_at', 'updated_at')
        .orderBy('id');
}

function findById(id) {
    return knex(TABLE)
        .select('id', 'user_id', 'content', 'created_at', 'updated_at')
        .where({ id })
        .first();
}

async function updateById(id, { content }) {
    const patch = {};
    if (content) patch.content = content;
    if (Object.keys(patch).length === 0) return findById(id);

    const [post] = await knex(TABLE)
        .where({ id })
        .update(patch)
        .returning(['id', 'user_id', 'content', 'created_at', 'updated_at']);
    return post;
}

async function deleteById(id) {
    const deleted = await knex(TABLE).where({ id }).del();
    return { deleted };
}

function feedForUser(userId, { limit = 20, offset = 0 } = {}) {
    return knex({ p: TABLE })
        .join({ u: 'users' }, 'u.id', 'p.user_id')
        .where((qb) => {
            qb.whereIn('p.user_id', function () {
                this.select('followee_id').from('follows').where('follower_id', userId);
            }).orWhere('p.user_id', userId);
        })
        .select(
            'p.id',
            'p.user_id',
            'u.username as author',
            'p.content',
            'p.created_at',
            'p.updated_at'
        )
        .orderBy('p.created_at', 'desc')
        .limit(limit)
        .offset(offset);
}

module.exports = {
    create,
    findAll,
    findById,
    updateById,
    deleteById,
    feedForUser,
};
