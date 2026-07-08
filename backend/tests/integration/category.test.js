const request = require('supertest');
const app = require('../../src/app');
const { registerUser } = require('../helpers/factory');

describe('Category API', () => {
  it('rejects category creation from non-admins', async () => {
    const customer = await registerUser();
    const res = await request(app)
      .post('/api/v1/categories')
      .set('Authorization', `Bearer ${customer.accessToken}`)
      .send({ name: 'Supplements' });

    expect(res.status).toBe(403);
  });

  it('allows admins to create, list, update, and delete categories', async () => {
    const admin = await registerUser({ role: 'admin' });

    const createRes = await request(app)
      .post('/api/v1/categories')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ name: 'Supplements', description: 'Daily wellness' });

    expect(createRes.status).toBe(201);
    expect(createRes.body.data.slug).toBe('supplements');

    const categoryId = createRes.body.data._id;

    const listRes = await request(app).get('/api/v1/categories');
    expect(listRes.status).toBe(200);
    expect(listRes.body.data.some((c) => c._id === categoryId)).toBe(true);

    const updateRes = await request(app)
      .patch(`/api/v1/categories/${categoryId}`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ description: 'Updated description' });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.description).toBe('Updated description');

    const deleteRes = await request(app)
      .delete(`/api/v1/categories/${categoryId}`)
      .set('Authorization', `Bearer ${admin.accessToken}`);

    expect(deleteRes.status).toBe(200);
  });

  it('generates a distinct slug when two different names would collide', async () => {
    const admin = await registerUser({ role: 'admin' });

    const first = await request(app)
      .post('/api/v1/categories')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ name: 'Personal Care' });
    expect(first.status).toBe(201);
    expect(first.body.data.slug).toBe('personal-care');

    const second = await request(app)
      .post('/api/v1/categories')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ name: 'Personal Care!!' });

    expect(second.status).toBe(201);
    expect(second.body.data.slug).toBe('personal-care-2');
  });

  it('rejects creating a category with an already-used exact name', async () => {
    const admin = await registerUser({ role: 'admin' });

    const first = await request(app)
      .post('/api/v1/categories')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ name: 'Devices & Monitors' });
    expect(first.status).toBe(201);

    const duplicate = await request(app)
      .post('/api/v1/categories')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ name: 'Devices & Monitors' });

    expect(duplicate.status).toBe(409);
  });

  it('blocks deleting a category that still has medicines assigned', async () => {
    const admin = await registerUser({ role: 'admin' });
    const pharmacist = await registerUser({ role: 'pharmacist' });

    await request(app)
      .post('/api/v1/pharmacies')
      .set('Authorization', `Bearer ${pharmacist.accessToken}`)
      .send({
        name: 'Test Pharmacy',
        phone: '+252611111111',
        licenseNumber: `LIC-${Date.now()}`,
        address: { street: '1 Main St', city: 'Hargeisa' },
      });

    const categoryRes = await request(app)
      .post('/api/v1/categories')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ name: 'Devices' });

    await request(app)
      .post('/api/v1/medicines')
      .set('Authorization', `Bearer ${pharmacist.accessToken}`)
      .send({
        name: 'SmartScan Pro',
        category: categoryRes.body.data._id,
        unit: 'Digital Thermometer',
        price: 18.9,
        stock: 5,
      });

    const deleteRes = await request(app)
      .delete(`/api/v1/categories/${categoryRes.body.data._id}`)
      .set('Authorization', `Bearer ${admin.accessToken}`);

    expect(deleteRes.status).toBe(409);
  });
});
