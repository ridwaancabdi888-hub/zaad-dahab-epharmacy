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

  it('lets the assigned rider fetch the delivery by id and by order id', async () => {
    const admin = await registerUser({ role: 'admin' });
    const customer = await registerUser();
    const rider = await registerUser({ role: 'rider' });
    const stranger = await registerUser({ role: 'rider' });
    const { medicine } = await buildCatalogFixture(admin.accessToken, { stock: 5, price: 10 });
    const { order, delivery } = await checkoutOrder(customer.accessToken, medicine._id);

    await request(app)
      .patch(`/api/v1/deliveries/${delivery._id}/assign`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ riderId: rider.user._id });

    const byIdRes = await request(app)
      .get(`/api/v1/deliveries/${delivery._id}`)
      .set('Authorization', `Bearer ${rider.accessToken}`);
    expect(byIdRes.status).toBe(200);

    const byOrderRes = await request(app)
      .get(`/api/v1/deliveries/order/${order._id}`)
      .set('Authorization', `Bearer ${rider.accessToken}`);
    expect(byOrderRes.status).toBe(200);

    const strangerRes = await request(app)
      .get(`/api/v1/deliveries/${delivery._id}`)
      .set('Authorization', `Bearer ${stranger.accessToken}`);
    expect(strangerRes.status).toBe(403);
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

describe('Delivery API — estimated time and notifications', () => {
  const addressWithCoords = {
    street: '45 Wellness Ave',
    city: 'Mogadishu',
    lat: 2.0469,
    lng: 45.3182,
  };

  async function checkoutWithCoords(customerToken, medicineId) {
    await request(app)
      .post('/api/v1/cart/items')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ medicineId, quantity: 1 });

    const res = await request(app)
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ deliveryAddress: addressWithCoords, paymentMethod: 'cod' });

    return res.body.data;
  }

  it('computes an estimated delivery window once the rider location and destination are both known', async () => {
    const admin = await registerUser({ role: 'admin' });
    const customer = await registerUser();
    const rider = await registerUser({ role: 'rider' });
    const { medicine } = await buildCatalogFixture(admin.accessToken, { stock: 5, price: 10 });
    const { delivery } = await checkoutWithCoords(customer.accessToken, medicine._id);

    await request(app)
      .patch(`/api/v1/deliveries/${delivery._id}/assign`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ riderId: rider.user._id });

    // A few km away from the destination.
    await request(app)
      .patch(`/api/v1/deliveries/${delivery._id}/location`)
      .set('Authorization', `Bearer ${rider.accessToken}`)
      .send({ lat: 2.06, lng: 45.33 });

    const pickedUpRes = await request(app)
      .patch(`/api/v1/deliveries/${delivery._id}/status`)
      .set('Authorization', `Bearer ${rider.accessToken}`)
      .send({ status: 'picked_up' });

    expect(pickedUpRes.status).toBe(200);
    expect(pickedUpRes.body.data.estimatedDeliveryStart).not.toBeNull();
    expect(pickedUpRes.body.data.estimatedDeliveryEnd).not.toBeNull();
    expect(new Date(pickedUpRes.body.data.estimatedDeliveryEnd).getTime()).toBeGreaterThan(
      new Date(pickedUpRes.body.data.estimatedDeliveryStart).getTime(),
    );
  });

  it('refreshes the ETA as the rider location updates while in transit', async () => {
    const admin = await registerUser({ role: 'admin' });
    const customer = await registerUser();
    const rider = await registerUser({ role: 'rider' });
    const { medicine } = await buildCatalogFixture(admin.accessToken, { stock: 5, price: 10 });
    const { delivery } = await checkoutWithCoords(customer.accessToken, medicine._id);

    await request(app)
      .patch(`/api/v1/deliveries/${delivery._id}/assign`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ riderId: rider.user._id });
    await request(app)
      .patch(`/api/v1/deliveries/${delivery._id}/location`)
      .set('Authorization', `Bearer ${rider.accessToken}`)
      .send({ lat: 2.1, lng: 45.4 });
    await request(app)
      .patch(`/api/v1/deliveries/${delivery._id}/status`)
      .set('Authorization', `Bearer ${rider.accessToken}`)
      .send({ status: 'picked_up' });

    const farRes = await request(app)
      .get(`/api/v1/deliveries/${delivery._id}`)
      .set('Authorization', `Bearer ${rider.accessToken}`);
    const farEstimate = new Date(farRes.body.data.estimatedDeliveryEnd).getTime();

    // Move much closer to the destination — the new ETA should be sooner.
    const closeRes = await request(app)
      .patch(`/api/v1/deliveries/${delivery._id}/location`)
      .set('Authorization', `Bearer ${rider.accessToken}`)
      .send({ lat: 2.047, lng: 45.319 });
    const closeEstimate = new Date(closeRes.body.data.estimatedDeliveryEnd).getTime();

    expect(closeEstimate).toBeLessThan(farEstimate);
  });

  it('clears the ETA once the order is delivered', async () => {
    const admin = await registerUser({ role: 'admin' });
    const customer = await registerUser();
    const rider = await registerUser({ role: 'rider' });
    const { medicine } = await buildCatalogFixture(admin.accessToken, { stock: 5, price: 10 });
    const { delivery } = await checkoutWithCoords(customer.accessToken, medicine._id);

    await request(app)
      .patch(`/api/v1/deliveries/${delivery._id}/assign`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ riderId: rider.user._id });
    await request(app)
      .patch(`/api/v1/deliveries/${delivery._id}/location`)
      .set('Authorization', `Bearer ${rider.accessToken}`)
      .send({ lat: 2.06, lng: 45.33 });
    await request(app)
      .patch(`/api/v1/deliveries/${delivery._id}/status`)
      .set('Authorization', `Bearer ${rider.accessToken}`)
      .send({ status: 'picked_up' });
    await request(app)
      .patch(`/api/v1/deliveries/${delivery._id}/status`)
      .set('Authorization', `Bearer ${rider.accessToken}`)
      .send({ status: 'in_transit' });
    const deliveredRes = await request(app)
      .patch(`/api/v1/deliveries/${delivery._id}/status`)
      .set('Authorization', `Bearer ${rider.accessToken}`)
      .send({ status: 'delivered' });

    expect(deliveredRes.body.data.estimatedDeliveryStart).toBeNull();
    expect(deliveredRes.body.data.estimatedDeliveryEnd).toBeNull();
  });

  it('leaves the ETA unset when the delivery address has no coordinates', async () => {
    const admin = await registerUser({ role: 'admin' });
    const customer = await registerUser();
    const rider = await registerUser({ role: 'rider' });
    const { medicine } = await buildCatalogFixture(admin.accessToken, { stock: 5, price: 10 });
    // Default `checkoutOrder` helper above uses an address with no lat/lng.
    const { delivery } = await checkoutOrder(customer.accessToken, medicine._id);

    await request(app)
      .patch(`/api/v1/deliveries/${delivery._id}/assign`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ riderId: rider.user._id });
    await request(app)
      .patch(`/api/v1/deliveries/${delivery._id}/location`)
      .set('Authorization', `Bearer ${rider.accessToken}`)
      .send({ lat: 2.06, lng: 45.33 });
    const res = await request(app)
      .patch(`/api/v1/deliveries/${delivery._id}/status`)
      .set('Authorization', `Bearer ${rider.accessToken}`)
      .send({ status: 'picked_up' });

    expect(res.body.data.estimatedDeliveryStart).toBeNull();
  });

  it('creates a notification for each delivery status change', async () => {
    const admin = await registerUser({ role: 'admin' });
    const customer = await registerUser();
    const rider = await registerUser({ role: 'rider' });
    const { medicine } = await buildCatalogFixture(admin.accessToken, { stock: 5, price: 10 });
    const { order, delivery } = await checkoutOrder(customer.accessToken, medicine._id);

    await request(app)
      .patch(`/api/v1/deliveries/${delivery._id}/assign`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ riderId: rider.user._id });
    await request(app)
      .patch(`/api/v1/deliveries/${delivery._id}/status`)
      .set('Authorization', `Bearer ${rider.accessToken}`)
      .send({ status: 'picked_up' });

    const notificationsRes = await request(app)
      .get('/api/v1/notifications/me')
      .set('Authorization', `Bearer ${customer.accessToken}`);

    expect(notificationsRes.status).toBe(200);
    const titles = notificationsRes.body.data.items.map((n) => n.title);
    expect(titles).toContain('Rider assigned');
    expect(titles).toContain('Order picked up');
    expect(notificationsRes.body.data.items[0].message).toContain(order.orderNumber);
    expect(notificationsRes.body.data.unreadCount).toBe(2);
  });

  it('alerts the assigned rider directly, with the customer name and address in the message', async () => {
    const admin = await registerUser({ role: 'admin' });
    const customer = await registerUser({ name: 'Hodan Customer' });
    const rider = await registerUser({ role: 'rider' });
    const { medicine } = await buildCatalogFixture(admin.accessToken, { stock: 5, price: 10 });
    const { order, delivery } = await checkoutOrder(customer.accessToken, medicine._id);

    await request(app)
      .patch(`/api/v1/deliveries/${delivery._id}/assign`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ riderId: rider.user._id });

    const riderNotificationsRes = await request(app)
      .get('/api/v1/notifications/me')
      .set('Authorization', `Bearer ${rider.accessToken}`);

    expect(riderNotificationsRes.status).toBe(200);
    const riderNotification = riderNotificationsRes.body.data.items.find(
      (n) => n.type === 'rider_assigned',
    );
    expect(riderNotification).toBeDefined();
    expect(riderNotification.message).toContain(order.orderNumber);
    expect(riderNotification.message).toContain('Hodan Customer');
    expect(riderNotification.message).toContain(address.street);

    // The customer's own "Rider assigned" notification is separate and
    // still only sent to the customer, never leaked into the rider's list.
    expect(
      riderNotificationsRes.body.data.items.some((n) => n.type === 'delivery_status'),
    ).toBe(false);
  });

  it('creates a notification when an order is cancelled', async () => {
    const admin = await registerUser({ role: 'admin' });
    const customer = await registerUser();
    const { medicine } = await buildCatalogFixture(admin.accessToken, { stock: 5, price: 10 });
    const { order } = await checkoutOrder(customer.accessToken, medicine._id);

    await request(app)
      .patch(`/api/v1/orders/${order._id}/cancel`)
      .set('Authorization', `Bearer ${customer.accessToken}`);

    const res = await request(app)
      .get('/api/v1/notifications/me')
      .set('Authorization', `Bearer ${customer.accessToken}`);

    expect(res.body.data.items.some((n) => n.title === 'Order cancelled')).toBe(true);
  });
});

describe('Notifications API', () => {
  it('requires authentication', async () => {
    const res = await request(app).get('/api/v1/notifications/me');
    expect(res.status).toBe(401);
  });

  it('marks a single notification as read', async () => {
    const admin = await registerUser({ role: 'admin' });
    const customer = await registerUser();
    const rider = await registerUser({ role: 'rider' });
    const { medicine } = await buildCatalogFixture(admin.accessToken, { stock: 5, price: 10 });
    const { delivery } = await checkoutOrder(customer.accessToken, medicine._id);

    await request(app)
      .patch(`/api/v1/deliveries/${delivery._id}/assign`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ riderId: rider.user._id });

    const listRes = await request(app)
      .get('/api/v1/notifications/me')
      .set('Authorization', `Bearer ${customer.accessToken}`);
    const notificationId = listRes.body.data.items[0]._id;

    const markRes = await request(app)
      .patch(`/api/v1/notifications/${notificationId}/read`)
      .set('Authorization', `Bearer ${customer.accessToken}`);
    expect(markRes.status).toBe(200);
    expect(markRes.body.data.isRead).toBe(true);

    const countRes = await request(app)
      .get('/api/v1/notifications/me/unread-count')
      .set('Authorization', `Bearer ${customer.accessToken}`);
    expect(countRes.body.data.count).toBe(0);
  });

  it('marks all notifications as read', async () => {
    const admin = await registerUser({ role: 'admin' });
    const customer = await registerUser();
    const rider = await registerUser({ role: 'rider' });
    const { medicine } = await buildCatalogFixture(admin.accessToken, { stock: 5, price: 10 });
    const { delivery } = await checkoutOrder(customer.accessToken, medicine._id);

    await request(app)
      .patch(`/api/v1/deliveries/${delivery._id}/assign`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ riderId: rider.user._id });
    await request(app)
      .patch(`/api/v1/deliveries/${delivery._id}/status`)
      .set('Authorization', `Bearer ${rider.accessToken}`)
      .send({ status: 'picked_up' });

    await request(app)
      .patch('/api/v1/notifications/read-all')
      .set('Authorization', `Bearer ${customer.accessToken}`);

    const countRes = await request(app)
      .get('/api/v1/notifications/me/unread-count')
      .set('Authorization', `Bearer ${customer.accessToken}`);
    expect(countRes.body.data.count).toBe(0);
  });

  it('forbids marking another user’s notification as read', async () => {
    const admin = await registerUser({ role: 'admin' });
    const customer = await registerUser();
    const stranger = await registerUser();
    const rider = await registerUser({ role: 'rider' });
    const { medicine } = await buildCatalogFixture(admin.accessToken, { stock: 5, price: 10 });
    const { delivery } = await checkoutOrder(customer.accessToken, medicine._id);

    await request(app)
      .patch(`/api/v1/deliveries/${delivery._id}/assign`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ riderId: rider.user._id });

    const listRes = await request(app)
      .get('/api/v1/notifications/me')
      .set('Authorization', `Bearer ${customer.accessToken}`);
    const notificationId = listRes.body.data.items[0]._id;

    const res = await request(app)
      .patch(`/api/v1/notifications/${notificationId}/read`)
      .set('Authorization', `Bearer ${stranger.accessToken}`);
    expect(res.status).toBe(403);
  });
});
