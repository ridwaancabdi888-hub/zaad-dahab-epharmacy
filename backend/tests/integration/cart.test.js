const request = require('supertest');
const app = require('../../src/app');
const { registerUser, buildCatalogFixture } = require('../helpers/factory');

describe('Cart API', () => {
  it('requires authentication', async () => {
    const res = await request(app).get('/api/v1/cart');
    expect(res.status).toBe(401);
  });

  it('starts empty and supports add/update/remove/clear', async () => {
    const admin = await registerUser({ role: 'admin' });
    const customer = await registerUser();
    const { medicine } = await buildCatalogFixture(admin.accessToken, { stock: 10, price: 10 });

    const emptyCart = await request(app)
      .get('/api/v1/cart')
      .set('Authorization', `Bearer ${customer.accessToken}`);
    expect(emptyCart.body.data.items).toHaveLength(0);

    const addRes = await request(app)
      .post('/api/v1/cart/items')
      .set('Authorization', `Bearer ${customer.accessToken}`)
      .send({ medicineId: medicine._id, quantity: 2 });

    expect(addRes.status).toBe(200);
    expect(addRes.body.data.items).toHaveLength(1);
    expect(addRes.body.data.subtotal).toBe(20);

    const addAgainRes = await request(app)
      .post('/api/v1/cart/items')
      .set('Authorization', `Bearer ${customer.accessToken}`)
      .send({ medicineId: medicine._id, quantity: 1 });
    expect(addAgainRes.body.data.items[0].quantity).toBe(3);

    const updateRes = await request(app)
      .patch(`/api/v1/cart/items/${medicine._id}`)
      .set('Authorization', `Bearer ${customer.accessToken}`)
      .send({ quantity: 5 });
    expect(updateRes.body.data.items[0].quantity).toBe(5);
    expect(updateRes.body.data.subtotal).toBe(50);

    const removeRes = await request(app)
      .delete(`/api/v1/cart/items/${medicine._id}`)
      .set('Authorization', `Bearer ${customer.accessToken}`);
    expect(removeRes.body.data.items).toHaveLength(0);

    await request(app)
      .post('/api/v1/cart/items')
      .set('Authorization', `Bearer ${customer.accessToken}`)
      .send({ medicineId: medicine._id, quantity: 1 });

    const clearRes = await request(app)
      .delete('/api/v1/cart')
      .set('Authorization', `Bearer ${customer.accessToken}`);
    expect(clearRes.body.data.items).toHaveLength(0);
  });

  it('rejects adding more than the available stock', async () => {
    const admin = await registerUser({ role: 'admin' });
    const customer = await registerUser();
    const { medicine } = await buildCatalogFixture(admin.accessToken, { stock: 2 });

    const res = await request(app)
      .post('/api/v1/cart/items')
      .set('Authorization', `Bearer ${customer.accessToken}`)
      .send({ medicineId: medicine._id, quantity: 5 });

    expect(res.status).toBe(400);
  });
});
