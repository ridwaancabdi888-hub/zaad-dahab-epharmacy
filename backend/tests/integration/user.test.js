const request = require('supertest');
const app = require('../../src/app');
const { registerUser, buildCatalogFixture } = require('../helpers/factory');

describe('User profile API', () => {
  it('updates the current user profile', async () => {
    const customer = await registerUser();

    const res = await request(app)
      .patch('/api/v1/users/me')
      .set('Authorization', `Bearer ${customer.accessToken}`)
      .send({ name: 'Updated Name' });

    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('Updated Name');
  });

  it('adds, updates, and removes addresses, keeping exactly one default', async () => {
    const customer = await registerUser();

    const addRes = await request(app)
      .post('/api/v1/users/me/addresses')
      .set('Authorization', `Bearer ${customer.accessToken}`)
      .send({ label: 'Home', street: '1 First St', city: 'Mogadishu' });

    expect(addRes.status).toBe(201);
    expect(addRes.body.data.addresses).toHaveLength(1);
    expect(addRes.body.data.addresses[0].isDefault).toBe(true);

    const secondAddRes = await request(app)
      .post('/api/v1/users/me/addresses')
      .set('Authorization', `Bearer ${customer.accessToken}`)
      .send({ label: 'Work', street: '2 Second St', city: 'Mogadishu', isDefault: true });

    expect(secondAddRes.body.data.addresses).toHaveLength(2);
    const defaults = secondAddRes.body.data.addresses.filter((a) => a.isDefault);
    expect(defaults).toHaveLength(1);
    expect(defaults[0].label).toBe('Work');

    const addressId = secondAddRes.body.data.addresses[0]._id;
    const removeRes = await request(app)
      .delete(`/api/v1/users/me/addresses/${addressId}`)
      .set('Authorization', `Bearer ${customer.accessToken}`);

    expect(removeRes.status).toBe(200);
    expect(removeRes.body.data.addresses).toHaveLength(1);
  });
});

describe('Wishlist API', () => {
  it('starts empty and requires authentication', async () => {
    const res = await request(app).get('/api/v1/users/me/wishlist');
    expect(res.status).toBe(401);
  });

  it('adds, lists, and removes a medicine from the wishlist idempotently', async () => {
    const admin = await registerUser({ role: 'admin' });
    const customer = await registerUser();
    const { medicine } = await buildCatalogFixture(admin.accessToken);

    const emptyRes = await request(app)
      .get('/api/v1/users/me/wishlist')
      .set('Authorization', `Bearer ${customer.accessToken}`);
    expect(emptyRes.status).toBe(200);
    expect(emptyRes.body.data).toHaveLength(0);

    const addRes = await request(app)
      .post(`/api/v1/users/me/wishlist/${medicine._id}`)
      .set('Authorization', `Bearer ${customer.accessToken}`);
    expect(addRes.status).toBe(201);
    expect(addRes.body.data).toHaveLength(1);
    expect(addRes.body.data[0]._id).toBe(medicine._id);

    // Adding the same medicine again is idempotent, not duplicated.
    const addAgainRes = await request(app)
      .post(`/api/v1/users/me/wishlist/${medicine._id}`)
      .set('Authorization', `Bearer ${customer.accessToken}`);
    expect(addAgainRes.body.data).toHaveLength(1);

    const removeRes = await request(app)
      .delete(`/api/v1/users/me/wishlist/${medicine._id}`)
      .set('Authorization', `Bearer ${customer.accessToken}`);
    expect(removeRes.status).toBe(200);
    expect(removeRes.body.data).toHaveLength(0);
  });

  it('rejects adding a medicine that does not exist', async () => {
    const customer = await registerUser();
    const res = await request(app)
      .post('/api/v1/users/me/wishlist/64b7f3f1f1f1f1f1f1f1f1f1')
      .set('Authorization', `Bearer ${customer.accessToken}`);
    expect(res.status).toBe(404);
  });
});

describe('Admin user management', () => {
  it('forbids non-admins from listing or managing users', async () => {
    const customer = await registerUser();

    const listRes = await request(app)
      .get('/api/v1/users')
      .set('Authorization', `Bearer ${customer.accessToken}`);
    expect(listRes.status).toBe(403);
  });

  it('lets an admin list, view, and deactivate a user', async () => {
    const admin = await registerUser({ role: 'admin' });
    const customer = await registerUser();

    const listRes = await request(app)
      .get('/api/v1/users?role=customer')
      .set('Authorization', `Bearer ${admin.accessToken}`);
    expect(listRes.status).toBe(200);
    expect(listRes.body.data.items.some((u) => u._id === customer.user._id)).toBe(true);

    const deactivateRes = await request(app)
      .patch(`/api/v1/users/${customer.user._id}`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ isActive: false });
    expect(deactivateRes.status).toBe(200);
    expect(deactivateRes.body.data.isActive).toBe(false);

    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: customer.email, password: customer.password });
    expect(loginRes.status).toBe(401);
  });

  it('forbids non-admins from creating a user', async () => {
    const customer = await registerUser();
    const res = await request(app)
      .post('/api/v1/users')
      .set('Authorization', `Bearer ${customer.accessToken}`)
      .send({ name: 'New Rider', email: 'newrider@example.com', password: 'Str0ngPass', role: 'rider' });
    expect(res.status).toBe(403);
  });

  it('lets an admin create a user with any role, and log in as them', async () => {
    const admin = await registerUser({ role: 'admin' });

    const createRes = await request(app)
      .post('/api/v1/users')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({
        name: 'New Rider',
        email: 'newrider@example.com',
        phone: '+252611555000',
        password: 'Str0ngPass1',
        role: 'rider',
      });

    expect(createRes.status).toBe(201);
    expect(createRes.body.data.role).toBe('rider');
    expect(createRes.body.data.email).toBe('newrider@example.com');
    expect(createRes.body.data.passwordHash).toBeUndefined();

    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'newrider@example.com', password: 'Str0ngPass1' });
    expect(loginRes.status).toBe(200);
    expect(loginRes.body.data.user.role).toBe('rider');
  });

  it('defaults to the customer role when none is given, and rejects a duplicate email', async () => {
    const admin = await registerUser({ role: 'admin' });

    const createRes = await request(app)
      .post('/api/v1/users')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ name: 'No Role Given', email: 'norole@example.com', password: 'Str0ngPass1' });
    expect(createRes.status).toBe(201);
    expect(createRes.body.data.role).toBe('customer');

    const dupeRes = await request(app)
      .post('/api/v1/users')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ name: 'Duplicate', email: 'norole@example.com', password: 'Str0ngPass1' });
    expect(dupeRes.status).toBe(409);
  });
});
