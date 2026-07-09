const auditService = require('../services/audit.service');
const logger = require('../config/logger');

/**
 * Records an audit-log entry for a mutating admin action, after the
 * response has actually been sent successfully. Captures the response
 * body (via a `res.json` override) so a `create` action can log the
 * newly-created resource's id even though it isn't known up front like
 * an update/delete's `req.params.id` is.
 *
 * Logging failures are swallowed (logged, not thrown) so an audit-log
 * write can never break the actual request it's observing.
 */
function auditLog(action, resourceType) {
  return (req, res, next) => {
    const originalJson = res.json.bind(res);
    res.json = (body) => {
      res.locals.auditResponseBody = body;
      return originalJson(body);
    };

    res.on('finish', () => {
      if (!req.user || res.statusCode >= 400) return;

      const body = res.locals.auditResponseBody;
      const resourceId = req.params.id || body?.data?._id || null;

      auditService
        .record({
          actor: req.user._id,
          action,
          resourceType,
          resourceId,
          method: req.method,
          path: req.originalUrl,
          statusCode: res.statusCode,
        })
        .catch((err) => logger.error(`Failed to write audit log: ${err.message}`));
    });

    next();
  };
}

module.exports = auditLog;
