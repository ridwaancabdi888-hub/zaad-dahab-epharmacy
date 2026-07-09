const request = require('supertest');
const app = require('../../src/app');
const { registerUser } = require('../helpers/factory');

async function createCoupon(adminToken, overrides = {}) {
  const res = await request(app)
    .post('/api/v1/coupons')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      code: overrides.code || `SAVE${Date.now()}`,
      type: overrides.type || 'percentage',
      value: overrides.value ?? 10,
      ...overrides,
    });
  return res;
}

describe('Coupon API (admin CRUD)', () => {
  it('rejects non-admins from creating or listing coupons', async () => {
    const customer = await registerUser();

    const createRes = await request(app)
      .post('/api/v1/coupons')
      .set('Authorization', `Bearer ${customer.accessToken}`)
      .send({ code: 'TEST10', type: 'percentage', value: 10 });
    expect(createRes.status).toBe(403);

    const listRes = await request(app)
      .get('/api/v1/coupons')
      .set('Authorization', `Bearer ${customer.accessToken}`);
    expect(listRes.status).toBe(403);
  });

  it('creates, lists, updates, and deletes a coupon', async () => {
    const admin = await registerUser({ role: 'admin' });

    const createRes = await createCoupon(admin.accessToken, { code: 'WELCOME10' });
    expect(createRes.status).toBe(201);
    expect(createRes.body.data.code).toBe('WELCOME10');

    const couponId = createRes.body.data._id;

    const listRes = await request(app)
      .get('/api/v1/coupons')
      .set('Authorization', `Bearer ${admin.accessToken}`);
    expect(listRes.status).toBe(200);
    expect(listRes.body.data.items.some((c) => c._id === couponId)).toBe(true);

    const updateRes = await request(app)
      .patch(`/api/v1/coupons/${couponId}`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ isActive: false });
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.isActive).toBe(false);

    const deleteRes = await request(app)
      .delete(`/api/v1/coupons/${couponId}`)
      .set('Authorization', `Bearer ${admin.accessToken}`);
    expect(deleteRes.status).toBe(200);
  });

  it('rejects a percentage coupon with a value over 100', async () => {
    const admin = await registerUser({ role: 'admin' });
    const res = await createCoupon(admin.accessToken, { code: 'TOOBIG', type: 'percentage', value: 150 });
    expect(res.status).toBe(400);
  });

  it('rejects creating a coupon with a duplicate code', async () => {
    const admin = await registerUser({ role: 'admin' });
    await createCoupon(admin.accessToken, { code: 'DUPE10' });
    const res = await createCoupon(admin.accessToken, { code: 'DUPE10' });
    expect(res.status).toBe(409);
  });
});
