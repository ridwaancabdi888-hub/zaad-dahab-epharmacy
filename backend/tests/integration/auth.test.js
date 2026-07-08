const request = require('supertest');
const app = require('../../src/app');

const validUser = {
  name: 'Amina Hassan',
  email: 'amina@example.com',
  phone: '+252611234567',
  password: 'Str0ngPass',
};

describe('POST /api/v1/auth/register', () => {
  it('registers a new user and returns tokens', async () => {
    const res = await request(app).post('/api/v1/auth/register').send(validUser);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(validUser.email);
    expect(res.body.data.user.passwordHash).toBeUndefined();
    expect(res.body.data.accessToken).toEqual(expect.any(String));
    expect(res.body.data.refreshToken).toEqual(expect.any(String));
  });

  it('rejects duplicate emails with 409', async () => {
    await request(app).post('/api/v1/auth/register').send(validUser);
    const res = await request(app).post('/api/v1/auth/register').send(validUser);

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it('rejects weak passwords with validation details', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ ...validUser, email: 'weak@example.com', password: 'weak' });

    expect(res.status).toBe(400);
    expect(res.body.details.some((d) => d.field === 'password')).toBe(true);
  });
});

describe('POST /api/v1/auth/login', () => {
  beforeEach(async () => {
    await request(app).post('/api/v1/auth/register').send(validUser);
  });

  it('logs in with correct credentials', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: validUser.email, password: validUser.password });

    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toEqual(expect.any(String));
  });

  it('rejects incorrect password with 401', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: validUser.email, password: 'WrongPass1' });

    expect(res.status).toBe(401);
  });

  it('rejects unknown email with 401', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'nobody@example.com', password: validUser.password });

    expect(res.status).toBe(401);
  });
});

describe('GET /api/v1/users/me', () => {
  it('rejects requests without a token', async () => {
    const res = await request(app).get('/api/v1/users/me');
    expect(res.status).toBe(401);
  });

  it('returns the current user with a valid access token', async () => {
    const registerRes = await request(app).post('/api/v1/auth/register').send(validUser);
    const { accessToken } = registerRes.body.data;

    const res = await request(app)
      .get('/api/v1/users/me')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe(validUser.email);
  });
});

describe('POST /api/v1/auth/refresh-token', () => {
  it('issues a new token pair and rotates the refresh token', async () => {
    const registerRes = await request(app).post('/api/v1/auth/register').send(validUser);
    const { refreshToken } = registerRes.body.data;

    const refreshRes = await request(app).post('/api/v1/auth/refresh-token').send({ refreshToken });

    expect(refreshRes.status).toBe(200);
    expect(refreshRes.body.data.refreshToken).not.toBe(refreshToken);

    const reuseRes = await request(app).post('/api/v1/auth/refresh-token').send({ refreshToken });
    expect(reuseRes.status).toBe(401);
  });

  it('rejects garbage refresh tokens', async () => {
    const res = await request(app)
      .post('/api/v1/auth/refresh-token')
      .send({ refreshToken: 'not-a-real-token' });

    expect(res.status).toBe(401);
  });
});

describe('POST /api/v1/auth/logout', () => {
  it('revokes the refresh token so it can no longer be used', async () => {
    const registerRes = await request(app).post('/api/v1/auth/register').send(validUser);
    const { refreshToken } = registerRes.body.data;

    const logoutRes = await request(app).post('/api/v1/auth/logout').send({ refreshToken });
    expect(logoutRes.status).toBe(200);

    const refreshRes = await request(app).post('/api/v1/auth/refresh-token').send({ refreshToken });
    expect(refreshRes.status).toBe(401);
  });
});
