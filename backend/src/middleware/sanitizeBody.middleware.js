const isPlainObject = (value) => Object.prototype.toString.call(value) === '[object Object]';

function stripDangerousKeys(value) {
  if (Array.isArray(value)) {
    return value.forEach(stripDangerousKeys);
  }
  if (!isPlainObject(value)) {
    return undefined;
  }
  Object.keys(value).forEach((key) => {
    if (key.startsWith('$') || key.includes('.')) {
      delete value[key];
      return;
    }
    stripDangerousKeys(value[key]);
  });
  return undefined;
}

/**
 * Strips Mongo operator keys ($gt, $where, ...) and dotted keys from
 * req.body to prevent NoSQL query injection. Only req.body is mutated:
 * Express 5 exposes req.query/req.params as read-only getters, so
 * reassigning them (as libraries like express-mongo-sanitize do) throws.
 */
function sanitizeBody(req, _res, next) {
  stripDangerousKeys(req.body);
  next();
}

module.exports = sanitizeBody;
