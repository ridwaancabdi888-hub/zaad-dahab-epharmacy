const request = require('supertest');
const app = require('../../src/app');
const { registerUser, buildCatalogFixture } = require('../helpers/factory');

// Audit-log writes happen fire-and-forget on `res.on('finish')` so they
// never slow down or risk breaking the request they're observing — give
// that write a moment to land before asserting on it.
const flush = () => new Promise((resolve) => setTimeout(resolve, 50));

describe('Audit Log API', () => {
  it('rejects non-admins', async () => {
    const customer = await registerUser();
    const res = await request(app)
      .get('/api/v1/audit-logs')
      .set('Authorization', `Bearer ${customer.accessToken}`);
    expect(res.status).toBe(403);
  });

  it('records a category create and a medicine create/update/delete, then lists them for admin', async () => {
    const admin = await registerUser({ role: 'admin' });
    const { medicine } = await buildCatalogFixture(admin.accessToken, { stock: 5, price: 9 });

    const updateRes = await request(app)
      .patch(`/api/v1/medicines/${medicine._id}`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ price: 12 });
    expect(updateRes.status).toBe(200);

    const deleteRes = await request(app)
      .delete(`/api/v1/medicines/${medicine._id}`)
      .set('Authorization', `Bearer ${admin.accessToken}`);
    expect(deleteRes.status).toBe(200);

    await flush();

    const listRes = await request(app)
      .get('/api/v1/audit-logs')
      .set('Authorization', `Bearer ${admin.accessToken}`);

    expect(listRes.status).toBe(200);
    const { items, meta } = listRes.body.data;
    expect(meta.total).toBeGreaterThanOrEqual(3);

    const actions = items.map((entry) => entry.action);
    expect(actions).toEqual(
      expect.arrayContaining(['category.create', 'medicine.create', 'medicine.update', 'medicine.delete']),
    );

    const medicineUpdateEntry = items.find((entry) => entry.action === 'medicine.update');
    expect(medicineUpdateEntry.resourceId).toBe(medicine._id);
    expect(medicineUpdateEntry.resourceType).toBe('Medicine');
    expect(medicineUpdateEntry.actor._id).toBe(admin.user._id);
  });

  it('filters by action and resourceType', async () => {
    const admin = await registerUser({ role: 'admin' });
    await buildCatalogFixture(admin.accessToken, { stock: 5, price: 9 });
    await flush();

    const res = await request(app)
      .get('/api/v1/audit-logs')
      .query({ action: 'category.create', resourceType: 'Category' })
      .set('Authorization', `Bearer ${admin.accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.items.length).toBeGreaterThanOrEqual(1);
    expect(res.body.data.items.every((entry) => entry.action === 'category.create')).toBe(true);
  });

  it('does not log failed (non-2xx) requests', async () => {
    const admin = await registerUser({ role: 'admin' });

    const badRes = await request(app)
      .patch('/api/v1/medicines/000000000000000000000000')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ price: 5 });
    expect(badRes.status).toBe(404);

    await flush();

    const listRes = await request(app)
      .get('/api/v1/audit-logs')
      .query({ action: 'medicine.update' })
      .set('Authorization', `Bearer ${admin.accessToken}`);
    expect(listRes.body.data.items).toHaveLength(0);
  });
});
