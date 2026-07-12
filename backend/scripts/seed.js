/**
 * Seeds the database with one account per role (admin/pharmacist/rider/
 * customer), a verified pharmacy, 40 categories, and 40 medicines (each
 * with a real product photo) — enough to explore every screen in the
 * admin panel and mobile app without placing a real order first.
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

  // The first 6 categories carry the seeded medicines below (destructured
  // out for their `_id`s); the rest round the taxonomy out to 40 so the
  // Categories screen has a full, realistically-sized browse list — they
  // start out with no medicines, which the catalog UI already handles
  // gracefully via its empty state.
  const [painRelief, vitamins, coldFlu, firstAid, personalCare, babyMother] = await Category.create([
    { name: 'Pain Relief', slug: 'pain-relief', description: 'Pain and fever relief medication.', sortOrder: 0 },
    { name: 'Vitamins & Supplements', slug: 'vitamins-supplements', description: 'Daily vitamins and supplements.', sortOrder: 1 },
    { name: 'Cold & Flu', slug: 'cold-flu', description: 'Cold, flu, and cough relief.', sortOrder: 2 },
    { name: 'First Aid', slug: 'first-aid', description: 'Wound care and first-aid essentials.', sortOrder: 3 },
    { name: 'Personal Care', slug: 'personal-care', description: 'Hygiene and skin care.', sortOrder: 4 },
    { name: 'Baby & Mother Care', slug: 'baby-mother-care', description: 'Baby and maternal health essentials.', sortOrder: 5 },
    { name: 'Allergy & Sinus', slug: 'allergy-sinus', description: 'Allergy and sinus relief.', sortOrder: 6 },
    { name: 'Digestive Health', slug: 'digestive-health', description: 'Antacids, laxatives, and gut health.', sortOrder: 7 },
    { name: 'Eye Care', slug: 'eye-care', description: 'Eye drops and vision care.', sortOrder: 8 },
    { name: 'Ear Care', slug: 'ear-care', description: 'Ear drops and hearing care.', sortOrder: 9 },
    { name: 'Skin Care', slug: 'skin-care', description: 'Moisturizers, treatments, and dermatology.', sortOrder: 10 },
    { name: 'Diabetes Care', slug: 'diabetes-care', description: 'Blood sugar testing and management.', sortOrder: 11 },
    { name: 'Heart & Blood Pressure', slug: 'heart-blood-pressure', description: 'Cardiovascular health essentials.', sortOrder: 12 },
    { name: "Sexual Health", slug: 'sexual-health', description: 'Contraceptives and sexual wellness.', sortOrder: 13 },
    { name: 'Smoking Cessation', slug: 'smoking-cessation', description: 'Nicotine replacement and quit aids.', sortOrder: 14 },
    { name: 'Sleep Aids', slug: 'sleep-aids', description: 'Sleep support and insomnia relief.', sortOrder: 15 },
    { name: 'Weight Management', slug: 'weight-management', description: 'Weight loss and metabolism support.', sortOrder: 16 },
    { name: 'Oral & Dental Care', slug: 'oral-dental-care', description: 'Toothcare, mouthwash, and dental hygiene.', sortOrder: 17 },
    { name: 'Foot Care', slug: 'foot-care', description: 'Foot health and podiatry essentials.', sortOrder: 18 },
    { name: 'Sports Nutrition', slug: 'sports-nutrition', description: 'Performance and recovery supplements.', sortOrder: 19 },
    { name: 'Mental Health & Stress Relief', slug: 'mental-health-stress-relief', description: 'Stress, mood, and mental wellness support.', sortOrder: 20 },
    { name: 'Respiratory Care', slug: 'respiratory-care', description: 'Asthma, inhalers, and breathing support.', sortOrder: 21 },
    { name: 'Joint & Bone Health', slug: 'joint-bone-health', description: 'Joint pain and bone strength support.', sortOrder: 22 },
    { name: 'Immune Support', slug: 'immune-support', description: 'Immune system boosters and defense.', sortOrder: 23 },
    { name: 'Hair Care', slug: 'hair-care', description: 'Hair growth and scalp treatments.', sortOrder: 24 },
    { name: "Men's Health", slug: 'mens-health', description: "Men's wellness essentials.", sortOrder: 25 },
    { name: "Women's Health", slug: 'womens-health', description: "Women's wellness essentials.", sortOrder: 26 },
    { name: 'Senior Care', slug: 'senior-care', description: 'Health essentials for older adults.', sortOrder: 27 },
    { name: 'Travel Health', slug: 'travel-health', description: 'Motion sickness and travel essentials.', sortOrder: 28 },
    { name: 'Herbal & Natural Remedies', slug: 'herbal-natural-remedies', description: 'Plant-based and natural wellness products.', sortOrder: 29 },
    { name: 'Medical Devices', slug: 'medical-devices', description: 'Home health monitoring devices.', sortOrder: 30 },
    { name: 'Diagnostic Tests & Monitors', slug: 'diagnostic-tests-monitors', description: 'At-home test kits and monitors.', sortOrder: 31 },
    { name: 'Orthopedic Supports & Braces', slug: 'orthopedic-supports-braces', description: 'Braces, supports, and mobility aids.', sortOrder: 32 },
    { name: 'Incontinence Care', slug: 'incontinence-care', description: 'Incontinence and bladder care products.', sortOrder: 33 },
    { name: 'Wound Care & Dressings', slug: 'wound-care-dressings', description: 'Advanced wound care and dressings.', sortOrder: 34 },
    { name: 'Nutrition & Meal Replacement', slug: 'nutrition-meal-replacement', description: 'Nutritional shakes and meal replacements.', sortOrder: 35 },
    { name: 'Homeopathy', slug: 'homeopathy', description: 'Homeopathic and alternative remedies.', sortOrder: 36 },
    { name: 'Cough & Throat Care', slug: 'cough-throat-care', description: 'Cough suppressants and throat relief.', sortOrder: 37 },
    { name: 'Fever & Headache', slug: 'fever-headache', description: 'Fever reducers and headache relief.', sortOrder: 38 },
    { name: 'Hygiene & Sanitation', slug: 'hygiene-sanitation', description: 'Hand hygiene and sanitation supplies.', sortOrder: 39 },
  ]);

  // Real product photos, one per medicine — all sourced from Wikimedia
  // Commons (public domain / CC-licensed, and reliably hotlink-safe,
  // unlike most retailer/manufacturer product photography). Test/demo
  // data only: swap these for actual licensed photography before any
  // real deployment.
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
      images: ['https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/Paracetamol_acetaminophen_500_mg_pills.jpg/500px-Paracetamol_acetaminophen_500_mg_pills.jpg'],
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
      images: ['https://upload.wikimedia.org/wikipedia/commons/thumb/b/b6/Pile_of_200mg_generic_Ibuprofen_tablets.jpg/500px-Pile_of_200mg_generic_Ibuprofen_tablets.jpg'],
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
      images: ['https://upload.wikimedia.org/wikipedia/commons/thumb/4/42/Regular_strength_enteric_coated_aspirin_tablets.jpg/500px-Regular_strength_enteric_coated_aspirin_tablets.jpg'],
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
      images: ['https://upload.wikimedia.org/wikipedia/commons/thumb/7/72/Naproxen-250mg-16190835697216573249398282984232.jpg/500px-Naproxen-250mg-16190835697216573249398282984232.jpg'],
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
      images: ['https://upload.wikimedia.org/wikipedia/commons/thumb/e/ec/Celaskon_500mg_tablets.jpg/500px-Celaskon_500mg_tablets.jpg'],
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
      images: ['https://upload.wikimedia.org/wikipedia/commons/thumb/2/26/Multivitamin_product.jpg/500px-Multivitamin_product.jpg'],
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
      images: ['https://upload.wikimedia.org/wikipedia/commons/thumb/c/c7/Vitamin_D_pills.jpg/500px-Vitamin_D_pills.jpg'],
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
      images: ['https://upload.wikimedia.org/wikipedia/commons/thumb/8/86/Omega_3_capsules_in_a_bottle_%2852715343808%29.jpg/500px-Omega_3_capsules_in_a_bottle_%2852715343808%29.jpg'],
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
      images: ['https://upload.wikimedia.org/wikipedia/commons/thumb/7/70/Blue_and_Red_Pills_%28Cold_Pills_and_Decongestants%29.JPG/500px-Blue_and_Red_Pills_%28Cold_Pills_and_Decongestants%29.JPG'],
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
      images: ['https://upload.wikimedia.org/wikipedia/commons/thumb/f/f2/Sirop_toux.jpg/500px-Sirop_toux.jpg'],
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
      images: ['https://upload.wikimedia.org/wikipedia/commons/thumb/4/49/Cough_drops.jpg/500px-Cough_drops.jpg'],
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
      images: ['https://upload.wikimedia.org/wikipedia/commons/thumb/1/13/Adhesive_bandage.jpg/500px-Adhesive_bandage.jpg'],
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
      images: ['https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/McDonald%27s_Hand_Sanitizing_Wipes_%2814516744846%29.jpg/500px-McDonald%27s_Hand_Sanitizing_Wipes_%2814516744846%29.jpg'],
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
      images: ['https://upload.wikimedia.org/wikipedia/commons/thumb/7/72/US_Elastic_Bandage.JPG/500px-US_Elastic_Bandage.JPG'],
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
      images: ['https://upload.wikimedia.org/wikipedia/commons/thumb/7/7f/Equate_hand_sanitizer_34_fl_oz.jpg/500px-Equate_hand_sanitizer_34_fl_oz.jpg'],
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
      images: ['https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/Equate_lotion.jpg/500px-Equate_lotion.jpg'],
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
      images: ['https://upload.wikimedia.org/wikipedia/commons/thumb/d/d0/Sunbum_sunscreen_spf_30.jpg/500px-Sunbum_sunscreen_spf_30.jpg'],
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
      images: ['https://upload.wikimedia.org/wikipedia/commons/thumb/6/66/Sudocrem_tub.jpg/500px-Sudocrem_tub.jpg'],
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
      images: ['https://upload.wikimedia.org/wikipedia/commons/thumb/4/42/Prenatal_vitamin_tablets.jpg/500px-Prenatal_vitamin_tablets.jpg'],
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
      images: ['https://upload.wikimedia.org/wikipedia/commons/thumb/f/f8/Omron_digital_thermometer.jpg/500px-Omron_digital_thermometer.jpg'],
    },
    // More Pain Relief
    {
      name: 'Acetaminophen Extra Strength',
      description: 'Extra-strength fever and pain relief, 50 tablets.',
      pharmacy: pharmacy._id,
      category: painRelief._id,
      manufacturer: 'HealWell Pharma',
      unit: '50 Tablets',
      price: 5.4,
      stock: 100,
      tags: ['pain', 'fever'],
      images: ['https://upload.wikimedia.org/wikipedia/commons/thumb/2/21/Tylenol_rapid_release_pills.jpg/500px-Tylenol_rapid_release_pills.jpg'],
    },
    {
      name: 'Diclofenac Gel 1%',
      description: 'Topical anti-inflammatory gel for joint and muscle pain, 100g.',
      pharmacy: pharmacy._id,
      category: painRelief._id,
      manufacturer: 'HealWell Pharma',
      unit: '100g Tube',
      price: 7.9,
      stock: 55,
      requiresPrescription: true,
      tags: ['pain', 'topical'],
      images: ['https://upload.wikimedia.org/wikipedia/commons/thumb/f/f3/Diclofenac_Topical_Gel.jpg/500px-Diclofenac_Topical_Gel.jpg'],
    },
    {
      name: 'Muscle Relief Rub',
      description: 'Menthol muscle and joint pain relief cream, 90g.',
      pharmacy: pharmacy._id,
      category: painRelief._id,
      manufacturer: 'HealWell Pharma',
      unit: '90g Tube',
      price: 6.25,
      stock: 70,
      tags: ['pain', 'muscle'],
      images: ['https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Vicks_VapoRub_%2851013600352%29.jpg/500px-Vicks_VapoRub_%2851013600352%29.jpg'],
    },
    // More Vitamins & Supplements
    {
      name: 'Vitamin B12 1000mcg',
      description: 'Energy and nervous system support, 60 tablets.',
      pharmacy: pharmacy._id,
      category: vitamins._id,
      manufacturer: 'NutriLife',
      unit: '60 Tablets',
      price: 9.5,
      stock: 130,
      tags: ['vitamin', 'energy'],
      images: ['https://upload.wikimedia.org/wikipedia/commons/thumb/6/66/B_vitamin_supplement_tablets.jpg/500px-B_vitamin_supplement_tablets.jpg'],
    },
    {
      name: 'Zinc Supplement 50mg',
      description: 'Immune support mineral supplement, 60 capsules.',
      pharmacy: pharmacy._id,
      category: vitamins._id,
      manufacturer: 'NutriLife',
      unit: '60 Capsules',
      price: 7.2,
      stock: 90,
      tags: ['immune', 'mineral'],
      images: ['https://upload.wikimedia.org/wikipedia/commons/thumb/6/65/Medpath_Natural_%28ZINC%29_100MG.jpg/500px-Medpath_Natural_%28ZINC%29_100MG.jpg'],
    },
    {
      name: 'Calcium + Vitamin D3',
      description: 'Bone strength support, 100 tablets.',
      pharmacy: pharmacy._id,
      category: vitamins._id,
      manufacturer: 'NutriLife',
      unit: '100 Tablets',
      price: 10.8,
      stock: 75,
      tags: ['vitamin', 'bone'],
      images: ['https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/500_mg_calcium_supplements_with_vitamin_D.jpg/500px-500_mg_calcium_supplements_with_vitamin_D.jpg'],
    },
    {
      name: 'Probiotic Capsules',
      description: 'Digestive and gut health support, 30 capsules.',
      pharmacy: pharmacy._id,
      category: vitamins._id,
      manufacturer: 'NutriLife',
      unit: '30 Capsules',
      price: 15.5,
      discountPrice: 13.25,
      stock: 40,
      tags: ['digestive', 'probiotic'],
      images: ['https://upload.wikimedia.org/wikipedia/commons/thumb/d/d5/Probiotic_with_FOS.jpg/500px-Probiotic_with_FOS.jpg'],
    },
    // More Cold & Flu
    {
      name: 'Nasal Decongestant Spray',
      description: 'Fast relief from nasal congestion, 15ml.',
      pharmacy: pharmacy._id,
      category: coldFlu._id,
      manufacturer: 'ClearAir Labs',
      unit: '15ml Spray',
      price: 4.6,
      stock: 100,
      tags: ['congestion', 'cold'],
      images: ['https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Nasal-vasoconstrictor.JPG/500px-Nasal-vasoconstrictor.JPG'],
    },
    {
      name: 'Daytime Flu Relief Caplets',
      description: 'Non-drowsy multi-symptom flu relief, 20 caplets.',
      pharmacy: pharmacy._id,
      category: coldFlu._id,
      manufacturer: 'ClearAir Labs',
      unit: '20 Caplets',
      price: 6.9,
      stock: 85,
      tags: ['flu', 'cold'],
      images: ['https://upload.wikimedia.org/wikipedia/commons/thumb/d/da/DayQuil_%285990504169%29.jpg/500px-DayQuil_%285990504169%29.jpg'],
    },
    {
      name: 'Saline Nasal Spray',
      description: 'Gentle, drug-free nasal moisturizing spray, 30ml.',
      pharmacy: pharmacy._id,
      category: coldFlu._id,
      manufacturer: 'ClearAir Labs',
      unit: '30ml Spray',
      price: 3.4,
      stock: 120,
      tags: ['congestion', 'baby-safe'],
      images: ['https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/N%C3%A4sspray.jpg/500px-N%C3%A4sspray.jpg'],
    },
    // More First Aid
    {
      name: 'Sterile Gauze Pads',
      description: 'Individually wrapped sterile gauze, 4x4in, 25 count.',
      pharmacy: pharmacy._id,
      category: firstAid._id,
      manufacturer: 'SafeGuard Medical',
      unit: '25 Pads',
      price: 5.1,
      stock: 100,
      tags: ['first-aid', 'wound'],
      images: ['https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Gauze_compress.jpg/500px-Gauze_compress.jpg'],
    },
    {
      name: 'Medical Adhesive Tape',
      description: 'Breathable hypoallergenic tape, 1-inch x 10 yards.',
      pharmacy: pharmacy._id,
      category: firstAid._id,
      manufacturer: 'SafeGuard Medical',
      unit: '1 Roll',
      price: 3.6,
      stock: 130,
      tags: ['first-aid', 'wound'],
      images: ['https://upload.wikimedia.org/wikipedia/commons/thumb/7/70/Adhesive_surgical_paper_tape.jpg/500px-Adhesive_surgical_paper_tape.jpg'],
    },
    {
      name: 'Instant Cold Pack',
      description: 'Single-use instant cold compress for injuries.',
      pharmacy: pharmacy._id,
      category: firstAid._id,
      manufacturer: 'SafeGuard Medical',
      unit: '1 Pack',
      price: 2.9,
      stock: 150,
      tags: ['first-aid', 'injury'],
      images: ['https://upload.wikimedia.org/wikipedia/commons/thumb/b/bb/Ice_pack.jpg/500px-Ice_pack.jpg'],
    },
    // More Personal Care
    {
      name: 'Antibacterial Soap 200ml',
      description: 'Gentle daily antibacterial hand and body wash.',
      pharmacy: pharmacy._id,
      category: personalCare._id,
      manufacturer: 'PureSkin Co.',
      unit: '200ml Bottle',
      price: 2.75,
      stock: 200,
      tags: ['hygiene', 'soap'],
      images: ['https://upload.wikimedia.org/wikipedia/commons/thumb/9/95/Equate_antibacterial_liquid_hand_soap.jpg/500px-Equate_antibacterial_liquid_hand_soap.jpg'],
    },
    {
      name: 'Insect Repellent Spray',
      description: 'DEET-free mosquito and insect protection, 120ml.',
      pharmacy: pharmacy._id,
      category: personalCare._id,
      manufacturer: 'PureSkin Co.',
      unit: '120ml Bottle',
      price: 6.4,
      stock: 90,
      tags: ['outdoor', 'repellent'],
      images: ['https://upload.wikimedia.org/wikipedia/commons/thumb/7/71/Off_and_Cutter_DEET_Insect_Repellent_-_Bug_Spray_%2827827388427%29.jpg/500px-Off_and_Cutter_DEET_Insect_Repellent_-_Bug_Spray_%2827827388427%29.jpg'],
    },
    {
      name: 'Lip Balm SPF 15',
      description: 'Moisturizing lip protection with sun defense.',
      pharmacy: pharmacy._id,
      category: personalCare._id,
      manufacturer: 'PureSkin Co.',
      unit: '1 Stick',
      price: 2.1,
      stock: 160,
      tags: ['skin', 'sunscreen'],
      images: ['https://upload.wikimedia.org/wikipedia/commons/thumb/0/0b/EOS_lip_balm_1.jpg/500px-EOS_lip_balm_1.jpg'],
    },
    // More Baby & Mother Care
    {
      name: 'Baby Wipes Sensitive',
      description: 'Fragrance-free gentle cleansing wipes, 80 count.',
      pharmacy: pharmacy._id,
      category: babyMother._id,
      manufacturer: 'LittleOnes Care',
      unit: '80 Wipes',
      price: 4.3,
      stock: 140,
      tags: ['baby', 'hygiene'],
      images: ['https://upload.wikimedia.org/wikipedia/commons/thumb/8/83/Baby_wipes.jpg/500px-Baby_wipes.jpg'],
    },
    {
      name: 'Infant Formula Stage 1',
      description: 'Nutritionally complete formula for newborns, 900g.',
      pharmacy: pharmacy._id,
      category: babyMother._id,
      manufacturer: 'LittleOnes Care',
      unit: '900g Tin',
      price: 21.5,
      stock: 50,
      tags: ['baby', 'nutrition'],
      images: ['https://upload.wikimedia.org/wikipedia/commons/thumb/f/f4/Baby_Formula_Powder_%2850841930296%29.jpg/500px-Baby_Formula_Powder_%2850841930296%29.jpg'],
    },
    {
      name: 'Nipple Cream',
      description: 'Soothing lanolin cream for breastfeeding comfort, 40g.',
      pharmacy: pharmacy._id,
      category: babyMother._id,
      manufacturer: 'LittleOnes Care',
      unit: '40g Tube',
      price: 8.6,
      stock: 45,
      tags: ['maternal', 'skin'],
      images: ['https://upload.wikimedia.org/wikipedia/commons/thumb/9/98/Dexpanthenol_by_Danny_S._-_001.JPG/500px-Dexpanthenol_by_Danny_S._-_001.JPG'],
    },
    {
      name: 'Gripe Water',
      description: 'Natural relief for infant colic and gas, 150ml.',
      pharmacy: pharmacy._id,
      category: babyMother._id,
      manufacturer: 'LittleOnes Care',
      unit: '150ml Bottle',
      price: 6.75,
      stock: 65,
      tags: ['baby', 'digestive'],
      images: ['https://upload.wikimedia.org/wikipedia/commons/thumb/d/d1/Gripe_cordial_%3B_without_laudanum_%3B_doses..._Wellcome_L0035140.jpg/500px-Gripe_cordial_%3B_without_laudanum_%3B_doses..._Wellcome_L0035140.jpg'],
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
