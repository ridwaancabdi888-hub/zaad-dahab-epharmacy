const request = require('supertest');
const app = require('../../src/app');
const { registerUser, buildCatalogFixture } = require('../helpers/factory');

const address = { street: '45 Wellness Ave', city: 'Mogadishu' };

async function checkoutOrder(customerToken, medicineId, paymentMethod = 'cod') {
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

describe('Delivery API', () => {
  it('creates a pending delivery on checkout and lets admin assign a rider', async () => {
    const admin = await registerUser({ role: 'admin' });
    const customer = await registerUser();
    const rider = await registerUser({ role: 'rider' });
    const { medicine } = await buildCatalogFixture(admin.accessToken, { stock: 5, price: 10 });

    const { delivery } = await checkoutOrder(customer.accessToken, medicine._id);
    expect(delivery.status).toBe('pending');

    const assignRes = await request(app)
      .patch(`/api/v1/deliveries/${delivery._id}/assign`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ riderId: rider.user._id });

    expect(assignRes.status).toBe(200);
    expect(assignRes.body.data.status).toBe('assigned');
    expect(assignRes.body.data.rider._id).toBe(rider.user._id);
  });

  it('rejects assigning a non-rider user', async () => {
    const admin = await registerUser({ role: 'admin' });
    const customer = await registerUser();
    const { medicine } = await buildCatalogFixture(admin.accessToken, { stock: 5, price: 10 });
    const { delivery } = await checkoutOrder(customer.accessToken, medicine._id);

    const res = await request(app)
      .patch(`/api/v1/deliveries/${delivery._id}/assign`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ riderId: customer.user._id });

    expect(res.status).toBe(400);
  });

  it('only lets the assigned rider (or admin) progress the delivery', async () => {
    const admin = await registerUser({ role: 'admin' });
    const customer = await registerUser();
    const riderA = await registerUser({ role: 'rider' });
    const riderB = await registerUser({ role: 'rider' });
    const { medicine } = await buildCatalogFixture(admin.accessToken, { stock: 5, price: 10 });
    const { delivery } = await checkoutOrder(customer.accessToken, medicine._id);

    await request(app)
      .patch(`/api/v1/deliveries/${delivery._id}/assign`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ riderId: riderA.user._id });

    const wrongRiderRes = await request(app)
      .patch(`/api/v1/deliveries/${delivery._id}/status`)
      .set('Authorization', `Bearer ${riderB.accessToken}`)
      .send({ status: 'picked_up' });
    expect(wrongRiderRes.status).toBe(403);

    const rightRiderRes = await request(app)
      .patch(`/api/v1/deliveries/${delivery._id}/status`)
      .set('Authorization', `Bearer ${riderA.accessToken}`)
      .send({ status: 'picked_up' });
    expect(rightRiderRes.status).toBe(200);
  });

  it('rejects invalid delivery status transitions', async () => {
    const admin = await registerUser({ role: 'admin' });
    const customer = await registerUser();
    const rider = await registerUser({ role: 'rider' });
    const { medicine } = await buildCatalogFixture(admin.accessToken, { stock: 5, price: 10 });
    const { delivery } = await checkoutOrder(customer.accessToken, medicine._id);

    await request(app)
      .patch(`/api/v1/deliveries/${delivery._id}/assign`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ riderId: rider.user._id });

    const res = await request(app)
      .patch(`/api/v1/deliveries/${delivery._id}/status`)
      .set('Authorization', `Bearer ${rider.accessToken}`)
      .send({ status: 'delivered' });

    expect(res.status).toBe(400);
  });

  it('cascades to order + payment when a COD delivery is marked delivered', async () => {
    const admin = await registerUser({ role: 'admin' });
    const customer = await registerUser();
    const rider = await registerUser({ role: 'rider' });
    const { medicine } = await buildCatalogFixture(admin.accessToken, { stock: 5, price: 10 });
    const { order, delivery, payment } = await checkoutOrder(customer.accessToken, medicine._id, 'cod');
    expect(payment.status).toBe('pending');

    await request(app)
      .patch(`/api/v1/deliveries/${delivery._id}/assign`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ riderId: rider.user._id });

    for (const status of ['picked_up', 'in_transit', 'delivered']) {
      const res = await request(app)
        .patch(`/api/v1/deliveries/${delivery._id}/status`)
        .set('Authorization', `Bearer ${rider.accessToken}`)
        .send({ status });
      expect(res.status).toBe(200);
    }

    const orderRes = await request(app)
      .get(`/api/v1/orders/${order._id}`)
      .set('Authorization', `Bearer ${customer.accessToken}`);
    expect(orderRes.body.data.status).toBe('delivered');

    const paymentRes = await request(app)
      .get(`/api/v1/payments/order/${order._id}`)
      .set('Authorization', `Bearer ${customer.accessToken}`);
    expect(paymentRes.body.data.status).toBe('completed');
  });

  it('lets a rider update their current location while assigned', async () => {
    const admin = await registerUser({ role: 'admin' });
    const customer = await registerUser();
    const rider = await registerUser({ role: 'rider' });
    const { medicine } = await buildCatalogFixture(admin.accessToken, { stock: 5, price: 10 });
    const { delivery } = await checkoutOrder(customer.accessToken, medicine._id);

    await request(app)
      .patch(`/api/v1/deliveries/${delivery._id}/assign`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ riderId: rider.user._id });

    const res = await request(app)
      .patch(`/api/v1/deliveries/${delivery._id}/location`)
      .set('Authorization', `Bearer ${rider.accessToken}`)
      .send({ lat: 2.0469, lng: 45.3182 });

    expect(res.status).toBe(200);
    expect(res.body.data.currentLocation.lat).toBe(2.0469);
  });

  it('lets a rider list only their own assigned deliveries', async () => {
    const admin = await registerUser({ role: 'admin' });
    const customer = await registerUser();
    const rider = await registerUser({ role: 'rider' });
    const otherRider = await registerUser({ role: 'rider' });
    const { medicine } = await buildCatalogFixture(admin.accessToken, { stock: 5, price: 10 });
    const { delivery } = await checkoutOrder(customer.accessToken, medicine._id);

    await request(app)
      .patch(`/api/v1/deliveries/${delivery._id}/assign`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ riderId: rider.user._id });

    const riderList = await request(app)
      .get('/api/v1/deliveries')
      .set('Authorization', `Bearer ${rider.accessToken}`);
    expect(riderList.body.data.items).toHaveLength(1);

    const otherRiderList = await request(app)
      .get('/api/v1/deliveries')
      .set('Authorization', `Bearer ${otherRider.accessToken}`);
    expect(otherRiderList.body.data.items).toHaveLength(0);
  });
});
