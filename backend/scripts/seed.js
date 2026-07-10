/**
 * Seeds the database with one account per role (admin/pharmacist/rider/
 * customer), a verified pharmacy, 6 categories, and 20 medicines (each
 * with a placeholder product image) — enough to explore every screen in
 * the admin panel and mobile app without placing a real order first.
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

  const [painRelief, vitamins, coldFlu, firstAid, personalCare, babyMother] = await Category.create([
    { name: 'Pain Relief', slug: 'pain-relief', description: 'Pain and fever relief medication.', sortOrder: 0 },
    { name: 'Vitamins & Supplements', slug: 'vitamins-supplements', description: 'Daily vitamins and supplements.', sortOrder: 1 },
    { name: 'Cold & Flu', slug: 'cold-flu', description: 'Cold, flu, and cough relief.', sortOrder: 2 },
    { name: 'First Aid', slug: 'first-aid', description: 'Wound care and first-aid essentials.', sortOrder: 3 },
    { name: 'Personal Care', slug: 'personal-care', description: 'Hygiene and skin care.', sortOrder: 4 },
    { name: 'Baby & Mother Care', slug: 'baby-mother-care', description: 'Baby and maternal health essentials.', sortOrder: 5 },
  ]);

  // No image upload capability exists yet (see backend/README.md), so
  // these point at a placeholder-image generator rather than pretending
  // to be real product photography — clearly labeled placeholders, one
  // colorway per category, just there to demonstrate the mobile app's
  // image rendering with a visually varied, non-monotone catalog.
  const PALETTE = {
    painRelief: ['dcf2e6', '046c4a'],
    vitamins: ['fdeed2', '8a5a06'],
    coldFlu: ['dbeafc', '14508c'],
    firstAid: ['fde2e2', '9c2b2b'],
    personalCare: ['e7e4f7', '4436a3'],
    babyMother: ['fce4f0', 'a3266f'],
  };
  const placeholderImage = (paletteKey, label) => {
    const [bg, fg] = PALETTE[paletteKey];
    return `https://placehold.co/500x500/${bg}/${fg}?text=${encodeURIComponent(label)}`;
  };

  const medicines = await Medicine.create([
    // Pain Relief
    {
      name: 'Paracetamol 500mg',
      description: 'Fast-acting pain and fever relief, 20 tablets.',
      pharmacy: pharmacy._id,
      category: painRelief._id,
      manufacturer: 'HealWell Pharma',
      unit: '20 Tablets',
      price: 3.5,
      stock: 120,
      tags: ['pain', 'fever'],
      images: [placeholderImage('painRelief', 'Paracetamol')],
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
      tags: ['pain', 'inflammation'],
      images: [placeholderImage('painRelief', 'Ibuprofen')],
    },
    {
      name: 'Aspirin 325mg',
      description: 'Pain reliever and fever reducer, 24 tablets.',
      pharmacy: pharmacy._id,
      category: painRelief._id,
      manufacturer: 'HealWell Pharma',
      unit: '24 Tablets',
      price: 3.1,
      stock: 95,
      tags: ['pain', 'fever'],
      images: [placeholderImage('painRelief', 'Aspirin')],
    },
    {
      name: 'Naproxen 250mg',
      description: 'Extended pain relief for chronic conditions, 14 tablets.',
      pharmacy: pharmacy._id,
      category: painRelief._id,
      manufacturer: 'HealWell Pharma',
      unit: '14 Tablets',
      price: 6.75,
      stock: 40,
      requiresPrescription: true,
      tags: ['pain', 'chronic'],
      images: [placeholderImage('painRelief', 'Naproxen')],
    },
    // Vitamins & Supplements
    {
      name: 'Vitamin C 1000mg',
      description: 'Immune support effervescent tablets, 60 count.',
      pharmacy: pharmacy._id,
      category: vitamins._id,
      manufacturer: 'NutriLife',
      unit: '60 Tablets',
      price: 8,
      stock: 200,
      tags: ['immune', 'vitamin'],
      images: [placeholderImage('vitamins', 'Vitamin+C')],
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
      tags: ['vitamin', 'daily'],
      images: [placeholderImage('vitamins', 'Multivitamin')],
    },
    {
      name: 'Vitamin D3 2000IU',
      description: 'Bone and immune health softgels, 60 count.',
      pharmacy: pharmacy._id,
      category: vitamins._id,
      manufacturer: 'NutriLife',
      unit: '60 Softgels',
      price: 9.25,
      stock: 150,
      tags: ['vitamin', 'bone'],
      images: [placeholderImage('vitamins', 'Vitamin+D3')],
    },
    {
      name: 'Omega-3 Fish Oil',
      description: 'Heart and brain health softgels, 100 count.',
      pharmacy: pharmacy._id,
      category: vitamins._id,
      manufacturer: 'NutriLife',
      unit: '100 Softgels',
      price: 14.99,
      discountPrice: 12.99,
      stock: 70,
      tags: ['omega-3', 'heart'],
      images: [placeholderImage('vitamins', 'Omega-3')],
    },
    // Cold & Flu
    {
      name: 'Cold & Flu Relief Tablets',
      description: 'Multi-symptom cold and flu relief, 16 tablets.',
      pharmacy: pharmacy._id,
      category: coldFlu._id,
      manufacturer: 'ClearAir Labs',
      unit: '16 Tablets',
      price: 5.5,
      stock: 110,
      tags: ['cold', 'flu'],
      images: [placeholderImage('coldFlu', 'Cold+%26+Flu')],
    },
    {
      name: 'Cough Syrup 120ml',
      description: 'Soothing relief for dry and chesty coughs.',
      pharmacy: pharmacy._id,
      category: coldFlu._id,
      manufacturer: 'ClearAir Labs',
      unit: '120ml Bottle',
      price: 6.2,
      stock: 65,
      tags: ['cough', 'cold'],
      images: [placeholderImage('coldFlu', 'Cough+Syrup')],
    },
    {
      name: 'Throat Lozenges',
      description: 'Honey-lemon soothing throat lozenges, 24 count.',
      pharmacy: pharmacy._id,
      category: coldFlu._id,
      manufacturer: 'ClearAir Labs',
      unit: '24 Lozenges',
      price: 3.8,
      stock: 140,
      tags: ['throat', 'cold'],
      images: [placeholderImage('coldFlu', 'Lozenges')],
    },
    // First Aid
    {
      name: 'Adhesive Bandages',
      description: 'Assorted sizes, sterile, 50 count.',
      pharmacy: pharmacy._id,
      category: firstAid._id,
      manufacturer: 'SafeGuard Medical',
      unit: '50 Bandages',
      price: 4.5,
      stock: 180,
      tags: ['first-aid', 'wound'],
      images: [placeholderImage('firstAid', 'Bandages')],
    },
    {
      name: 'Antiseptic Wipes',
      description: 'Alcohol-based cleansing wipes, 100 count.',
      pharmacy: pharmacy._id,
      category: firstAid._id,
      manufacturer: 'SafeGuard Medical',
      unit: '100 Wipes',
      price: 5.9,
      stock: 90,
      tags: ['first-aid', 'antiseptic'],
      images: [placeholderImage('firstAid', 'Antiseptic')],
    },
    {
      name: 'Elastic Bandage Wrap',
      description: 'Self-adhesive support wrap, 3-inch x 5 yards.',
      pharmacy: pharmacy._id,
      category: firstAid._id,
      manufacturer: 'SafeGuard Medical',
      unit: '1 Roll',
      price: 4.1,
      stock: 75,
      tags: ['first-aid', 'support'],
      images: [placeholderImage('firstAid', 'Bandage+Wrap')],
    },
    // Personal Care
    {
      name: 'Hand Sanitizer Gel 250ml',
      description: '70% alcohol, kills 99.9% of germs.',
      pharmacy: pharmacy._id,
      category: personalCare._id,
      manufacturer: 'PureSkin Co.',
      unit: '250ml Bottle',
      price: 3.25,
      stock: 220,
      tags: ['hygiene', 'sanitizer'],
      images: [placeholderImage('personalCare', 'Sanitizer')],
    },
    {
      name: 'Moisturizing Lotion 400ml',
      description: 'Fragrance-free daily body lotion.',
      pharmacy: pharmacy._id,
      category: personalCare._id,
      manufacturer: 'PureSkin Co.',
      unit: '400ml Bottle',
      price: 7.5,
      stock: 85,
      tags: ['skin', 'lotion'],
      images: [placeholderImage('personalCare', 'Lotion')],
    },
    {
      name: 'Sunscreen SPF 50',
      description: 'Broad-spectrum UVA/UVB protection, 150ml.',
      pharmacy: pharmacy._id,
      category: personalCare._id,
      manufacturer: 'PureSkin Co.',
      unit: '150ml Bottle',
      price: 9.99,
      discountPrice: 8.49,
      stock: 55,
      tags: ['skin', 'sunscreen'],
      images: [placeholderImage('personalCare', 'Sunscreen')],
    },
    // Baby & Mother Care
    {
      name: 'Baby Diaper Rash Cream',
      description: 'Zinc oxide barrier cream, 100g.',
      pharmacy: pharmacy._id,
      category: babyMother._id,
      manufacturer: 'LittleOnes Care',
      unit: '100g Tube',
      price: 5.2,
      stock: 60,
      tags: ['baby', 'skin'],
      images: [placeholderImage('babyMother', 'Rash+Cream')],
    },
    {
      name: 'Prenatal Vitamins',
      description: 'Daily prenatal support, 90 capsules.',
      pharmacy: pharmacy._id,
      category: babyMother._id,
      manufacturer: 'LittleOnes Care',
      unit: '90 Capsules',
      price: 13.75,
      stock: 45,
      tags: ['prenatal', 'vitamin'],
      images: [placeholderImage('babyMother', 'Prenatal')],
    },
    {
      name: 'Baby Digital Thermometer',
      description: 'Fast, accurate readings for infants and toddlers.',
      pharmacy: pharmacy._id,
      category: babyMother._id,
      manufacturer: 'LittleOnes Care',
      unit: '1 Unit',
      price: 11.4,
      stock: 30,
      tags: ['baby', 'device'],
      images: [placeholderImage('babyMother', 'Thermometer')],
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
