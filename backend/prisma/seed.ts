import 'dotenv/config';
import { PrismaClient } from '../src/generated';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clean existing data
  await prisma.auditLog.deleteMany();
  await prisma.message.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.review.deleteMany();
  await prisma.walletTransaction.deleteMany();
  await prisma.dispute.deleteMany();
  await prisma.delivery.deleteMany();
  await prisma.escrowLedger.deleteMany();
  await prisma.farmUpdate.deleteMany();
  await prisma.contract.deleteMany();
  await prisma.farmListing.deleteMany();
  await prisma.user.deleteMany();

  // 1. CREATE USERS
  console.log('   Creating users...');

  // Admin
  const admin = await prisma.user.create({
    data: {
      phone: '+910000000000',
      name: 'System Admin',
      email: 'admin@farmconnect.com',
      role: 'ADMIN',
      kyc_status: 'VERIFIED',
      avatar_url: 'https://api.dicebear.com/9.x/glass/svg?seed=Admin',
    },
  });

  // Farmers
  const farmer1 = await prisma.user.create({
    data: {
      phone: '+919876543210',
      name: 'Rajesh Kumar',
      email: 'rajesh@example.com',
      role: 'FARMER',
      kyc_status: 'VERIFIED',
      avatar_url: 'https://api.dicebear.com/9.x/glass/svg?seed=Rajesh',
      address: 'Village Khandewadi',
      city: 'Nashik',
      state: 'Maharashtra',
      pincode: '422001',
      latitude: 19.9975,
      longitude: 73.7898,
      farm_size_acres: 12,
      farm_type: 'Mixed',
      crops_grown: ['Tomato', 'Wheat', 'Onion'],
      irrigation_type: 'Drip',
      years_of_experience: 15,
      soil_type: 'Black Cotton',
      bank_name: 'State Bank of India',
      bank_account_number: '30987654321',
      bank_ifsc: 'SBIN0001234',
      farm_name: 'Rajesh Green Farms',
    },
  });

  const farmer2 = await prisma.user.create({
    data: {
      phone: '+919876543212',
      name: 'Sunita Patil',
      email: 'sunita@example.com',
      role: 'FARMER',
      kyc_status: 'VERIFIED',
      avatar_url: 'https://api.dicebear.com/9.x/glass/svg?seed=Sunita',
      address: 'Village Bhokardan',
      city: 'Jalna',
      state: 'Maharashtra',
      pincode: '431001',
      latitude: 19.8347,
      longitude: 75.8816,
      farm_size_acres: 8,
      farm_type: 'Organic',
      crops_grown: ['Cotton', 'Soybean', 'Turmeric'],
      irrigation_type: 'Sprinkler',
      years_of_experience: 10,
      soil_type: 'Red Laterite',
      bank_name: 'HDFC Bank',
      bank_account_number: '50123456789',
      bank_ifsc: 'HDFC0000123',
      farm_name: 'Sunita Organic Estates',
    },
  });

  const farmer3 = await prisma.user.create({
    data: {
      phone: '+919876543213',
      name: 'Arjun Singh',
      email: 'arjun@example.com',
      role: 'FARMER',
      kyc_status: 'VERIFIED',
      avatar_url: 'https://api.dicebear.com/9.x/glass/svg?seed=Arjun',
      address: 'Village Ramgarh',
      city: 'Amritsar',
      state: 'Punjab',
      pincode: '143001',
      latitude: 31.634,
      longitude: 74.8723,
      farm_size_acres: 25,
      farm_type: 'Commercial',
      crops_grown: ['Wheat', 'Rice', 'Mustard'],
      irrigation_type: 'Canal',
      years_of_experience: 20,
      soil_type: 'Alluvial',
      bank_name: 'Punjab National Bank',
      bank_account_number: '40123456780',
      bank_ifsc: 'PUNB0001234',
      farm_name: 'Golden Harvest Farms',
    },
  });

  const farmer4 = await prisma.user.create({
    data: {
      phone: '+919876543214',
      name: 'Kavita Reddy',
      email: 'kavita@example.com',
      role: 'FARMER',
      kyc_status: 'SUBMITTED',
      avatar_url: 'https://api.dicebear.com/9.x/glass/svg?seed=Kavita',
      address: 'Village Guntur',
      city: 'Guntur',
      state: 'Andhra Pradesh',
      pincode: '522001',
      latitude: 16.3067,
      longitude: 80.4365,
      farm_size_acres: 15,
      farm_type: 'Specialized',
      crops_grown: ['Chilli', 'Tobacco'],
      irrigation_type: 'Rainfed',
      years_of_experience: 8,
      soil_type: 'Red Sandy',
      bank_name: 'Axis Bank',
      bank_account_number: '901234567890',
      bank_ifsc: 'UTIB0000123',
      farm_name: 'Red Spice Orchards',
    },
  });

  // Investors
  const investor1 = await prisma.user.create({
    data: {
      phone: '+919876543211',
      name: 'Vikram Mehta',
      email: 'vikram@example.com',
      role: 'CONSUMER',
      kyc_status: 'VERIFIED',
      avatar_url: 'https://api.dicebear.com/9.x/glass/svg?seed=Vikram',
      address: '42 Bandra West',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400050',
      latitude: 19.0596,
      longitude: 72.8295,
      investment_range: '5L - 20L',
      investment_goals: ['High Returns', 'Organic Support'],
      preferred_farm_types: ['Organic', 'Mixed', 'Hydroponic'],
    },
  });

  const investor2 = await prisma.user.create({
    data: {
      phone: '+919876543215',
      name: 'Ananya Sharma',
      email: 'ananya@example.com',
      role: 'CONSUMER',
      kyc_status: 'VERIFIED',
      avatar_url: 'https://api.dicebear.com/9.x/glass/svg?seed=Ananya',
      address: 'DLF Phase 3',
      city: 'Gurugram',
      state: 'Haryana',
      pincode: '122002',
      latitude: 28.4595,
      longitude: 77.0266,
      investment_range: '20L - 50L',
      investment_goals: ['Sustainable Farming', 'Long-term Growth'],
      preferred_farm_types: ['Commercial', 'Greenhouse'],
    },
  });

  const investor3 = await prisma.user.create({
    data: {
      phone: '+919876543216',
      name: 'Rahul Iyer',
      email: 'rahul@example.com',
      role: 'CONSUMER',
      kyc_status: 'PENDING',
      avatar_url: 'https://api.dicebear.com/9.x/glass/svg?seed=Rahul',
      address: 'Indiranagar 100ft Rd',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560038',
      latitude: 12.9716,
      longitude: 77.5946,
      investment_range: '1L - 5L',
      investment_goals: ['Direct Farmer Support'],
      preferred_farm_types: ['Specialized', 'Organic'],
    },
  });

  // 2. CREATE LISTINGS
  console.log('   Creating listings...');

  const listings = [
    {
      farmer_id: farmer1.id,
      name: 'Premium Tomato Farm — Nashik',
      description: 'High-yield tomato farm with drip irrigation and organic practices. Located in the fertile Nashik belt with consistent water supply. Expected yield 8-10 tons per acre.',
      area_acres: 5,
      price_per_acre: 45000,
      crops: ['Tomato'],
      location_name: 'Khandewadi, Nashik, MH',
      latitude: 19.9975,
      longitude: 73.7898,
      soil_type: 'Black Cotton',
      irrigation_type: 'Drip',
      is_organic: false,
      expected_harvest_month: 'March',
      expected_yield_per_acre: 9,
      images: [
        'https://images.unsplash.com/photo-1592921870789-04563d55041c?w=800',
        'https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?w=800',
      ],
      status: 'ACTIVE',
    },
    {
      farmer_id: farmer1.id,
      name: 'Wheat & Onion Field — Nashik',
      description: 'Diversified farm growing wheat and onion. Rich black soil with excellent drainage. Ideal for investors seeking stable returns.',
      area_acres: 7,
      price_per_acre: 35000,
      crops: ['Wheat', 'Onion'],
      location_name: 'Sinnar, Nashik, MH',
      latitude: 19.8496,
      longitude: 73.9963,
      soil_type: 'Black Cotton',
      irrigation_type: 'Canal',
      is_organic: false,
      expected_harvest_month: 'February',
      expected_yield_per_acre: 6,
      images: [
        'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=800',
      ],
      status: 'ACTIVE',
    },
    {
      farmer_id: farmer2.id,
      name: 'Organic Turmeric & Cotton — Jalna',
      description: 'Certified organic farm with excellent soil quality. Turmeric and cotton have strong market demand. Sprinkler irrigation ensures consistent yields.',
      area_acres: 4,
      price_per_acre: 55000,
      crops: ['Turmeric', 'Cotton'],
      location_name: 'Bhokardan, Jalna, MH',
      latitude: 19.8347,
      longitude: 75.8816,
      soil_type: 'Red Laterite',
      irrigation_type: 'Sprinkler',
      is_organic: true,
      expected_harvest_month: 'January',
      expected_yield_per_acre: 5,
      images: [
        'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=800',
      ],
      status: 'ACTIVE',
    },
    {
      farmer_id: farmer2.id,
      name: 'Soybean Farm — Jalna',
      description: 'Prime soybean growing region with favorable climate. Well-maintained farm with modern equipment.',
      area_acres: 6,
      price_per_acre: 30000,
      crops: ['Soybean'],
      location_name: 'Jalna, MH',
      latitude: 19.84,
      longitude: 75.88,
      soil_type: 'Red Laterite',
      irrigation_type: 'Rainfed',
      is_organic: false,
      expected_harvest_month: 'November',
      expected_yield_per_acre: 4,
      images: [],
      status: 'ACTIVE',
    },
    {
      farmer_id: farmer3.id,
      name: 'Golden Wheat Fields — Amritsar',
      description: 'Large scale commercial wheat production in the heart of Punjab. Fully mechanized farming with high-yield seeds.',
      area_acres: 20,
      price_per_acre: 40000,
      crops: ['Wheat'],
      location_name: 'Ramgarh, Amritsar, PB',
      latitude: 31.63,
      longitude: 74.87,
      soil_type: 'Alluvial',
      irrigation_type: 'Canal',
      is_organic: false,
      expected_harvest_month: 'April',
      expected_yield_per_acre: 12,
      images: [
        'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800',
      ],
      status: 'ACTIVE',
    },
    {
      farmer_id: farmer4.id,
      name: 'Guntur Red Chilli Plantation',
      description: 'The world famous Guntur Chillies. Spicy and high in demand for export. Excellent returns expected.',
      area_acres: 10,
      price_per_acre: 65000,
      crops: ['Chilli'],
      location_name: 'Guntur, AP',
      latitude: 16.3,
      longitude: 80.43,
      soil_type: 'Red Sandy',
      irrigation_type: 'Rainfed',
      is_organic: true,
      expected_harvest_month: 'May',
      expected_yield_per_acre: 3,
      images: [
        'https://images.unsplash.com/photo-1588252303782-cb80119f704c?w=800',
      ],
      status: 'ACTIVE',
    },
  ];

  const createdListings = [];
  for (const l of listings) {
    const listing = await prisma.farmListing.create({ data: l });
    createdListings.push(listing);
  }

  // 3. CREATE CONTRACTS
  console.log('   Creating contracts...');

  // Active Contract: Vikram on Rajesh's Tomato Farm
  const contract1 = await prisma.contract.create({
    data: {
      listing_id: createdListings[0].id,
      farmer_id: farmer1.id,
      consumer_id: investor1.id,
      crop: 'Tomato',
      acreage: 3,
      price_per_acre: 45000,
      total_amount: 135000,
      start_date: new Date('2024-01-15'),
      end_date: new Date('2024-06-15'),
      status: 'ACTIVE',
      escrow_held: 67500,
      farmer_paid: 20000,
    },
  });

  // Completed Contract: Ananya on Arjun's Wheat
  const contract2 = await prisma.contract.create({
    data: {
      listing_id: createdListings[4].id,
      farmer_id: farmer3.id,
      consumer_id: investor2.id,
      crop: 'Wheat',
      acreage: 10,
      price_per_acre: 40000,
      total_amount: 400000,
      start_date: new Date('2023-10-01'),
      end_date: new Date('2024-04-01'),
      status: 'COMPLETED',
      escrow_held: 0,
      farmer_paid: 400000,
    },
  });

  // Pending Contract: Vikram on Sunita's Turmeric
  const contract3 = await prisma.contract.create({
    data: {
      listing_id: createdListings[2].id,
      farmer_id: farmer2.id,
      consumer_id: investor1.id,
      crop: 'Turmeric',
      acreage: 2,
      price_per_acre: 55000,
      total_amount: 110000,
      start_date: new Date('2024-05-01'),
      end_date: new Date('2024-12-01'),
      status: 'PENDING',
      escrow_held: 0,
      farmer_paid: 0,
    },
  });

  // 4. CREATE ESCROW ENTRIES
  console.log('   Creating escrow records...');

  await prisma.escrowLedger.createMany({
    data: [
      {
        contract_id: contract1.id,
        user_id: investor1.id,
        event: 'DEPOSIT',
        amount: 67500,
        transaction_type: 'CREDIT',
        description: 'Initial escrow deposit (50%)',
      },
      {
        contract_id: contract1.id,
        user_id: farmer1.id,
        event: 'WAGE_RELEASE',
        amount: 20000,
        transaction_type: 'DEBIT',
        description: 'Monthly wage release — January',
      },
      {
        contract_id: contract2.id,
        user_id: investor2.id,
        event: 'DEPOSIT',
        amount: 400000,
        transaction_type: 'CREDIT',
        description: 'Full contract payment',
      },
      {
        contract_id: contract2.id,
        user_id: farmer3.id,
        event: 'FINAL_SETTLEMENT',
        amount: 400000,
        transaction_type: 'DEBIT',
        description: 'Final payout upon completion',
      },
    ],
  });

  // 5. CREATE UPDATES & DELIVERIES
  console.log('   Creating farm updates and deliveries...');

  await prisma.farmUpdate.createMany({
    data: [
      {
        contract_id: contract1.id,
        farmer_id: farmer1.id,
        media_url: 'https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?w=800',
        media_type: 'image',
        caption: 'Tomato seedlings planted in rows 1-18. Drip irrigation activated.',
        latitude: 19.9975,
        longitude: 73.7898,
      },
      {
        contract_id: contract1.id,
        farmer_id: farmer1.id,
        media_url: 'https://images.unsplash.com/photo-1592921870789-04563d55041c?w=800',
        media_type: 'image',
        caption: 'Excellent growth after 3 weeks. Soil moisture optimal.',
        latitude: 19.9975,
        longitude: 73.7898,
      },
      {
        contract_id: contract2.id,
        farmer_id: farmer3.id,
        media_url: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800',
        media_type: 'image',
        caption: 'Harvesting in progress using combined harvester.',
        latitude: 31.63,
        longitude: 74.87,
      },
    ],
  });

  await prisma.delivery.createMany({
    data: [
      {
        contract_id: contract1.id,
        batch_number: 'BATCH-001',
        yield_amount_kg: 2500,
        quality_grade: 'A',
        delivery_date: new Date('2024-03-20'),
        status: 'VERIFIED',
      },
      {
        contract_id: contract1.id,
        batch_number: 'BATCH-002',
        yield_amount_kg: 1800,
        quality_grade: 'A',
        delivery_date: new Date('2024-04-10'),
        status: 'IN_TRANSIT',
      },
      {
        contract_id: contract2.id,
        batch_number: 'BATCH-GOLD-01',
        yield_amount_kg: 45000,
        quality_grade: 'Premium',
        delivery_date: new Date('2024-03-25'),
        status: 'VERIFIED',
      },
    ],
  });

  // 6. CREATE REVIEWS
  console.log('   Creating reviews...');

  await prisma.review.create({
    data: {
      contract_id: contract2.id,
      reviewer_id: investor2.id,
      rating: 5,
      comment: 'Arjun is an incredible farmer. The wheat quality is exceptional and he kept me updated throughout the cycle. High recommended!',
    },
  });

  // 7. WALLET TRANSACTIONS
  console.log('   Creating wallet transactions...');

  await prisma.walletTransaction.createMany({
    data: [
      { user_id: farmer1.id, type: 'CREDIT', amount: 20000, description: 'Wage release — January', status: 'SUCCESS', balance_after: 20000 },
      { user_id: farmer3.id, type: 'CREDIT', amount: 400000, description: 'Settlement: Wheat Harvest', status: 'SUCCESS', balance_after: 400000 },
      { user_id: investor1.id, type: 'DEBIT', amount: 67500, description: 'Escrow: Tomato Farm', status: 'SUCCESS', balance_after: 32500 },
    ],
  });

  // 8. NOTIFICATIONS & CONVERSATIONS
  console.log('   Creating communications...');

  await prisma.notification.createMany({
    data: [
      { user_id: farmer1.id, type: 'CONTRACT_ACCEPTED', title: 'Contract Accepted', message: 'Tomato Farm contract active.' },
      { user_id: investor1.id, type: 'FARM_UPDATE', title: 'New Update', message: 'Rajesh posted a new update.' },
      { user_id: investor2.id, type: 'GENERAL', title: 'Settlement Complete', message: 'Payout sent to Arjun Singh.' },
    ],
  });

  const conv = await prisma.conversation.create({
    data: {
      participant_one_id: farmer1.id,
      participant_two_id: investor1.id,
      contract_id: contract1.id,
      last_message: 'How is the soil moisture today?',
      last_message_at: new Date(),
    },
  });

  await prisma.message.createMany({
    data: [
      { conversation_id: conv.id, sender_id: investor1.id, text: 'Hi Rajesh, looks like it rained. Is the farm okay?' },
      { conversation_id: conv.id, sender_id: farmer1.id, text: 'Yes Vikram, the drainage is good. Soil moisture is perfect actually.' },
    ],
  });

  console.log('✅ Seed complete! Application is ready for full testing.');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
