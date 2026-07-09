/**
 * Seeds the database with one account per role (admin/pharmacist/rider/
 * customer), a verified pharmacy, two categories, and four medicines —
 * enough to explore every screen in the admin panel and mobile app
 * without placing a real order first.
 *
 * Safe to re-run: it always creates fresh documents, so running it twice
 * against the same database will fail on the second run with duplicate
 * email/license errors rather than silently doubling the data. Point it
 * at a fresh database (see `npm run dev:mongo`) each time you want a
 * clean seed.
 *
 * Usage: npm run seed
 */
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');
const Pharmacy = require('../src/models/Pharmacy');
const Category = require('../src/models/Category');
const Medicine = require('../src/models/Medicine');
const Coupon = require('../src/models/Coupon');

const PASSWORD = 'Passw0rd1';

async function main() {
  await mongoose.connect(process.env.MONGO_URI);

  const passwordHash = await User.hashPassword(PASSWORD);

  const admin = await User.create({
    name: 'Amina Admin',
    email: 'admin@zaaddahab.test',
    phone: '+252611000001',
    passwordHash,
    role: 'admin',
  });

  const pharmacistUser = await User.create({
    name: 'Farah Pharmacist',
    email: 'pharmacist@zaaddahab.test',
    phone: '+252611000002',
    passwordHash,
    role: 'pharmacist',
  });

  const rider = await User.create({
    name: 'Warsame Rider',
    email: 'rider@zaaddahab.test',
    phone: '+252611000003',
    passwordHash,
    role: 'rider',
  });

  const customer = await User.create({
    name: 'Hodan Customer',
    email: 'customer@zaaddahab.test',
    phone: '+252611000004',
    passwordHash,
    role: 'customer',
    addresses: [
      {
        label: 'Home',
        street: '45 Wellness Ave',
        city: 'Mogadishu',
        lat: 2.0469,
        lng: 45.3182,
        isDefault: true,
      },
    ],
  });

  const pharmacy = await Pharmacy.create({
    name: 'Hodan Pharmacy',
    description: 'A trusted neighborhood pharmacy in Mogadishu.',
    owner: pharmacistUser._id,
    phone: '+252611222333',
    email: 'contact@hodanpharmacy.test',
    licenseNumber: `PH-${Date.now()}`,
    address: { street: '12 Market Street', city: 'Mogadishu', lat: 2.0371, lng: 45.3438 },
    isVerified: true,
    isActive: true,
  });

  pharmacistUser.pharmacy = pharmacy._id;
  await pharmacistUser.save();

  const [painRelief, vitamins] = await Category.create([
    { name: 'Pain Relief', slug: 'pain-relief', description: 'Pain and fever relief medication.' },
    { name: 'Vitamins & Supplements', slug: 'vitamins-supplements', description: 'Daily vitamins and supplements.' },
  ]);

  const medicines = await Medicine.create([
    {
      name: 'Paracetamol 500mg',
      description: 'Fast-acting pain and fever relief, 20 tablets.',
      pharmacy: pharmacy._id,
      category: painRelief._id,
      manufacturer: 'HealWell Pharma',
      unit: '20 Tablets',
      price: 3.5,
      stock: 120,
      requiresPrescription: false,
      tags: ['pain', 'fever'],
    },
    {
      name: 'Ibuprofen 200mg',
      description: 'Anti-inflammatory pain relief, 30 tablets.',
      pharmacy: pharmacy._id,
      category: painRelief._id,
      manufacturer: 'HealWell Pharma',
      unit: '30 Tablets',
      price: 4.2,
      discountPrice: 3.6,
      stock: 80,
      requiresPrescription: false,
      tags: ['pain', 'inflammation'],
    },
    {
      name: 'Vitamin C 1000mg',
      description: 'Immune support effervescent tablets, 60 count.',
      pharmacy: pharmacy._id,
      category: vitamins._id,
      manufacturer: 'NutriLife',
      unit: '60 Tablets',
      price: 8,
      stock: 200,
      requiresPrescription: false,
      tags: ['immune', 'vitamin'],
    },
    {
      name: 'Multivitamin Daily',
      description: 'Complete daily multivitamin, 90 capsules.',
      pharmacy: pharmacy._id,
      category: vitamins._id,
      manufacturer: 'NutriLife',
      unit: '90 Capsules',
      price: 12.5,
      stock: 60,
      requiresPrescription: false,
      tags: ['vitamin', 'daily'],
    },
  ]);

  await Coupon.create({
    code: 'WELCOME10',
    description: '10% off your first order',
    type: 'percentage',
    value: 10,
    minSubtotal: 5,
    isActive: true,
  });

  console.log('Seed complete. Test accounts (all use the same password):\n');
  console.log(`  Password for every account below: ${PASSWORD}\n`);
  console.log(`  Admin:      ${admin.email}`);
  console.log(`  Pharmacist: ${pharmacistUser.email}`);
  console.log(`  Rider:      ${rider.email}`);
  console.log(`  Customer:   ${customer.email}`);
  console.log(`\n  Pharmacy: ${pharmacy.name} (${medicines.length} medicines seeded)`);
  console.log(`  Coupon:   WELCOME10 (10% off, min $5)`);

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
