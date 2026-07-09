/**
 * Escapes regex metacharacters so a string can be safely interpolated
 * into a `RegExp` as a literal match, not a pattern. Required anywhere
 * user input builds a Mongo `$regex` filter (e.g. `pharmacy.service.js`'s
 * `city` filter) — without it, unauthenticated input can trigger
 * catastrophic-backtracking ReDoS or match unintended documents via
 * regex metacharacters.
 */
function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

module.exports = escapeRegExp;
