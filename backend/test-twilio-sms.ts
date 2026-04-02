/**
 * Twilio SMS Test Script for FarmConnect
 * 
 * This script tests if Twilio SMS is configured correctly
 * Run: npx tsx test-twilio-sms.ts
 */

import twilio from 'twilio';
import dotenv from 'dotenv';

dotenv.config();

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;

console.log('🔍 Twilio Configuration Check\n');
console.log('Account SID:', TWILIO_ACCOUNT_SID ? '✅ Configured' : '❌ Missing');
console.log('Auth Token:', TWILIO_AUTH_TOKEN ? '✅ Configured' : '❌ Missing');
console.log('Phone Number:', TWILIO_PHONE_NUMBER ? '✅ Configured' : '❌ Missing');

if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
  console.error('\n❌ Twilio credentials are incomplete. Please check your .env file.');
  process.exit(1);
}

const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

async function testTwilioConnection() {
  try {
    console.log('\n📞 Testing Twilio account connection...');
    
    // Test account info
    const account = await client.api.accounts(TWILIO_ACCOUNT_SID).fetch();
    console.log('✅ Twilio account connected:', account.friendlyName);
    console.log('   Status:', account.status);
    console.log('   Type:', account.type);
    
    return true;
  } catch (error) {
    console.error('❌ Twilio connection failed:', error instanceof Error ? error.message : error);
    return false;
  }
}

async function testSendSMS(testPhone: string) {
  const testOtp = Math.floor(100000 + Math.random() * 900000).toString();
  
  try {
    console.log(`\n📱 Sending test SMS to ${testPhone}...`);
    
    const message = await client.messages.create({
      body: `FarmConnect Test: Your verification code is ${testOtp}. This is a test message.`,
      from: TWILIO_PHONE_NUMBER,
      to: testPhone,
    });
    
    console.log('✅ SMS sent successfully!');
    console.log('   Message SID:', message.sid);
    console.log('   Status:', message.status);
    console.log('   Date Created:', message.dateCreated);
    console.log('   Test OTP:', testOtp);
    
    return true;
  } catch (error) {
    console.error('❌ SMS sending failed:', error instanceof Error ? error.message : error);
    
    // Common error handling
    if (error instanceof Error) {
      if (error.message.includes('Authentication')) {
        console.error('\n💡 Authentication Error: Check your Account SID and Auth Token');
      } else if (error.message.includes('not a verified number')) {
        console.error('\n💡 Trial Account Limitation:');
        console.error('   Twilio trial accounts can only send SMS to verified numbers.');
        console.error('   Verify your number at: https://console.twilio.com/us1/develop/phone-numbers/verified');
      } else if (error.message.includes('from phone number')) {
        console.error('\n💡 Phone Number Error: Check your Twilio phone number format');
      }
    }
    
    return false;
  }
}

async function checkAccountBalance() {
  try {
    console.log('\n💰 Checking account balance...');
    const balance = await client.api.account.balance.fetch();
    console.log('   Balance:', balance.balance, balance.currency);
    return balance;
  } catch (error) {
    console.error('   ⚠️ Could not fetch balance:', error instanceof Error ? error.message : 'Unknown error');
    return null;
  }
}

async function runTests() {
  console.log('\n' + '='.repeat(50));
  console.log('🧪 TWILIO SMS TEST SUITE');
  console.log('='.repeat(50));
  
  // Test 1: Connection
  const connectionOk = await testTwilioConnection();
  if (!connectionOk) {
    console.error('\n❌ Twilio connection failed. Cannot proceed with SMS tests.');
    process.exit(1);
  }
  
  // Test 2: Balance
  await checkAccountBalance();
  
  // Test 3: Send SMS
  console.log('\n' + '='.repeat(50));
  console.log('📱 SMS TEST');
  console.log('='.repeat(50));
  
  // Ask for test phone number
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  
  const testPhone = await new Promise<string>((resolve) => {
    readline.question(
      '\nEnter phone number to receive test SMS (e.g., +919876543210): ',
      (answer: string) => {
        resolve(answer.trim());
        readline.close();
      }
    );
  });
  
  // Validate phone format
  const phoneRegex = /^\+91[6-9]\d{9}$/;
  if (!phoneRegex.test(testPhone)) {
    console.error('\n❌ Invalid phone format. Use Indian format: +91XXXXXXXXXX');
    process.exit(1);
  }
  
  const smsOk = await testSendSMS(testPhone);
  
  // Final Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(50));
  console.log('Connection Test:', connectionOk ? '✅ PASSED' : '❌ FAILED');
  console.log('SMS Test:', smsOk ? '✅ PASSED' : '❌ FAILED');
  console.log('='.repeat(50));
  
  if (connectionOk && smsOk) {
    console.log('\n🎉 All tests passed! Twilio SMS is ready for production.');
    console.log('\n💡 Next steps:');
    console.log('   1. Start your backend: npm run dev');
    console.log('   2. Test OTP login from the mobile app');
    console.log('   3. Users will receive real SMS with OTP codes');
  } else {
    console.log('\n⚠️ Some tests failed. Check the errors above.');
    console.log('\n💡 Troubleshooting:');
    console.log('   - Verify Twilio credentials in .env');
    console.log('   - For trial accounts, verify recipient numbers first');
    console.log('   - Check account balance');
    console.log('   - Ensure phone numbers are in E.164 format (+91...)');
  }
  
  process.exit(connectionOk && smsOk ? 0 : 1);
}

// Run tests
runTests().catch(console.error);
