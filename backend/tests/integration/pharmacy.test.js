const request = require('supertest');
const app = require('../../src/app');
const { registerUser, createPharmacy, verifyPharmacy } = require('../helpers/factory');

describe('Pharmacy API', () => {
  it('rejects pharmacy creation from customers', async () => {
    const customer = await registerUser();
    const res = await request(app)
      .post('/api/v1/pharmacies')
      .set('Authorization', `Bearer ${customer.accessToken}`)
      .send({
        name: 'Test Pharmacy',
        phone: '+252611111111',
        licenseNumber: 'LIC-1',
        address: { street: '1 Main St', city: 'Hargeisa' },
      });

    expect(res.status).toBe(403);
  });

  it('lets a pharmacist create their own pharmacy and links it to their account', async () => {
    const pharmacist = await registerUser({ role: 'pharmacist' });
    const pharmacy = await createPharmacy(pharmacist.accessToken);

    expect(pharmacy.owner).toBe(pharmacist.user._id);
    expect(pharmacy.isVerified).toBe(false);

    const meRes = await request(app)
      .get('/api/v1/users/me')
      .set('Authorization', `Bearer ${pharmacist.accessToken}`);

    expect(meRes.body.data.pharmacy).toBe(pharmacy._id);
  });

  it('prevents a pharmacist from owning a second pharmacy', async () => {
    const pharmacist = await registerUser({ role: 'pharmacist' });
    await createPharmacy(pharmacist.accessToken);

    const res = await request(app)
      .post('/api/v1/pharmacies')
      .set('Authorization', `Bearer ${pharmacist.accessToken}`)
      .send({
        name: 'Second Pharmacy',
        phone: '+252611111112',
        licenseNumber: `LIC-${Date.now()}`,
        address: { street: '2 Main St', city: 'Hargeisa' },
      });

    expect(res.status).toBe(409);
  });

  it('only lists verified + active pharmacies publicly, admins can see all', async () => {
    const admin = await registerUser({ role: 'admin' });
    const pharmacist = await registerUser({ role: 'pharmacist' });
    const pharmacy = await createPharmacy(pharmacist.accessToken);

    const publicListBefore = await request(app).get('/api/v1/pharmacies');
    expect(publicListBefore.body.data.some((p) => p._id === pharmacy._id)).toBe(false);

    await verifyPharmacy(admin.accessToken, pharmacy._id);

    const publicListAfter = await request(app).get('/api/v1/pharmacies');
    expect(publicListAfter.body.data.some((p) => p._id === pharmacy._id)).toBe(true);

    const adminList = await request(app)
      .get('/api/v1/pharmacies?all=true')
      .set('Authorization', `Bearer ${admin.accessToken}`);
    expect(adminList.body.data.some((p) => p._id === pharmacy._id)).toBe(true);
  });

  it('filters the public list by city, case-insensitively, without treating it as a regex', async () => {
    const admin = await registerUser({ role: 'admin' });
    const pharmacist = await registerUser({ role: 'pharmacist' });
    const pharmacy = await createPharmacy(pharmacist.accessToken); // city: 'Mogadishu'
    await verifyPharmacy(admin.accessToken, pharmacy._id);

    const matchLower = await request(app).get('/api/v1/pharmacies?city=mogadishu');
    expect(matchLower.body.data.some((p) => p._id === pharmacy._id)).toBe(true);

    const noMatch = await request(app).get('/api/v1/pharmacies?city=Hargeisa');
    expect(noMatch.body.data.some((p) => p._id === pharmacy._id)).toBe(false);

    // A regex metacharacter in the query must be treated as a literal
    // character, not a pattern — otherwise this is both a ReDoS vector
    // and a way to match unintended cities via crafted input.
    const regexInjection = await request(app).get(
      '/api/v1/pharmacies?city=' + encodeURIComponent('.*'),
    );
    expect(regexInjection.body.data.some((p) => p._id === pharmacy._id)).toBe(false);
  });

  it('forbids a non-owner pharmacist from updating another pharmacy', async () => {
    const pharmacistA = await registerUser({ role: 'pharmacist' });
    const pharmacistB = await registerUser({ role: 'pharmacist' });
    const pharmacy = await createPharmacy(pharmacistA.accessToken);

    const res = await request(app)
      .patch(`/api/v1/pharmacies/${pharmacy._id}`)
      .set('Authorization', `Bearer ${pharmacistB.accessToken}`)
      .send({ description: 'Hijacked' });

    expect(res.status).toBe(403);
  });

  it('ignores isVerified/isActive changes from a non-admin owner', async () => {
    const pharmacist = await registerUser({ role: 'pharmacist' });
    const pharmacy = await createPharmacy(pharmacist.accessToken);

    const res = await request(app)
      .patch(`/api/v1/pharmacies/${pharmacy._id}`)
      .set('Authorization', `Bearer ${pharmacist.accessToken}`)
      .send({ isVerified: true, description: 'Updated' });

    expect(res.status).toBe(200);
    expect(res.body.data.isVerified).toBe(false);
    expect(res.body.data.description).toBe('Updated');
  });

  it('allows admin to delete a pharmacy', async () => {
    const admin = await registerUser({ role: 'admin' });
    const pharmacist = await registerUser({ role: 'pharmacist' });
    const pharmacy = await createPharmacy(pharmacist.accessToken);

    const res = await request(app)
      .delete(`/api/v1/pharmacies/${pharmacy._id}`)
      .set('Authorization', `Bearer ${admin.accessToken}`);

    expect(res.status).toBe(200);
  });
});
