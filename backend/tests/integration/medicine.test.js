const request = require('supertest');
const app = require('../../src/app');
const {
  registerUser,
  createPharmacy,
  createCategory,
  createMedicine,
} = require('../helpers/factory');

describe('Medicine API', () => {
  it('requires a registered pharmacy before a pharmacist can list medicines', async () => {
    const admin = await registerUser({ role: 'admin' });
    const pharmacist = await registerUser({ role: 'pharmacist' });
    const category = await createCategory(admin.accessToken);

    const res = await request(app)
      .post('/api/v1/medicines')
      .set('Authorization', `Bearer ${pharmacist.accessToken}`)
      .send({ name: 'Test Med', category: category._id, unit: '10 tabs', price: 5, stock: 10 });

    expect(res.status).toBe(403);
  });

  it('creates a medicine under the pharmacist own pharmacy automatically', async () => {
    const admin = await registerUser({ role: 'admin' });
    const pharmacist = await registerUser({ role: 'pharmacist' });
    const pharmacy = await createPharmacy(pharmacist.accessToken);
    const category = await createCategory(admin.accessToken);

    const medicine = await createMedicine(pharmacist.accessToken, category._id);
    expect(medicine.pharmacy).toBe(pharmacy._id);
  });

  it('lists medicines with category/pharmacy/price filters and pagination', async () => {
    const admin = await registerUser({ role: 'admin' });
    const pharmacist = await registerUser({ role: 'pharmacist' });
    await createPharmacy(pharmacist.accessToken);
    const category = await createCategory(admin.accessToken);

    await createMedicine(pharmacist.accessToken, category._id, { name: 'Cheap Item', price: 5 });
    await createMedicine(pharmacist.accessToken, category._id, { name: 'Pricey Item', price: 100 });

    const res = await request(app).get(`/api/v1/medicines?category=${category._id}&maxPrice=10`);

    expect(res.status).toBe(200);
    expect(res.body.data.items).toHaveLength(1);
    expect(res.body.data.items[0].name).toBe('Cheap Item');
    expect(res.body.data.meta.total).toBe(1);
  });

  it('forbids a non-owner pharmacist from updating or deleting a medicine', async () => {
    const admin = await registerUser({ role: 'admin' });
    const pharmacistA = await registerUser({ role: 'pharmacist' });
    const pharmacistB = await registerUser({ role: 'pharmacist' });
    await createPharmacy(pharmacistA.accessToken);
    await createPharmacy(pharmacistB.accessToken);
    const category = await createCategory(admin.accessToken);
    const medicine = await createMedicine(pharmacistA.accessToken, category._id);

    const updateRes = await request(app)
      .patch(`/api/v1/medicines/${medicine._id}`)
      .set('Authorization', `Bearer ${pharmacistB.accessToken}`)
      .send({ price: 1 });
    expect(updateRes.status).toBe(403);

    const deleteRes = await request(app)
      .delete(`/api/v1/medicines/${medicine._id}`)
      .set('Authorization', `Bearer ${pharmacistB.accessToken}`);
    expect(deleteRes.status).toBe(403);
  });

  it('allows the owning pharmacist to update stock and price', async () => {
    const admin = await registerUser({ role: 'admin' });
    const pharmacist = await registerUser({ role: 'pharmacist' });
    await createPharmacy(pharmacist.accessToken);
    const category = await createCategory(admin.accessToken);
    const medicine = await createMedicine(pharmacist.accessToken, category._id, { stock: 10 });

    const res = await request(app)
      .patch(`/api/v1/medicines/${medicine._id}`)
      .set('Authorization', `Bearer ${pharmacist.accessToken}`)
      .send({ stock: 3, price: 15.5 });

    expect(res.status).toBe(200);
    expect(res.body.data.stock).toBe(3);
    expect(res.body.data.price).toBe(15.5);
  });

  it('rejects a discount price that is not lower than the regular price', async () => {
    const admin = await registerUser({ role: 'admin' });
    const pharmacist = await registerUser({ role: 'pharmacist' });
    await createPharmacy(pharmacist.accessToken);
    const category = await createCategory(admin.accessToken);

    const res = await request(app)
      .post('/api/v1/medicines')
      .set('Authorization', `Bearer ${pharmacist.accessToken}`)
      .send({
        name: 'Bad Discount',
        category: category._id,
        unit: '1 unit',
        price: 10,
        discountPrice: 20,
        stock: 5,
      });

    expect(res.status).toBe(400);
  });
});
