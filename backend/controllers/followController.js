const jwt = require('jsonwebtoken');
const follows = require('../models/followModel');
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

exports.follow = asyncHandler(async (req, res) => {
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
  const follower_id = payload.sub;
  const followee_id = Number(req.params.userid);
  if (!followee_id) {
    const e = new Error('Invalid target user id');
    e.status = 400;
    throw e;
  }
  const result = await follows.follow({ follower_id, followee_id });
  return send(res, { data: result, raw: true });
});

exports.unfollow = asyncHandler(async (req, res) => {
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
  const follower_id = payload.sub;
  const followee_id = Number(req.params.userid);
  if (!followee_id) {
    const e = new Error('Invalid target user id');
    e.status = 400;
    throw e;
  }
  const result = await follows.unfollow({ follower_id, followee_id });
  return send(res, { data: result, raw: true });
});

exports.listFollowing = asyncHandler(async (req, res) => {
  const { id } = req.params; // user id
  const result = await follows.listFollowing(Number(id));
  return send(res, { data: result, raw: true });
});

exports.listFollowers = asyncHandler(async (req, res) => {
  const { id } = req.params; // user id
  const result = await follows.listFollowers(Number(id));
  return send(res, { data: result, raw: true });
});

exports.feed = asyncHandler(async (req, res) => {
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
  const viewerId = Number(payload.sub);
  const limit = req.query.limit ? Math.max(1, Number(req.query.limit)) : 20;
  const page = req.query.page ? Math.max(1, Number(req.query.page)) : null;
  const offset = page ? (page - 1) * limit : (req.query.offset ? Number(req.query.offset) : 0);
  const result = await posts.feedForUser(viewerId, { limit, offset });
  return send(res, { data: result, raw: true });
});
