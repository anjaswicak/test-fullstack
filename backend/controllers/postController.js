const jwt = require('jsonwebtoken');
const posts = require('../models/postModel');
const { send } = require('../utils/response');

function asyncHandler(fn) {
    return (req, res) => Promise.resolve(fn(req, res)).catch((err) => {
        console.error(err);
        const status = err.status || err.statusCode || 400;
        return send(res, { status, data: { error: err.message || 'Bad Request' }, raw: true });
    });
}

function getBearerToken(req) {
    const auth = req.headers?.authorization || '';
    if (!auth.toLowerCase().startsWith('bearer ')) return null;
    return auth.slice(7).trim();
}

exports.create = asyncHandler(async (req, res) => {
    const token = getBearerToken(req);
    if (!token) {
        const e = new Error('Missing bearer token');
        e.status = 401;
        throw e;
    }
    let payload;
    try {
        payload = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET || 'dev_access_secret');
    } catch (err) {
        const e = new Error('Invalid or expired token');
        e.status = 401;
        throw e;
    }
    const user_id = payload.sub;
    const content = (req.body && req.body.content) || '';
    if (!content || !content.trim()) {
        const e = new Error('content is required');
        e.status = 400;
        throw e;
    }
    const post = await posts.create({ user_id, content: content.trim() });
    // Return raw shape expected by frontend: id, user_id, content, created_at
    return send(res, { status: 201, data: post, raw: true });
});

exports.list = asyncHandler(async (req, res) => {
    const list = await posts.findAll();
    return send(res, { data: list, raw: true });
});

exports.get = asyncHandler(async (req, res) => {
    const post = await posts.findById(Number(req.params.id));
    if (!post) return send(res, { status: 404, data: { error: 'Not found' }, raw: true });
    return send(res, { data: post, raw: true });
});

exports.update = asyncHandler(async (req, res) => {
    const post = await posts.updateById(Number(req.params.id), req.body);
    if (!post) return send(res, { status: 404, data: { error: 'Not found' }, raw: true });
    return send(res, { data: post, raw: true });
});

exports.remove = asyncHandler(async (req, res) => {
    const result = await posts.deleteById(Number(req.params.id));
    return send(res, { data: result, raw: true });
});
