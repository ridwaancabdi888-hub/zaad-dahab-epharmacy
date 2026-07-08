const request = require('supertest');
const app = require('../../src/app');
const { registerUser, buildCatalogFixture } = require('../helpers/factory');

const address = { street: '45 Wellness Ave', city: 'Mogadishu' };

async function checkoutOrder(customerToken, medicineId, paymentMethod = 'zaad') {
  await request(app)
    .post('/api/v1/cart/items')
    .set('Authorization', `Bearer ${customerToken}`)
    .send({ medicineId, quantity: 1 });

  const res = await request(app)
    .post('/api/v1/orders')
    .set('Authorization', `Bearer ${customerToken}`)
    .send({ deliveryAddress: address, paymentMethod });

  return res.body.data;
}

describe('Payment API', () => {
  it('creates a processing payment for mobile-money methods on checkout', async () => {
    const admin = await registerUser({ role: 'admin' });
    const customer = await registerUser();
    const { medicine } = await buildCatalogFixture(admin.accessToken, { stock: 5, price: 10 });

    const { payment } = await checkoutOrder(customer.accessToken, medicine._id, 'edahab');

    expect(payment.status).toBe('processing');
    expect(payment.providerReference).toMatch(/^EDAHAB-/);
  });

  it('creates a pending cash-on-delivery payment', async () => {
    const admin = await registerUser({ role: 'admin' });
    const customer = await registerUser();
    const { medicine } = await buildCatalogFixture(admin.accessToken, { stock: 5, price: 10 });

    const { payment } = await checkoutOrder(customer.accessToken, medicine._id, 'cod');

    expect(payment.status).toBe('pending');
    expect(payment.providerReference).toMatch(/^COD-/);
  });

  it('forbids other customers from viewing someone else’s payment', async () => {
    const admin = await registerUser({ role: 'admin' });
    const customer = await registerUser();
    const stranger = await registerUser();
    const { medicine } = await buildCatalogFixture(admin.accessToken, { stock: 5, price: 10 });

    const { payment } = await checkoutOrder(customer.accessToken, medicine._id);

    const res = await request(app)
      .get(`/api/v1/payments/${payment._id}`)
      .set('Authorization', `Bearer ${stranger.accessToken}`);

    expect(res.status).toBe(403);
  });

  it('lets an admin confirm a sandbox payment', async () => {
    const admin = await registerUser({ role: 'admin' });
    const customer = await registerUser();
    const { medicine } = await buildCatalogFixture(admin.accessToken, { stock: 5, price: 10 });

    const { payment } = await checkoutOrder(customer.accessToken, medicine._id, 'zaad');

    const confirmRes = await request(app)
      .post(`/api/v1/payments/${payment._id}/confirm`)
      .set('Authorization', `Bearer ${admin.accessToken}`);

    expect(confirmRes.status).toBe(200);
    expect(confirmRes.body.data.status).toBe('completed');
    expect(confirmRes.body.data.paidAt).not.toBeNull();
  });

  it('forbids non-admins from confirming payments and listing all payments', async () => {
    const admin = await registerUser({ role: 'admin' });
    const customer = await registerUser();
    const { medicine } = await buildCatalogFixture(admin.accessToken, { stock: 5, price: 10 });

    const { payment } = await checkoutOrder(customer.accessToken, medicine._id, 'zaad');

    const confirmRes = await request(app)
      .post(`/api/v1/payments/${payment._id}/confirm`)
      .set('Authorization', `Bearer ${customer.accessToken}`);
    expect(confirmRes.status).toBe(403);

    const listRes = await request(app)
      .get('/api/v1/payments')
      .set('Authorization', `Bearer ${customer.accessToken}`);
    expect(listRes.status).toBe(403);
  });
});
