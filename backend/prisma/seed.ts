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

  // Create admin
  const admin = await prisma.user.create({
    data: {
      phone: '+910000000000',
      name: 'System Admin',
      email: 'admin@farmconnect.com',
      role: 'ADMIN',
      kyc_status: 'VERIFIED',
    },
  });

  // Create farmer
  const farmer = await prisma.user.create({
    data: {
      phone: '+919876543210',
      name: 'Rajesh Kumar',
      email: 'rajesh@example.com',
      role: 'FARMER',
      kyc_status: 'VERIFIED',
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

  // Create investor (consumer)
  const investor = await prisma.user.create({
    data: {
      phone: '+919876543211',
      name: 'Vikram Mehta',
      email: 'vikram@example.com',
      role: 'CONSUMER',
      kyc_status: 'VERIFIED',
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

  // Create second farmer
  const farmer2 = await prisma.user.create({
    data: {
      phone: '+919876543212',
      name: 'Sunita Patil',
      email: 'sunita@example.com',
      role: 'FARMER',
      kyc_status: 'VERIFIED',
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

  // Create listings
  const listing1 = await prisma.farmListing.create({
    data: {
      farmer_id: farmer.id,
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
  });

  const listing2 = await prisma.farmListing.create({
    data: {
      farmer_id: farmer.id,
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
  });

  const listing3 = await prisma.farmListing.create({
    data: {
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
  });

  const listing4 = await prisma.farmListing.create({
    data: {
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
  });

  // Create a contract (investor investing in farmer's listing)
  const contract = await prisma.contract.create({
    data: {
      listing_id: listing1.id,
      farmer_id: farmer.id,
      consumer_id: investor.id,
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

  // Create escrow entries
  await prisma.escrowLedger.create({
    data: {
      contract_id: contract.id,
      user_id: investor.id,
      event: 'DEPOSIT',
      amount: 67500,
      transaction_type: 'CREDIT',
      description: 'Initial escrow deposit (50%)',
    },
  });

  await prisma.escrowLedger.create({
    data: {
      contract_id: contract.id,
      user_id: farmer.id,
      event: 'WAGE_RELEASE',
      amount: 20000,
      transaction_type: 'DEBIT',
      description: 'Monthly wage release — January',
    },
  });

  // Create farm updates
  await prisma.farmUpdate.create({
    data: {
      contract_id: contract.id,
      farmer_id: farmer.id,
      media_url: 'https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?w=800',
      media_type: 'image',
      caption: 'Tomato seedlings planted in rows 1-18. Drip irrigation activated.',
      latitude: 19.9975,
      longitude: 73.7898,
    },
  });

  await prisma.farmUpdate.create({
    data: {
      contract_id: contract.id,
      farmer_id: farmer.id,
      media_url: 'https://images.unsplash.com/photo-1592921870789-04563d55041c?w=800',
      media_type: 'image',
      caption: 'Excellent growth after 3 weeks. No pest activity detected. Soil moisture at optimal levels.',
      latitude: 19.9975,
      longitude: 73.7898,
    },
  });

  // Create deliveries
  await prisma.delivery.create({
    data: {
      contract_id: contract.id,
      batch_number: 'BATCH-001',
      yield_amount_kg: 2500,
      quality_grade: 'A',
      delivery_date: new Date('2024-03-20'),
      status: 'VERIFIED',
    },
  });

  await prisma.delivery.create({
    data: {
      contract_id: contract.id,
      batch_number: 'BATCH-002',
      yield_amount_kg: 1800,
      quality_grade: 'A',
      delivery_date: new Date('2024-04-10'),
      status: 'IN_TRANSIT',
    },
  });

  // Create wallet transactions for farmer
  await prisma.walletTransaction.create({
    data: {
      user_id: farmer.id,
      type: 'CREDIT',
      amount: 20000,
      description: 'Wage release — January',
      balance_after: 20000,
      status: 'SUCCESS',
    },
  });

  await prisma.walletTransaction.create({
    data: {
      user_id: farmer.id,
      type: 'CREDIT',
      amount: 15000,
      description: 'Advance payment — February',
      balance_after: 35000,
      status: 'PENDING',
    },
  });

  // Create notifications
  await prisma.notification.create({
    data: {
      user_id: farmer.id,
      type: 'CONTRACT_ACCEPTED',
      title: 'Contract Accepted',
      message: 'Your contract for Tomato Farm with Vikram Mehta is now active.',
      data: { contract_id: contract.id },
    },
  });

  await prisma.notification.create({
    data: {
      user_id: investor.id,
      type: 'PAYMENT_RECEIVED',
      title: 'Escrow Deposit Confirmed',
      message: '₹67,500 deposited into escrow for Tomato Farm contract.',
      data: { contract_id: contract.id },
    },
  });

  await prisma.notification.create({
    data: {
      user_id: investor.id,
      type: 'FARM_UPDATE',
      title: 'New Farm Update',
      message: 'Rajesh Kumar posted a new update for your Tomato Farm contract.',
      read: true,
      data: { contract_id: contract.id },
    },
  });

  // Create a conversation
  const conversation = await prisma.conversation.create({
    data: {
      participant_one_id: farmer.id,
      participant_two_id: investor.id,
      contract_id: contract.id,
      last_message: 'The tomatoes are looking great this week!',
      last_message_at: new Date(),
    },
  });

  await prisma.message.create({
    data: {
      conversation_id: conversation.id,
      sender_id: investor.id,
      text: 'Hi Rajesh, how are the tomatoes coming along?',
    },
  });

  await prisma.message.create({
    data: {
      conversation_id: conversation.id,
      sender_id: farmer.id,
      text: 'The tomatoes are looking great this week!',
      read: true,
    },
  });

  // Create audit log
  await prisma.auditLog.create({
    data: {
      admin_id: admin.id,
      action: 'USER_VERIFIED',
      entity_type: 'USER',
      entity_id: farmer.id,
      details: { role: 'FARMER', kyc_status: 'VERIFIED' },
    },
  });

  console.log('✅ Seed complete!');
  console.log(`   Farmer: ${farmer.phone} (${farmer.name})`);
  console.log(`   Investor: ${investor.phone} (${investor.name})`);
  console.log(`   Farmer2: ${farmer2.phone} (${farmer2.name})`);
  console.log(`   Listings: ${listing1.id}, ${listing2.id}, ${listing3.id}, ${listing4.id}`);
  console.log(`   Contract: ${contract.id}`);
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
