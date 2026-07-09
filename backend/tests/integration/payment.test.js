const crypto = require('crypto');
const request = require('supertest');
const app = require('../../src/app');
const { registerUser, buildCatalogFixture } = require('../helpers/factory');
const paymentGateway = require('../../src/services/paymentGateway.service');

const address = { street: '45 Wellness Ave', city: 'Mogadishu' };

async function checkoutOrder(
  customerToken,
  medicineId,
  { paymentMethod = 'zaad', payerPhone = '+252611230000' } = {},
) {
  await request(app)
    .post('/api/v1/cart/items')
    .set('Authorization', `Bearer ${customerToken}`)
    .send({ medicineId, quantity: 1 });

  const res = await request(app)
    .post('/api/v1/orders')
    .set('Authorization', `Bearer ${customerToken}`)
    .send({
      deliveryAddress: address,
      paymentMethod,
      ...(['zaad', 'edahab'].includes(paymentMethod) ? { payerPhone } : {}),
    });

  return res.body.data;
}

describe('Payment API — checkout creation', () => {
  it('creates a processing payment for mobile-money methods on checkout', async () => {
    const admin = await registerUser({ role: 'admin' });
    const customer = await registerUser();
    const { medicine } = await buildCatalogFixture(admin.accessToken, { stock: 5, price: 10 });

    const { payment } = await checkoutOrder(customer.accessToken, medicine._id, {
      paymentMethod: 'edahab',
    });

    expect(payment.status).toBe('processing');
    expect(payment.providerReference).toMatch(/^EDAHAB-/);
    expect(payment.attempts).toBe(1);
  });

  it('creates a pending cash-on-delivery payment', async () => {
    const admin = await registerUser({ role: 'admin' });
    const customer = await registerUser();
    const { medicine } = await buildCatalogFixture(admin.accessToken, { stock: 5, price: 10 });

    const { payment } = await checkoutOrder(customer.accessToken, medicine._id, {
      paymentMethod: 'cod',
    });

    expect(payment.status).toBe('pending');
    expect(payment.providerReference).toMatch(/^COD-/);
  });

  it('rejects a mobile-money checkout without a payerPhone', async () => {
    const admin = await registerUser({ role: 'admin' });
    const customer = await registerUser();
    const { medicine } = await buildCatalogFixture(admin.accessToken, { stock: 5, price: 10 });

    await request(app)
      .post('/api/v1/cart/items')
      .set('Authorization', `Bearer ${customer.accessToken}`)
      .send({ medicineId: medicine._id, quantity: 1 });

    const res = await request(app)
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${customer.accessToken}`)
      .send({ deliveryAddress: address, paymentMethod: 'zaad' });

    expect(res.status).toBe(400);
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
});

describe('Payment API — admin confirm (manual override)', () => {
  it('lets an admin confirm a sandbox payment regardless of gateway state', async () => {
    const admin = await registerUser({ role: 'admin' });
    const customer = await registerUser();
    const { medicine } = await buildCatalogFixture(admin.accessToken, { stock: 5, price: 10 });

    const { payment } = await checkoutOrder(customer.accessToken, medicine._id);

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

    const { payment } = await checkoutOrder(customer.accessToken, medicine._id);

    const confirmRes = await request(app)
      .post(`/api/v1/payments/${payment._id}/confirm`)
      .set('Authorization', `Bearer ${customer.accessToken}`);
    expect(confirmRes.status).toBe(403);

    const listRes = await request(app)
      .get('/api/v1/payments')
      .set('Authorization', `Bearer ${customer.accessToken}`);
    expect(listRes.status).toBe(403);
  });

  it('lets an admin list every payment, paginated and filterable by status/method', async () => {
    const admin = await registerUser({ role: 'admin' });
    const customer = await registerUser();
    const { medicine } = await buildCatalogFixture(admin.accessToken, { stock: 5, price: 10 });

    await checkoutOrder(customer.accessToken, medicine._id, { paymentMethod: 'cod' });
    await checkoutOrder(customer.accessToken, medicine._id, { paymentMethod: 'zaad' });

    const listRes = await request(app)
      .get('/api/v1/payments')
      .set('Authorization', `Bearer ${admin.accessToken}`);
    expect(listRes.status).toBe(200);
    expect(listRes.body.data.items.length).toBeGreaterThanOrEqual(2);
    expect(listRes.body.data.meta.total).toBeGreaterThanOrEqual(2);
    expect(listRes.body.data.items[0].order.orderNumber).toBeDefined();
    expect(listRes.body.data.items[0].user.name).toBeDefined();

    const codOnly = await request(app)
      .get('/api/v1/payments')
      .query({ method: 'cod' })
      .set('Authorization', `Bearer ${admin.accessToken}`);
    expect(codOnly.status).toBe(200);
    expect(codOnly.body.data.items.every((p) => p.method === 'cod')).toBe(true);

    const pagedRes = await request(app)
      .get('/api/v1/payments')
      .query({ page: 1, limit: 1 })
      .set('Authorization', `Bearer ${admin.accessToken}`);
    expect(pagedRes.body.data.items).toHaveLength(1);
    expect(pagedRes.body.data.meta.limit).toBe(1);
  });
});

describe('Payment API — sandbox verification scenarios', () => {
  it('verifies a successful payment for a default (non-magic) phone number', async () => {
    const admin = await registerUser({ role: 'admin' });
    const customer = await registerUser();
    const { medicine } = await buildCatalogFixture(admin.accessToken, { stock: 5, price: 10 });

    const { payment } = await checkoutOrder(customer.accessToken, medicine._id, {
      paymentMethod: 'zaad',
      payerPhone: '+252611239999',
    });

    const verifyRes = await request(app)
      .post(`/api/v1/payments/${payment._id}/verify`)
      .set('Authorization', `Bearer ${customer.accessToken}`);

    expect(verifyRes.status).toBe(200);
    expect(verifyRes.body.data.status).toBe('completed');
    expect(verifyRes.body.data.paidAt).not.toBeNull();
  });

  it('verifies a failed payment with "insufficient_funds" for the magic 1111 test number', async () => {
    const admin = await registerUser({ role: 'admin' });
    const customer = await registerUser();
    const { medicine } = await buildCatalogFixture(admin.accessToken, { stock: 5, price: 10 });

    const { payment } = await checkoutOrder(customer.accessToken, medicine._id, {
      paymentMethod: 'zaad',
      payerPhone: '+252611231111',
    });

    const verifyRes = await request(app)
      .post(`/api/v1/payments/${payment._id}/verify`)
      .set('Authorization', `Bearer ${customer.accessToken}`);

    expect(verifyRes.status).toBe(200);
    expect(verifyRes.body.data.status).toBe('failed');
    expect(verifyRes.body.data.failureReason).toBe('insufficient_funds');
  });

  it('verifies a "timeout" failure for the magic 2222 test number', async () => {
    const admin = await registerUser({ role: 'admin' });
    const customer = await registerUser();
    const { medicine } = await buildCatalogFixture(admin.accessToken, { stock: 5, price: 10 });

    const { payment } = await checkoutOrder(customer.accessToken, medicine._id, {
      paymentMethod: 'edahab',
      payerPhone: '+252611232222',
    });

    const verifyRes = await request(app)
      .post(`/api/v1/payments/${payment._id}/verify`)
      .set('Authorization', `Bearer ${customer.accessToken}`);

    expect(verifyRes.body.data.status).toBe('failed');
    expect(verifyRes.body.data.failureReason).toBe('timeout');
  });

  it('keeps reporting "processing" for the magic 3333 test number until it is retried', async () => {
    const admin = await registerUser({ role: 'admin' });
    const customer = await registerUser();
    const { medicine } = await buildCatalogFixture(admin.accessToken, { stock: 5, price: 10 });

    const { payment } = await checkoutOrder(customer.accessToken, medicine._id, {
      paymentMethod: 'zaad',
      payerPhone: '+252611233333',
    });

    const verifyRes = await request(app)
      .post(`/api/v1/payments/${payment._id}/verify`)
      .set('Authorization', `Bearer ${customer.accessToken}`);

    expect(verifyRes.body.data.status).toBe('processing');
  });

  it('is a no-op when verifying an already-completed payment', async () => {
    const admin = await registerUser({ role: 'admin' });
    const customer = await registerUser();
    const { medicine } = await buildCatalogFixture(admin.accessToken, { stock: 5, price: 10 });

    const { payment } = await checkoutOrder(customer.accessToken, medicine._id);
    await request(app)
      .post(`/api/v1/payments/${payment._id}/confirm`)
      .set('Authorization', `Bearer ${admin.accessToken}`);

    const verifyRes = await request(app)
      .post(`/api/v1/payments/${payment._id}/verify`)
      .set('Authorization', `Bearer ${customer.accessToken}`);

    expect(verifyRes.status).toBe(200);
    expect(verifyRes.body.data.status).toBe('completed');
  });

  it('forbids a stranger from verifying someone else’s payment', async () => {
    const admin = await registerUser({ role: 'admin' });
    const customer = await registerUser();
    const stranger = await registerUser();
    const { medicine } = await buildCatalogFixture(admin.accessToken, { stock: 5, price: 10 });

    const { payment } = await checkoutOrder(customer.accessToken, medicine._id);

    const res = await request(app)
      .post(`/api/v1/payments/${payment._id}/verify`)
      .set('Authorization', `Bearer ${stranger.accessToken}`);

    expect(res.status).toBe(403);
  });
});

describe('Payment API — retry', () => {
  it('rejects retrying a payment that has not failed', async () => {
    const admin = await registerUser({ role: 'admin' });
    const customer = await registerUser();
    const { medicine } = await buildCatalogFixture(admin.accessToken, { stock: 5, price: 10 });

    const { payment } = await checkoutOrder(customer.accessToken, medicine._id);

    const res = await request(app)
      .post(`/api/v1/payments/${payment._id}/retry`)
      .set('Authorization', `Bearer ${customer.accessToken}`);

    expect(res.status).toBe(400);
  });

  it('retries a failed payment with a fresh provider reference and succeeds with a corrected phone', async () => {
    const admin = await registerUser({ role: 'admin' });
    const customer = await registerUser();
    const { medicine } = await buildCatalogFixture(admin.accessToken, { stock: 5, price: 10 });

    const { payment } = await checkoutOrder(customer.accessToken, medicine._id, {
      paymentMethod: 'zaad',
      payerPhone: '+252611231111', // insufficient_funds
    });

    await request(app)
      .post(`/api/v1/payments/${payment._id}/verify`)
      .set('Authorization', `Bearer ${customer.accessToken}`);

    const retryRes = await request(app)
      .post(`/api/v1/payments/${payment._id}/retry`)
      .set('Authorization', `Bearer ${customer.accessToken}`);

    expect(retryRes.status).toBe(200);
    expect(retryRes.body.data.status).toBe('processing');
    expect(retryRes.body.data.attempts).toBe(2);
    expect(retryRes.body.data.providerReference).not.toBe(payment.providerReference);

    // The retried attempt uses the same stored payerPhone, which is still
    // the "insufficient_funds" magic number — verifying should fail again
    // until the customer actually changes phones/tops up in real life.
    const secondVerify = await request(app)
      .post(`/api/v1/payments/${payment._id}/verify`)
      .set('Authorization', `Bearer ${customer.accessToken}`);
    expect(secondVerify.body.data.status).toBe('failed');
  });

  it('forbids a stranger from retrying someone else’s payment', async () => {
    const admin = await registerUser({ role: 'admin' });
    const customer = await registerUser();
    const stranger = await registerUser();
    const { medicine } = await buildCatalogFixture(admin.accessToken, { stock: 5, price: 10 });

    const { payment } = await checkoutOrder(customer.accessToken, medicine._id, {
      payerPhone: '+252611231111',
    });
    await request(app)
      .post(`/api/v1/payments/${payment._id}/verify`)
      .set('Authorization', `Bearer ${customer.accessToken}`);

    const res = await request(app)
      .post(`/api/v1/payments/${payment._id}/retry`)
      .set('Authorization', `Bearer ${stranger.accessToken}`);

    expect(res.status).toBe(403);
  });
});

describe('Payment API — webhook', () => {
  function signedRequest(provider, payload) {
    const rawBody = JSON.stringify(payload);
    const signature = paymentGateway.signWebhookPayload(provider, rawBody);
    return request(app)
      .post(`/api/v1/payments/webhook/${provider}`)
      .set('Content-Type', 'application/json')
      .set('X-Webhook-Signature', signature)
      .send(rawBody);
  }

  it('updates a payment to completed via a validly signed webhook', async () => {
    const admin = await registerUser({ role: 'admin' });
    const customer = await registerUser();
    const { medicine } = await buildCatalogFixture(admin.accessToken, { stock: 5, price: 10 });
    const { payment } = await checkoutOrder(customer.accessToken, medicine._id, {
      paymentMethod: 'zaad',
    });

    const res = await signedRequest('zaad', {
      providerReference: payment.providerReference,
      status: 'completed',
    });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('completed');

    const paymentRes = await request(app)
      .get(`/api/v1/payments/${payment._id}`)
      .set('Authorization', `Bearer ${customer.accessToken}`);
    expect(paymentRes.body.data.status).toBe('completed');
    expect(paymentRes.body.data.paidAt).not.toBeNull();
  });

  it('records a failure reason from a signed failure webhook', async () => {
    const admin = await registerUser({ role: 'admin' });
    const customer = await registerUser();
    const { medicine } = await buildCatalogFixture(admin.accessToken, { stock: 5, price: 10 });
    const { payment } = await checkoutOrder(customer.accessToken, medicine._id, {
      paymentMethod: 'edahab',
    });

    const res = await signedRequest('edahab', {
      providerReference: payment.providerReference,
      status: 'failed',
      failureReason: 'insufficient_funds',
    });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('failed');
  });

  it('rejects a webhook with an invalid signature', async () => {
    const admin = await registerUser({ role: 'admin' });
    const customer = await registerUser();
    const { medicine } = await buildCatalogFixture(admin.accessToken, { stock: 5, price: 10 });
    const { payment } = await checkoutOrder(customer.accessToken, medicine._id, {
      paymentMethod: 'zaad',
    });

    const rawBody = JSON.stringify({ providerReference: payment.providerReference, status: 'completed' });
    const res = await request(app)
      .post('/api/v1/payments/webhook/zaad')
      .set('Content-Type', 'application/json')
      .set('X-Webhook-Signature', crypto.randomBytes(32).toString('hex'))
      .send(rawBody);

    expect(res.status).toBe(401);
  });

  it('rejects a webhook signed with the wrong provider’s secret', async () => {
    const admin = await registerUser({ role: 'admin' });
    const customer = await registerUser();
    const { medicine } = await buildCatalogFixture(admin.accessToken, { stock: 5, price: 10 });
    const { payment } = await checkoutOrder(customer.accessToken, medicine._id, {
      paymentMethod: 'zaad',
    });

    const rawBody = JSON.stringify({ providerReference: payment.providerReference, status: 'completed' });
    const wrongSignature = paymentGateway.signWebhookPayload('edahab', rawBody);

    const res = await request(app)
      .post('/api/v1/payments/webhook/zaad')
      .set('Content-Type', 'application/json')
      .set('X-Webhook-Signature', wrongSignature)
      .send(rawBody);

    expect(res.status).toBe(401);
  });

  it('returns 404 for a webhook referencing an unknown providerReference', async () => {
    const res = await signedRequest('zaad', {
      providerReference: 'ZAAD-DOES-NOT-EXIST',
      status: 'completed',
    });
    expect(res.status).toBe(404);
  });

  it('ignores a webhook for an already-completed payment', async () => {
    const admin = await registerUser({ role: 'admin' });
    const customer = await registerUser();
    const { medicine } = await buildCatalogFixture(admin.accessToken, { stock: 5, price: 10 });
    const { payment } = await checkoutOrder(customer.accessToken, medicine._id, {
      paymentMethod: 'zaad',
    });
    await request(app)
      .post(`/api/v1/payments/${payment._id}/confirm`)
      .set('Authorization', `Bearer ${admin.accessToken}`);

    const res = await signedRequest('zaad', {
      providerReference: payment.providerReference,
      status: 'failed',
      failureReason: 'insufficient_funds',
    });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('completed');
  });
});

describe('Payment API — transaction history', () => {
  it('lists only the current user’s own payments, most recent first', async () => {
    const admin = await registerUser({ role: 'admin' });
    const customerA = await registerUser();
    const customerB = await registerUser();
    const { medicine } = await buildCatalogFixture(admin.accessToken, { stock: 10, price: 10 });

    await checkoutOrder(customerA.accessToken, medicine._id, { paymentMethod: 'cod' });
    await checkoutOrder(customerA.accessToken, medicine._id, { paymentMethod: 'zaad' });
    await checkoutOrder(customerB.accessToken, medicine._id, { paymentMethod: 'cod' });

    const res = await request(app)
      .get('/api/v1/payments/me')
      .set('Authorization', `Bearer ${customerA.accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.items).toHaveLength(2);
    expect(res.body.data.meta.total).toBe(2);
  });

  it('filters transaction history by status', async () => {
    const admin = await registerUser({ role: 'admin' });
    const customer = await registerUser();
    const { medicine } = await buildCatalogFixture(admin.accessToken, { stock: 10, price: 10 });

    await checkoutOrder(customer.accessToken, medicine._id, { paymentMethod: 'cod' });

    const res = await request(app)
      .get('/api/v1/payments/me?status=processing')
      .set('Authorization', `Bearer ${customer.accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.items).toHaveLength(0);
  });

  it('requires authentication', async () => {
    const res = await request(app).get('/api/v1/payments/me');
    expect(res.status).toBe(401);
  });
});
