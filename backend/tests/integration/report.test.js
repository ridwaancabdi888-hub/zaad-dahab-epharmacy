const request = require('supertest');
const app = require('../../src/app');
const { registerUser, buildCatalogFixture } = require('../helpers/factory');

async function checkoutOrder(customerToken, medicineId, quantity = 1) {
  await request(app)
    .post('/api/v1/cart/items')
    .set('Authorization', `Bearer ${customerToken}`)
    .send({ medicineId, quantity });

  const res = await request(app)
    .post('/api/v1/orders')
    .set('Authorization', `Bearer ${customerToken}`)
    .send({ deliveryAddress: { street: '1 Main St', city: 'Mogadishu' }, paymentMethod: 'cod' });

  return res.body.data;
}

describe('Reports API (admin dashboard)', () => {
  it('rejects non-admins', async () => {
    const customer = await registerUser();
    const res = await request(app)
      .get('/api/v1/reports/dashboard')
      .set('Authorization', `Bearer ${customer.accessToken}`);
    expect(res.status).toBe(403);
  });

  it('aggregates totals, orders by status, revenue, payments, and top medicines', async () => {
    const admin = await registerUser({ role: 'admin' });
    const customer = await registerUser();
    const { medicine } = await buildCatalogFixture(admin.accessToken, { stock: 10, price: 20 });

    const { order } = await checkoutOrder(customer.accessToken, medicine._id, 2);

    const res = await request(app)
      .get('/api/v1/reports/dashboard')
      .set('Authorization', `Bearer ${admin.accessToken}`);

    expect(res.status).toBe(200);
    const report = res.body.data;

    expect(report.totals.customers).toBeGreaterThanOrEqual(1);
    expect(report.totals.medicines).toBeGreaterThanOrEqual(1);
    expect(report.totals.orders).toBeGreaterThanOrEqual(1);
    expect(report.totals.revenue).toBeGreaterThanOrEqual(order.total);

    expect(Array.isArray(report.ordersByStatus)).toBe(true);
    expect(report.ordersByStatus.some((row) => row.status === 'pending')).toBe(true);

    expect(Array.isArray(report.revenueByDay)).toBe(true);
    expect(report.revenueByDay).toHaveLength(14);
    const todayRevenue = report.revenueByDay[report.revenueByDay.length - 1];
    expect(todayRevenue.revenue).toBeGreaterThanOrEqual(order.total);

    expect(Array.isArray(report.paymentsByMethod)).toBe(true);
    expect(report.paymentsByMethod.some((row) => row.method === 'cod')).toBe(true);

    expect(Array.isArray(report.topMedicines)).toBe(true);
    const top = report.topMedicines.find((row) => row.medicineId === medicine._id);
    expect(top).toBeDefined();
    expect(top.unitsSold).toBeGreaterThanOrEqual(2);
  });

  it('excludes cancelled orders from revenue', async () => {
    const admin = await registerUser({ role: 'admin' });
    const customer = await registerUser();
    const { medicine } = await buildCatalogFixture(admin.accessToken, { stock: 10, price: 15 });

    const { order } = await checkoutOrder(customer.accessToken, medicine._id, 1);

    await request(app)
      .patch(`/api/v1/orders/${order._id}/cancel`)
      .set('Authorization', `Bearer ${customer.accessToken}`);

    const res = await request(app)
      .get('/api/v1/reports/dashboard')
      .set('Authorization', `Bearer ${admin.accessToken}`);

    const report = res.body.data;
    expect(report.ordersByStatus.some((row) => row.status === 'cancelled')).toBe(true);
    expect(report.totals.cancelledOrders).toBeGreaterThanOrEqual(1);
    // The only order placed was cancelled, so it must not count toward revenue.
    expect(report.totals.revenue).toBe(0);
  });
});
