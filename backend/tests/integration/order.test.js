const request = require('supertest');
const app = require('../../src/app');
const { registerUser, buildCatalogFixture } = require('../helpers/factory');

const address = { street: '45 Wellness Ave', city: 'Mogadishu' };

async function addToCart(token, medicineId, quantity = 1) {
  return request(app)
    .post('/api/v1/cart/items')
    .set('Authorization', `Bearer ${token}`)
    .send({ medicineId, quantity });
}

describe('Order checkout', () => {
  it('rejects checkout with an empty cart', async () => {
    const customer = await registerUser();

    const res = await request(app)
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${customer.accessToken}`)
      .send({ deliveryAddress: address, paymentMethod: 'cod' });

    expect(res.status).toBe(400);
  });

  it('rejects checkout when quantity exceeds available stock', async () => {
    const admin = await registerUser({ role: 'admin' });
    const customer = await registerUser();
    const { medicine } = await buildCatalogFixture(admin.accessToken, { stock: 1, price: 10 });

    await addToCart(customer.accessToken, medicine._id, 1);
    // Stock changes after the cart item was added (simulating a race / restock elsewhere).
    await request(app)
      .patch(`/api/v1/medicines/${medicine._id}`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ stock: 0 });

    const res = await request(app)
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${customer.accessToken}`)
      .send({ deliveryAddress: address, paymentMethod: 'cod' });

    expect(res.status).toBe(400);
  });

  it('rejects checkout of a prescription-required item without a prescription image', async () => {
    const admin = await registerUser({ role: 'admin' });
    const customer = await registerUser();
    const { medicine } = await buildCatalogFixture(admin.accessToken, {
      requiresPrescription: true,
      price: 20,
      stock: 5,
    });

    await addToCart(customer.accessToken, medicine._id, 1);

    const res = await request(app)
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${customer.accessToken}`)
      .send({ deliveryAddress: address, paymentMethod: 'cod' });

    expect(res.status).toBe(400);
  });

  it('places an order, decrements stock, clears the cart, and creates payment + delivery', async () => {
    const admin = await registerUser({ role: 'admin' });
    const customer = await registerUser();
    const { medicine } = await buildCatalogFixture(admin.accessToken, { stock: 10, price: 20 });

    await addToCart(customer.accessToken, medicine._id, 2);

    const checkoutRes = await request(app)
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${customer.accessToken}`)
      .send({ deliveryAddress: address, paymentMethod: 'zaad' });

    expect(checkoutRes.status).toBe(201);
    const { order, payment, delivery } = checkoutRes.body.data;

    expect(order.subtotal).toBe(40);
    expect(order.deliveryFee).toBe(2);
    expect(order.tax).toBe(0.8);
    expect(order.total).toBe(42.8);
    expect(order.status).toBe('pending');
    expect(payment.method).toBe('zaad');
    expect(payment.status).toBe('processing');
    expect(delivery.status).toBe('pending');

    const medicineRes = await request(app).get(`/api/v1/medicines/${medicine._id}`);
    expect(medicineRes.body.data.stock).toBe(8);

    const cartRes = await request(app)
      .get('/api/v1/cart')
      .set('Authorization', `Bearer ${customer.accessToken}`);
    expect(cartRes.body.data.items).toHaveLength(0);
  });

  it('waives the delivery fee above the free-delivery threshold', async () => {
    const admin = await registerUser({ role: 'admin' });
    const customer = await registerUser();
    const { medicine } = await buildCatalogFixture(admin.accessToken, { stock: 10, price: 60 });

    await addToCart(customer.accessToken, medicine._id, 1);

    const res = await request(app)
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${customer.accessToken}`)
      .send({ deliveryAddress: address, paymentMethod: 'cod' });

    expect(res.body.data.order.deliveryFee).toBe(0);
  });
});

describe('Order visibility and status transitions', () => {
  it('scopes order listing by role: customer sees own, pharmacist sees their pharmacy, admin sees all', async () => {
    const admin = await registerUser({ role: 'admin' });
    const customer = await registerUser();
    const { pharmacist, medicine } = await buildCatalogFixture(admin.accessToken, {
      stock: 10,
      price: 10,
    });

    await addToCart(customer.accessToken, medicine._id, 1);
    await request(app)
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${customer.accessToken}`)
      .send({ deliveryAddress: address, paymentMethod: 'cod' });

    const customerList = await request(app)
      .get('/api/v1/orders')
      .set('Authorization', `Bearer ${customer.accessToken}`);
    expect(customerList.body.data.items).toHaveLength(1);

    const pharmacistList = await request(app)
      .get('/api/v1/orders')
      .set('Authorization', `Bearer ${pharmacist.accessToken}`);
    expect(pharmacistList.body.data.items).toHaveLength(1);

    const adminList = await request(app)
      .get('/api/v1/orders')
      .set('Authorization', `Bearer ${admin.accessToken}`);
    expect(adminList.body.data.items.length).toBeGreaterThanOrEqual(1);

    const otherCustomer = await registerUser();
    const otherList = await request(app)
      .get('/api/v1/orders')
      .set('Authorization', `Bearer ${otherCustomer.accessToken}`);
    expect(otherList.body.data.items).toHaveLength(0);
  });

  it('enforces valid status transitions and forbids customers from changing status', async () => {
    const admin = await registerUser({ role: 'admin' });
    const customer = await registerUser();
    const { pharmacist, medicine } = await buildCatalogFixture(admin.accessToken, {
      stock: 10,
      price: 10,
    });

    await addToCart(customer.accessToken, medicine._id, 1);
    const checkoutRes = await request(app)
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${customer.accessToken}`)
      .send({ deliveryAddress: address, paymentMethod: 'cod' });
    const orderId = checkoutRes.body.data.order._id;

    const forbiddenRes = await request(app)
      .patch(`/api/v1/orders/${orderId}/status`)
      .set('Authorization', `Bearer ${customer.accessToken}`)
      .send({ status: 'confirmed' });
    expect(forbiddenRes.status).toBe(403);

    const invalidRes = await request(app)
      .patch(`/api/v1/orders/${orderId}/status`)
      .set('Authorization', `Bearer ${pharmacist.accessToken}`)
      .send({ status: 'out_for_delivery' });
    expect(invalidRes.status).toBe(400);

    const confirmRes = await request(app)
      .patch(`/api/v1/orders/${orderId}/status`)
      .set('Authorization', `Bearer ${pharmacist.accessToken}`)
      .send({ status: 'confirmed' });
    expect(confirmRes.status).toBe(200);
    expect(confirmRes.body.data.status).toBe('confirmed');

    const preparingRes = await request(app)
      .patch(`/api/v1/orders/${orderId}/status`)
      .set('Authorization', `Bearer ${pharmacist.accessToken}`)
      .send({ status: 'preparing' });
    expect(preparingRes.status).toBe(200);
  });

  it('cancels an order, restocks medicines, and cascades to payment and delivery', async () => {
    const admin = await registerUser({ role: 'admin' });
    const customer = await registerUser();
    const { medicine } = await buildCatalogFixture(admin.accessToken, { stock: 10, price: 10 });

    await addToCart(customer.accessToken, medicine._id, 3);
    const checkoutRes = await request(app)
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${customer.accessToken}`)
      .send({ deliveryAddress: address, paymentMethod: 'cod' });
    const { order } = checkoutRes.body.data;

    const cancelRes = await request(app)
      .patch(`/api/v1/orders/${order._id}/cancel`)
      .set('Authorization', `Bearer ${customer.accessToken}`);

    expect(cancelRes.status).toBe(200);
    expect(cancelRes.body.data.status).toBe('cancelled');

    const medicineRes = await request(app).get(`/api/v1/medicines/${medicine._id}`);
    expect(medicineRes.body.data.stock).toBe(10);

    const paymentRes = await request(app)
      .get(`/api/v1/payments/order/${order._id}`)
      .set('Authorization', `Bearer ${customer.accessToken}`);
    expect(paymentRes.body.data.status).toBe('cancelled');

    const deliveryRes = await request(app)
      .get(`/api/v1/deliveries/order/${order._id}`)
      .set('Authorization', `Bearer ${customer.accessToken}`);
    expect(deliveryRes.body.data.status).toBe('cancelled');
  });

  it('prevents cancelling an order that is already out for delivery', async () => {
    const admin = await registerUser({ role: 'admin' });
    const rider = await registerUser({ role: 'rider' });
    const customer = await registerUser();
    const { medicine } = await buildCatalogFixture(admin.accessToken, { stock: 10, price: 10 });

    await addToCart(customer.accessToken, medicine._id, 1);
    const checkoutRes = await request(app)
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${customer.accessToken}`)
      .send({ deliveryAddress: address, paymentMethod: 'cod' });
    const { order, delivery } = checkoutRes.body.data;

    await request(app)
      .patch(`/api/v1/deliveries/${delivery._id}/assign`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ riderId: rider.user._id });
    await request(app)
      .patch(`/api/v1/deliveries/${delivery._id}/status`)
      .set('Authorization', `Bearer ${rider.accessToken}`)
      .send({ status: 'picked_up' });

    const cancelRes = await request(app)
      .patch(`/api/v1/orders/${order._id}/cancel`)
      .set('Authorization', `Bearer ${customer.accessToken}`);

    expect(cancelRes.status).toBe(400);
  });
});
