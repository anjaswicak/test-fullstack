function buildEnvelope({ status = 200, data = null, message = null, error = null, meta = null } = {}) {
  const ok = status >= 200 && status < 400;
  return {
    ok,
    data,
    message,
    error,
    meta,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Send a JSON response.
 * Options:
 *  - status: HTTP status code (default 200)
 *  - data, message, error, meta: payload
 *  - raw: when true, send `data` directly without envelope (keeps backward compatibility)
 */
function send(res, { status = 200, data = null, message = null, error = null, meta = null, raw = false } = {}) {
  if (raw) return res.status(status).json(data);
  const body = buildEnvelope({ status, data, message, error, meta });
  return res.status(status).json(body);
}

/** Build a response object (no res involved) useful within models/services */
function make({ status = 200, data = null, message = null, error = null, meta = null } = {}) {
  return { status, ...buildEnvelope({ status, data, message, error, meta }) };
}

module.exports = { buildEnvelope, send, make };
/**
 * One function usable in both controllers and models.
 * - Controller usage: respond(res, { status, data, message, error, meta, raw }) -> sends JSON
 * - Model/service usage: respond({ status, data, message, error, meta }) -> returns object
 */
function respond(arg1, arg2) {
  const looksLikeRes = arg1 && typeof arg1.status === 'function' && typeof arg1.json === 'function';
  if (looksLikeRes) {
    const res = arg1;
    const opts = arg2 || {};
    return send(res, opts);
  }
  const opts = arg1 || {};
  return make(opts);
}

module.exports.respond = respond;
