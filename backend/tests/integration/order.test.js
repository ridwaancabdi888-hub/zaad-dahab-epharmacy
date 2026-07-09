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

  it('never oversells: two concurrent checkouts racing for the last unit only let one succeed', async () => {
    const admin = await registerUser({ role: 'admin' });
    const customerA = await registerUser();
    const customerB = await registerUser();
    const { medicine } = await buildCatalogFixture(admin.accessToken, { stock: 1, price: 10 });

    await addToCart(customerA.accessToken, medicine._id, 1);
    await addToCart(customerB.accessToken, medicine._id, 1);

    const checkout = (token) =>
      request(app)
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${token}`)
        .send({ deliveryAddress: address, paymentMethod: 'cod' });

    const [resA, resB] = await Promise.all([
      checkout(customerA.accessToken),
      checkout(customerB.accessToken),
    ]);

    const statuses = [resA.status, resB.status].sort();
    expect(statuses).toEqual([201, 400]);

    const medicineRes = await request(app).get(`/api/v1/medicines/${medicine._id}`);
    expect(medicineRes.body.data.stock).toBe(0);
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
      .send({ deliveryAddress: address, paymentMethod: 'zaad', payerPhone: '+252611230000' });

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

describe('Order quote and coupons', () => {
  async function createCoupon(adminToken, overrides = {}) {
    const res = await request(app)
      .post('/api/v1/coupons')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        code: overrides.code || `QUOTE${Date.now()}`,
        type: overrides.type || 'percentage',
        value: overrides.value ?? 10,
        ...overrides,
      });
    return res.body.data;
  }

  it('quotes a cart without creating an order or mutating the cart', async () => {
    const admin = await registerUser({ role: 'admin' });
    const customer = await registerUser();
    const { medicine } = await buildCatalogFixture(admin.accessToken, { stock: 10, price: 10 });
    await addToCart(customer.accessToken, medicine._id, 2);

    const quoteRes = await request(app)
      .post('/api/v1/orders/quote')
      .set('Authorization', `Bearer ${customer.accessToken}`)
      .send({});

    expect(quoteRes.status).toBe(200);
    expect(quoteRes.body.data.subtotal).toBe(20);
    expect(quoteRes.body.data.discount).toBe(0);
    expect(quoteRes.body.data.total).toBe(22.4);

    const cartRes = await request(app)
      .get('/api/v1/cart')
      .set('Authorization', `Bearer ${customer.accessToken}`);
    expect(cartRes.body.data.items).toHaveLength(1);
  });

  it('applies a percentage coupon to the quote and to checkout, then increments its usage', async () => {
    const admin = await registerUser({ role: 'admin' });
    const customer = await registerUser();
    const { medicine } = await buildCatalogFixture(admin.accessToken, { stock: 10, price: 20 });
    await addToCart(customer.accessToken, medicine._id, 1);

    const coupon = await createCoupon(admin.accessToken, {
      code: 'TEN',
      type: 'percentage',
      value: 10,
    });

    const quoteRes = await request(app)
      .post('/api/v1/orders/quote')
      .set('Authorization', `Bearer ${customer.accessToken}`)
      .send({ couponCode: 'ten' });
    expect(quoteRes.status).toBe(200);
    expect(quoteRes.body.data.discount).toBe(2);
    expect(quoteRes.body.data.couponCode).toBe('TEN');

    const checkoutRes = await request(app)
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${customer.accessToken}`)
      .send({ deliveryAddress: address, paymentMethod: 'cod', couponCode: 'ten' });
    expect(checkoutRes.status).toBe(201);
    expect(checkoutRes.body.data.order.discount).toBe(2);
    expect(checkoutRes.body.data.order.couponCode).toBe('TEN');

    const couponAfter = await request(app)
      .get(`/api/v1/coupons/${coupon._id}`)
      .set('Authorization', `Bearer ${admin.accessToken}`);
    expect(couponAfter.body.data.usedCount).toBe(1);
  });

  it('caps a percentage discount at maxDiscount', async () => {
    const admin = await registerUser({ role: 'admin' });
    const customer = await registerUser();
    const { medicine } = await buildCatalogFixture(admin.accessToken, { stock: 10, price: 40 });
    await addToCart(customer.accessToken, medicine._id, 1);

    await createCoupon(admin.accessToken, {
      code: 'CAPPED',
      type: 'percentage',
      value: 50,
      maxDiscount: 5,
    });

    const quoteRes = await request(app)
      .post('/api/v1/orders/quote')
      .set('Authorization', `Bearer ${customer.accessToken}`)
      .send({ couponCode: 'CAPPED' });

    expect(quoteRes.status).toBe(200);
    expect(quoteRes.body.data.discount).toBe(5);
  });

  it('rejects a coupon below its minimum subtotal', async () => {
    const admin = await registerUser({ role: 'admin' });
    const customer = await registerUser();
    const { medicine } = await buildCatalogFixture(admin.accessToken, { stock: 10, price: 5 });
    await addToCart(customer.accessToken, medicine._id, 1);

    await createCoupon(admin.accessToken, {
      code: 'BIGORDER',
      type: 'fixed',
      value: 5,
      minSubtotal: 50,
    });

    const quoteRes = await request(app)
      .post('/api/v1/orders/quote')
      .set('Authorization', `Bearer ${customer.accessToken}`)
      .send({ couponCode: 'BIGORDER' });

    expect(quoteRes.status).toBe(400);
  });

  it('rejects an expired or unknown coupon', async () => {
    const admin = await registerUser({ role: 'admin' });
    const customer = await registerUser();
    const { medicine } = await buildCatalogFixture(admin.accessToken, { stock: 10, price: 20 });
    await addToCart(customer.accessToken, medicine._id, 1);

    await createCoupon(admin.accessToken, {
      code: 'EXPIRED',
      type: 'fixed',
      value: 5,
      expiresAt: new Date(Date.now() - 86400000).toISOString(),
    });

    const expiredRes = await request(app)
      .post('/api/v1/orders/quote')
      .set('Authorization', `Bearer ${customer.accessToken}`)
      .send({ couponCode: 'EXPIRED' });
    expect(expiredRes.status).toBe(400);

    const unknownRes = await request(app)
      .post('/api/v1/orders/quote')
      .set('Authorization', `Bearer ${customer.accessToken}`)
      .send({ couponCode: 'DOES-NOT-EXIST' });
    expect(unknownRes.status).toBe(400);
  });

  it('rejects a coupon that has reached its usage limit', async () => {
    const admin = await registerUser({ role: 'admin' });
    const customerA = await registerUser();
    const customerB = await registerUser();
    const { medicine } = await buildCatalogFixture(admin.accessToken, { stock: 10, price: 20 });

    await createCoupon(admin.accessToken, {
      code: 'ONEUSE',
      type: 'fixed',
      value: 5,
      usageLimit: 1,
    });

    await addToCart(customerA.accessToken, medicine._id, 1);
    await request(app)
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${customerA.accessToken}`)
      .send({ deliveryAddress: address, paymentMethod: 'cod', couponCode: 'ONEUSE' });

    await addToCart(customerB.accessToken, medicine._id, 1);
    const secondRes = await request(app)
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${customerB.accessToken}`)
      .send({ deliveryAddress: address, paymentMethod: 'cod', couponCode: 'ONEUSE' });

    expect(secondRes.status).toBe(400);
  });
});
