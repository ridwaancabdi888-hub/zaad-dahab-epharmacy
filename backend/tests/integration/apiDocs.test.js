const request = require('supertest');
const app = require('../../src/app');

describe('API documentation', () => {
  it('serves a valid OpenAPI document as JSON', async () => {
    const res = await request(app).get('/api-docs.json');

    expect(res.status).toBe(200);
    expect(res.body.openapi).toBe('3.0.3');
    expect(res.body.info.title).toMatch(/Zaad\/e-Dahab/);
    expect(res.body.paths['/auth/login']).toBeDefined();
    expect(res.body.paths['/orders']).toBeDefined();
    expect(res.body.components.schemas.User).toBeDefined();
  });

  it('serves the interactive Swagger UI page', async () => {
    const res = await request(app).get('/api-docs/');

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/html/);
    expect(res.text).toMatch(/swagger-ui/i);
  });
});
