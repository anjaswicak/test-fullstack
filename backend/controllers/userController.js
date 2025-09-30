const users = require('../models/userModel');
const jwt = require('jsonwebtoken');
const { send } = require('../utils/response');

function asyncHandler(fn) {
  return (req, res) => Promise.resolve(fn(req, res)).catch((err) => {
    console.error(err);
    const status = err.status || err.statusCode || 400;
    res.status(status).json({ error: err.message || 'Bad Request' });
  });
}

exports.register = asyncHandler(async (req, res) => {
  const user = await users.create(req.body);
  return send(res, { status: 201, data: {id: user.id, username: user.username}, raw: true });
});

function signTokens(payload) {
  const token = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET || 'dev_access_secret', {
    expiresIn: process.env.ACCESS_TOKEN_LIFE || '15m',
  });
  const refreshToken = jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET || 'dev_refresh_secret', {
    expiresIn: process.env.REFRESH_TOKEN_LIFE || '7d',
  });
  return { token, refreshToken };
}

exports.login = asyncHandler(async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return send(res, { status: 400, data: { error: 'Username and password are required' }, raw: true });
  }
  const user = await users.authenticate(username, password);
  if (!user) {
    return send(res, { status: 401, data: { error: 'Invalid email or password' }, raw: true });
  }
  const payload = { sub: user.id, username: user.username };
  const { token, refreshToken } = signTokens(payload);
  // Set httpOnly refresh cookie
  res.cookie('refresh_token', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/api',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
  return send(res, { data: { token }, raw: true });
});

exports.list = asyncHandler(async (req, res) => {
  const list = await users.findAll();
  return send(res, { data: list, raw: true });
});

exports.get = asyncHandler(async (req, res) => {
  const user = await users.findById(Number(req.params.id));
  if (!user) return send(res, { status: 404, data: { error: 'Not found' }, raw: true });
  return send(res, { data: user, raw: true });
});

exports.update = asyncHandler(async (req, res) => {
  const user = await users.updateById(Number(req.params.id), req.body);
  if (!user) return send(res, { status: 404, data: { error: 'Not found' }, raw: true });
  return send(res, { data: user, raw: true });
});

exports.remove = asyncHandler(async (req, res) => {
  const result = await users.deleteById(Number(req.params.id));
  return send(res, { data: result, raw: true });
});

exports.listWithStats = asyncHandler(async (req, res) => {
  const viewerId = Number(req.params.id);
  const limit = req.query.limit ? Number(req.query.limit) : 20;
  const offset = req.query.offset ? Number(req.query.offset) : 0;
  const list = await users.listWithStats(viewerId, { limit, offset });
  return send(res, { data: list, raw: true });
});

exports.refresh = asyncHandler(async (req, res) => {
  const token = req.cookies?.refresh_token;
  if (!token) return res.status(401).json({ error: 'No refresh token' });
  try {
    const payload = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET || 'dev_refresh_secret');
    const { accessToken, refreshToken } = signTokens({ sub: payload.sub, username: payload.username });
    // rotate refresh token
    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/api',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
  return send(res, { data: { accessToken }, raw: true });
  } catch (e) {
  return send(res, { status: 401, data: { error: 'Invalid refresh token' }, raw: true });
  }
});

exports.logout = asyncHandler(async (req, res) => {
  res.clearCookie('refresh_token', { path: '/api' });
  return send(res, { data: { ok: true }, raw: true });
});
