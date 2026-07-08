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

describe('POST /api/v1/auth/forgot-password + reset-password', () => {
  it('returns a generic success response even for an unknown email, without a reset token', async () => {
    const res = await request(app)
      .post('/api/v1/auth/forgot-password')
      .send({ email: 'nobody@example.com' });

    expect(res.status).toBe(200);
    expect(res.body.data.resetToken).toBeUndefined();
  });

  it('issues a reset token in non-production, and it resets the password end to end', async () => {
    await request(app).post('/api/v1/auth/register').send(validUser);

    const forgotRes = await request(app)
      .post('/api/v1/auth/forgot-password')
      .send({ email: validUser.email });
    expect(forgotRes.status).toBe(200);
    const { resetToken } = forgotRes.body.data;
    expect(resetToken).toEqual(expect.any(String));

    const newPassword = 'NewStr0ngPass';
    const resetRes = await request(app)
      .post('/api/v1/auth/reset-password')
      .send({ token: resetToken, password: newPassword });
    expect(resetRes.status).toBe(200);

    const oldLoginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: validUser.email, password: validUser.password });
    expect(oldLoginRes.status).toBe(401);

    const newLoginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: validUser.email, password: newPassword });
    expect(newLoginRes.status).toBe(200);
  });

  it('rejects reusing a reset token twice', async () => {
    await request(app).post('/api/v1/auth/register').send(validUser);
    const forgotRes = await request(app)
      .post('/api/v1/auth/forgot-password')
      .send({ email: validUser.email });
    const { resetToken } = forgotRes.body.data;

    const firstUse = await request(app)
      .post('/api/v1/auth/reset-password')
      .send({ token: resetToken, password: 'AnotherPass1' });
    expect(firstUse.status).toBe(200);

    const secondUse = await request(app)
      .post('/api/v1/auth/reset-password')
      .send({ token: resetToken, password: 'YetAnotherPass1' });
    expect(secondUse.status).toBe(400);
  });

  it('revokes existing refresh tokens after a password reset', async () => {
    const registerRes = await request(app).post('/api/v1/auth/register').send(validUser);
    const { refreshToken } = registerRes.body.data;

    const forgotRes = await request(app)
      .post('/api/v1/auth/forgot-password')
      .send({ email: validUser.email });
    const { resetToken } = forgotRes.body.data;

    await request(app)
      .post('/api/v1/auth/reset-password')
      .send({ token: resetToken, password: 'BrandNewPass1' });

    const refreshRes = await request(app)
      .post('/api/v1/auth/refresh-token')
      .send({ refreshToken });
    expect(refreshRes.status).toBe(401);
  });

  it('rejects a garbage reset token', async () => {
    const res = await request(app)
      .post('/api/v1/auth/reset-password')
      .send({ token: 'not-a-real-token', password: 'SomePass123' });

    expect(res.status).toBe(400);
  });
});
