const { findProductionConfigProblems } = require('../../src/config/validateProductionEnv');

const STRONG_SECRET_A = 'a'.repeat(32);
const STRONG_SECRET_B = 'b'.repeat(32);

function validConfig(overrides = {}) {
  return {
    JWT_ACCESS_SECRET: STRONG_SECRET_A,
    JWT_REFRESH_SECRET: STRONG_SECRET_B,
    ZAAD_WEBHOOK_SECRET: 'a-real-zaad-secret-set-by-the-operator',
    EDAHAB_WEBHOOK_SECRET: 'a-real-edahab-secret-set-by-the-operator',
    CORS_ORIGIN: 'https://admin.zaaddahab.example',
    ...overrides,
  };
}

describe('findProductionConfigProblems', () => {
  it('reports no problems for a fully-configured production environment', () => {
    expect(findProductionConfigProblems(validConfig())).toEqual([]);
  });

  it('flags a JWT access secret shorter than 32 characters', () => {
    const problems = findProductionConfigProblems(validConfig({ JWT_ACCESS_SECRET: 'too-short' }));
    expect(problems).toEqual(expect.arrayContaining([expect.stringContaining('JWT_ACCESS_SECRET')]));
  });

  it('flags a JWT refresh secret shorter than 32 characters', () => {
    const problems = findProductionConfigProblems(validConfig({ JWT_REFRESH_SECRET: 'too-short' }));
    expect(problems).toEqual(expect.arrayContaining([expect.stringContaining('JWT_REFRESH_SECRET')]));
  });

  it('flags identical access and refresh secrets', () => {
    const problems = findProductionConfigProblems(
      validConfig({ JWT_REFRESH_SECRET: STRONG_SECRET_A }),
    );
    expect(problems).toEqual(
      expect.arrayContaining([expect.stringContaining('must not be the same value')]),
    );
  });

  it('flags the Zaad webhook secret left at its sandbox default', () => {
    const problems = findProductionConfigProblems(
      validConfig({ ZAAD_WEBHOOK_SECRET: 'dev-zaad-webhook-secret' }),
    );
    expect(problems).toEqual(expect.arrayContaining([expect.stringContaining('ZAAD_WEBHOOK_SECRET')]));
  });

  it('flags the e-Dahab webhook secret left at its sandbox default', () => {
    const problems = findProductionConfigProblems(
      validConfig({ EDAHAB_WEBHOOK_SECRET: 'dev-edahab-webhook-secret' }),
    );
    expect(problems).toEqual(
      expect.arrayContaining([expect.stringContaining('EDAHAB_WEBHOOK_SECRET')]),
    );
  });

  it('flags a missing or wildcard CORS origin', () => {
    expect(findProductionConfigProblems(validConfig({ CORS_ORIGIN: undefined }))).toEqual(
      expect.arrayContaining([expect.stringContaining('CORS_ORIGIN')]),
    );
    expect(findProductionConfigProblems(validConfig({ CORS_ORIGIN: '*' }))).toEqual(
      expect.arrayContaining([expect.stringContaining('CORS_ORIGIN')]),
    );
  });

  it('reports every problem at once rather than stopping at the first', () => {
    const problems = findProductionConfigProblems({});
    expect(problems.length).toBeGreaterThanOrEqual(4);
  });
});
