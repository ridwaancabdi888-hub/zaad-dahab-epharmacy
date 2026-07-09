const AuditLog = require('../models/AuditLog');
const { parsePagination, buildMeta } = require('../utils/pagination');

async function record({ actor, action, resourceType, resourceId, method, path, statusCode }) {
  return AuditLog.create({ actor, action, resourceType, resourceId, method, path, statusCode });
}

async function list(query) {
  const { page, limit, skip } = parsePagination(query);
  const filter = {};
  if (query.action) filter.action = query.action;
  if (query.resourceType) filter.resourceType = query.resourceType;
  if (query.actor) filter.actor = query.actor;
  if (query.from || query.to) {
    filter.createdAt = {};
    if (query.from) filter.createdAt.$gte = new Date(query.from);
    if (query.to) filter.createdAt.$lte = new Date(query.to);
  }

  const [items, total] = await Promise.all([
    AuditLog.find(filter)
      .populate('actor', 'name email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    AuditLog.countDocuments(filter),
  ]);

  return { items, meta: buildMeta({ page, limit, total }) };
}

module.exports = { record, list };
