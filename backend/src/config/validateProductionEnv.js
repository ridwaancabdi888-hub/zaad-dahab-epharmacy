const DEV_WEBHOOK_SECRETS = ['dev-zaad-webhook-secret', 'dev-edahab-webhook-secret'];
const MIN_SECRET_LENGTH = 32;

/**
 * Checks a set of environment variables for production-unsafe defaults:
 * a short/guessable JWT secret, a webhook secret still set to its
 * well-known sandbox default (letting anyone forge a "payment confirmed"
 * webhook — see `paymentGateway.service.js`), or a wildcard CORS origin
 * combined with `credentials: true` (see `app.js`), which is never
 * correct for a cookie/credentialed API. Pure function, no side effects,
 * so it's directly unit-testable — `env.js` calls it at require-time and
 * throws if it returns anything.
 */
function findProductionConfigProblems(vars) {
  const problems = [];

  if ((vars.JWT_ACCESS_SECRET || '').length < MIN_SECRET_LENGTH) {
    problems.push(`JWT_ACCESS_SECRET must be at least ${MIN_SECRET_LENGTH} characters`);
  }
  if ((vars.JWT_REFRESH_SECRET || '').length < MIN_SECRET_LENGTH) {
    problems.push(`JWT_REFRESH_SECRET must be at least ${MIN_SECRET_LENGTH} characters`);
  }
  if (vars.JWT_ACCESS_SECRET && vars.JWT_ACCESS_SECRET === vars.JWT_REFRESH_SECRET) {
    problems.push('JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must not be the same value');
  }
  if (!vars.ZAAD_WEBHOOK_SECRET || DEV_WEBHOOK_SECRETS.includes(vars.ZAAD_WEBHOOK_SECRET)) {
    problems.push('ZAAD_WEBHOOK_SECRET must be set to a real secret (not left unset or at its sandbox default)');
  }
  if (!vars.EDAHAB_WEBHOOK_SECRET || DEV_WEBHOOK_SECRETS.includes(vars.EDAHAB_WEBHOOK_SECRET)) {
    problems.push('EDAHAB_WEBHOOK_SECRET must be set to a real secret (not left unset or at its sandbox default)');
  }
  if (!vars.CORS_ORIGIN || vars.CORS_ORIGIN === '*') {
    problems.push('CORS_ORIGIN must be set to a real origin (not "*") in production');
  }

  return problems;
}

module.exports = { findProductionConfigProblems, MIN_SECRET_LENGTH, DEV_WEBHOOK_SECRETS };
