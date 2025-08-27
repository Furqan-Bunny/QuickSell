#!/usr/bin/env node
require('dotenv').config();
const { sendEmail, sendTemplatedEmail } = require('../utils/brevoEmail');

const testEmail = async () => {
  console.log('🚀 Testing Brevo Email Integration...\n');

  // Check configuration
  if (!process.env.BREVO_API_KEY) {
    console.error('❌ BREVO_API_KEY is not configured in .env file');
    console.log('Please add your Brevo API key to the .env file:');
    console.log('BREVO_API_KEY=your_api_key_here\n');
    process.exit(1);
  }

  const testRecipient = process.argv[2] || process.env.TEST_EMAIL;
  
  if (!testRecipient) {
    console.error('❌ Please provide a test email address');
    console.log('Usage: npm run test:email your-email@example.com');
    console.log('Or set TEST_EMAIL in your .env file\n');
    process.exit(1);
  }

  console.log(`📧 Sending test emails to: ${testRecipient}\n`);

  try {
    // Test 1: Basic email
    console.log('1. Testing basic email...');
    await sendEmail({
      to: testRecipient,
      subject: '🧪 Quicksell Email Test',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Test Email from Quicksell</h2>
          <p>If you're receiving this email, your Brevo integration is working correctly!</p>
          <p style="color: #667eea; font-weight: bold;">✅ Email delivery successful</p>
          <p style="color: #718096; font-size: 12px;">This is a test email from the Quicksell platform.</p>
        </div>
      `,
      tags: ['test']
    });
    console.log('✅ Basic email sent successfully\n');

    // Test 2: Invitation template
    console.log('2. Testing invitation template...');
    await sendTemplatedEmail('invitation', {
      to: testRecipient,
      name: 'Test User',
      inviterName: 'John Doe',
      inviteeName: 'Test Recipient',
      inviteLink: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/signup?ref=TEST123`,
      replyTo: 'support@quicksell.co.za'
    });
    console.log('✅ Invitation email sent successfully\n');

    // Test 3: Referral success template
    console.log('3. Testing referral success template...');
    await sendTemplatedEmail('referralSuccess', {
      to: testRecipient,
      name: 'Test User',
      inviteeEmail: 'newuser@example.com',
      dashboardLink: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard`,
      affiliateLink: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/affiliate`
    });
    console.log('✅ Referral success email sent successfully\n');

    // Test 4: Email verification template
    console.log('4. Testing email verification template...');
    await sendTemplatedEmail('verifyEmail', {
      to: testRecipient,
      name: 'Test User',
      firstName: 'Test',
      verificationUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=TEST_TOKEN_123`
    });
    console.log('✅ Verification email sent successfully\n');

    console.log('🎉 All email tests passed successfully!');
    console.log('\n📊 Summary:');
    console.log('- Basic email: ✅');
    console.log('- Invitation template: ✅');
    console.log('- Referral success template: ✅');
    console.log('- Email verification template: ✅');
    console.log('\n💡 Check your inbox to verify the emails were received correctly.');
    
    // Configuration info
    console.log('\n📋 Configuration:');
    console.log(`- API Key: ${process.env.BREVO_API_KEY ? '***' + process.env.BREVO_API_KEY.slice(-4) : 'Not set'}`);
    console.log(`- Sender Email: ${process.env.BREVO_SENDER_EMAIL || 'Using default'}`);
    console.log(`- Sender Name: ${process.env.BREVO_SENDER_NAME || 'Using default'}`);
    console.log(`- Fallback SMTP: ${process.env.SMTP_HOST ? 'Configured' : 'Not configured'}`);

  } catch (error) {
    console.error('\n❌ Email test failed:', error.message);
    
    if (error.response) {
      console.error('API Response:', error.response.data);
    }
    
    console.log('\n🔍 Troubleshooting tips:');
    console.log('1. Check your BREVO_API_KEY in .env file');
    console.log('2. Verify your sender email is configured in Brevo dashboard');
    console.log('3. Make sure your Brevo account is activated');
    console.log('4. Check the Brevo dashboard for any account issues');
    console.log('5. Review the error message above for specific details');
    
    process.exit(1);
  }
};

// Run test
console.log('═══════════════════════════════════════');
console.log('  Quicksell Email Service Test Suite');
console.log('═══════════════════════════════════════\n');

testEmail().then(() => {
  console.log('\n═══════════════════════════════════════\n');
  process.exit(0);
}).catch((error) => {
  console.error('Unexpected error:', error);
  process.exit(1);
});