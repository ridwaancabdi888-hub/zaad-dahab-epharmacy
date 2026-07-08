const request = require('supertest');
const app = require('../../src/app');
const User = require('../../src/models/User');

let counter = 0;
function nextEmail(prefix) {
  counter += 1;
  return `${prefix}${counter}@example.com`;
}

async function registerUser({ role = 'customer', ...overrides } = {}) {
  const email = overrides.email || nextEmail(role);
  const password = overrides.password || 'Str0ngPass';

  const res = await request(app)
    .post('/api/v1/auth/register')
    .send({
      name: overrides.name || `${role} user`,
      email,
      password,
      phone: overrides.phone,
    });

  if (res.status !== 201) {
    throw new Error(`Failed to register test user: ${JSON.stringify(res.body)}`);
  }

  const { accessToken, user } = res.body.data;

  if (role !== 'customer') {
    await User.findByIdAndUpdate(user._id, { role });
  }

  return { accessToken, user: { ...user, role }, email, password };
}

async function createPharmacy(pharmacistToken, overrides = {}) {
  const res = await request(app)
    .post('/api/v1/pharmacies')
    .set('Authorization', `Bearer ${pharmacistToken}`)
    .send({
      name: overrides.name || 'City Care Pharmacy',
      phone: overrides.phone || '+252611000000',
      licenseNumber: overrides.licenseNumber || `LIC-${Date.now()}-${Math.random()}`,
      address: overrides.address || { street: '123 Main St', city: 'Mogadishu' },
    });

  if (res.status !== 201) {
    throw new Error(`Failed to create test pharmacy: ${JSON.stringify(res.body)}`);
  }

  return res.body.data;
}

async function verifyPharmacy(adminToken, pharmacyId) {
  const res = await request(app)
    .patch(`/api/v1/pharmacies/${pharmacyId}/verify`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ isVerified: true });

  if (res.status !== 200) {
    throw new Error(`Failed to verify test pharmacy: ${JSON.stringify(res.body)}`);
  }

  return res.body.data;
}

async function createCategory(adminToken, overrides = {}) {
  const res = await request(app)
    .post('/api/v1/categories')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ name: overrides.name || `Category ${Date.now()}-${Math.random()}` });

  if (res.status !== 201) {
    throw new Error(`Failed to create test category: ${JSON.stringify(res.body)}`);
  }

  return res.body.data;
}

async function createMedicine(pharmacistToken, categoryId, overrides = {}) {
  const res = await request(app)
    .post('/api/v1/medicines')
    .set('Authorization', `Bearer ${pharmacistToken}`)
    .send({
      name: overrides.name || 'Vitality Multivitamin',
      category: categoryId,
      unit: overrides.unit || '60 Capsules',
      price: overrides.price ?? 24.99,
      stock: overrides.stock ?? 50,
      requiresPrescription: overrides.requiresPrescription ?? false,
    });

  if (res.status !== 201) {
    throw new Error(`Failed to create test medicine: ${JSON.stringify(res.body)}`);
  }

  return res.body.data;
}

/** Full fixture: verified pharmacy + category + medicine, owned by a fresh pharmacist. */
async function buildCatalogFixture(adminToken, medicineOverrides = {}) {
  const pharmacist = await registerUser({ role: 'pharmacist' });
  const pharmacy = await createPharmacy(pharmacist.accessToken);
  await verifyPharmacy(adminToken, pharmacy._id);
  const category = await createCategory(adminToken);
  const medicine = await createMedicine(pharmacist.accessToken, category._id, medicineOverrides);

  return { pharmacist, pharmacy, category, medicine };
}

module.exports = {
  registerUser,
  createPharmacy,
  verifyPharmacy,
  createCategory,
  createMedicine,
  buildCatalogFixture,
};
