const brevo = require('@getbrevo/brevo');
const nodemailer = require('nodemailer');

// Initialize Brevo API instance
const apiInstance = new brevo.TransactionalEmailsApi();

// Set API key from environment variable
if (process.env.BREVO_API_KEY) {
  apiInstance.setApiKey(
    brevo.TransactionalEmailsApiApiKeys.apiKey,
    process.env.BREVO_API_KEY
  );
}

// Email templates
const emailTemplates = {
  invitation: (data) => ({
    subject: `${data.inviterName} invited you to join Quicksell`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
            border-radius: 10px 10px 0 0;
          }
          .content {
            background: #ffffff;
            padding: 30px;
            border: 1px solid #e5e7eb;
            border-radius: 0 0 10px 10px;
          }
          .button {
            display: inline-block;
            padding: 14px 28px;
            background: #667eea;
            color: white;
            text-decoration: none;
            border-radius: 6px;
            font-weight: bold;
            margin: 20px 0;
          }
          .button:hover {
            background: #5a67d8;
          }
          .reward-box {
            background: #f0f9ff;
            border: 2px solid #667eea;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            text-align: center;
          }
          .footer {
            text-align: center;
            color: #6b7280;
            font-size: 12px;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🎉 You're Invited to Quicksell!</h1>
        </div>
        <div class="content">
          <p>Hi ${data.inviteeName || 'there'},</p>
          
          <p><strong>${data.inviterName}</strong> has invited you to join Quicksell, South Africa's premier online auction marketplace.</p>
          
          <div class="reward-box">
            <h3>🎁 Special Offer</h3>
            <p>When you sign up using this invitation, ${data.inviterName} will receive <strong>R5</strong> as a thank you bonus!</p>
          </div>
          
          <center>
            <a href="${data.inviteLink}" class="button">Accept Invitation</a>
          </center>
          
          <h3>Why Join Quicksell?</h3>
          <ul>
            <li>🏆 Bid on exclusive items and great deals</li>
            <li>💰 Sell your items to thousands of buyers</li>
            <li>🔒 Secure transactions and buyer protection</li>
            <li>📱 Easy to use on web and mobile</li>
            <li>🚚 Nationwide delivery options</li>
          </ul>
          
          <p>This invitation expires in <strong>30 days</strong>, so don't wait!</p>
          
          <div class="footer">
            <p>If you didn't expect this email, you can safely ignore it.</p>
            <p>© 2024 Quicksell. All rights reserved.</p>
            <p>Cape Town, South Africa</p>
          </div>
        </div>
      </body>
      </html>
    `
  }),
  
  referralSuccess: (data) => ({
    subject: '🎉 You earned R5 from your Quicksell referral!',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white;
            padding: 30px;
            text-align: center;
            border-radius: 10px 10px 0 0;
          }
          .content {
            background: #ffffff;
            padding: 30px;
            border: 1px solid #e5e7eb;
            border-radius: 0 0 10px 10px;
          }
          .success-box {
            background: #f0fdf4;
            border: 2px solid #10b981;
            padding: 25px;
            border-radius: 8px;
            margin: 20px 0;
            text-align: center;
          }
          .button {
            display: inline-block;
            padding: 14px 28px;
            background: #667eea;
            color: white;
            text-decoration: none;
            border-radius: 6px;
            font-weight: bold;
            margin: 20px 0;
          }
          .footer {
            text-align: center;
            color: #6b7280;
            font-size: 12px;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>💰 Congratulations!</h1>
          <p>You've earned a referral reward</p>
        </div>
        <div class="content">
          <p>Great news!</p>
          
          <p><strong>${data.inviteeEmail}</strong> has accepted your invitation and joined Quicksell.</p>
          
          <div class="success-box">
            <h2>R5 Added to Your Balance!</h2>
            <p>Your referral reward has been credited to your account.</p>
            <p style="font-size: 24px; color: #10b981; font-weight: bold;">+R5.00</p>
          </div>
          
          <center>
            <a href="${data.dashboardLink}" class="button">View Your Balance</a>
          </center>
          
          <h3>Keep Earning!</h3>
          <p>There's no limit to how much you can earn. Keep inviting friends and earn R5 for each successful referral!</p>
          
          <center>
            <a href="${data.affiliateLink}" class="button" style="background: #10b981;">Invite More Friends</a>
          </center>
          
          <div class="footer">
            <p>Thank you for growing the Quicksell community!</p>
            <p>© 2024 Quicksell. All rights reserved.</p>
            <p>Cape Town, South Africa</p>
          </div>
        </div>
      </body>
      </html>
    `
  }),
  
  verifyEmail: (data) => ({
    subject: 'Verify your Quicksell account',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
            border-radius: 10px 10px 0 0;
          }
          .content {
            background: #ffffff;
            padding: 30px;
            border: 1px solid #e5e7eb;
            border-radius: 0 0 10px 10px;
          }
          .button {
            display: inline-block;
            padding: 14px 28px;
            background: #667eea;
            color: white;
            text-decoration: none;
            border-radius: 6px;
            font-weight: bold;
            margin: 20px 0;
          }
          .footer {
            text-align: center;
            color: #6b7280;
            font-size: 12px;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Welcome to Quicksell!</h1>
          <p>Please verify your email address</p>
        </div>
        <div class="content">
          <p>Hi ${data.firstName},</p>
          
          <p>Thanks for creating an account with Quicksell. To complete your registration, please verify your email address by clicking the button below:</p>
          
          <center>
            <a href="${data.verificationUrl}" class="button">Verify Email Address</a>
          </center>
          
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #667eea;">${data.verificationUrl}</p>
          
          <p>This link will expire in 24 hours for security reasons.</p>
          
          <div class="footer">
            <p>If you didn't create an account with Quicksell, you can safely ignore this email.</p>
            <p>© 2024 Quicksell. All rights reserved.</p>
            <p>Cape Town, South Africa</p>
          </div>
        </div>
      </body>
      </html>
    `
  })
};

// Send email using Brevo
const sendEmailWithBrevo = async (emailData) => {
  try {
    const sendSmtpEmail = new brevo.SendSmtpEmail();
    
    sendSmtpEmail.sender = {
      name: process.env.BREVO_SENDER_NAME || 'Quicksell',
      email: process.env.BREVO_SENDER_EMAIL || 'furqansaify61@gmail.com'
    };
    
    sendSmtpEmail.to = [
      {
        email: emailData.to,
        name: emailData.name || emailData.to
      }
    ];
    
    sendSmtpEmail.subject = emailData.subject;
    sendSmtpEmail.htmlContent = emailData.html;
    
    // Optional: Add reply-to
    if (emailData.replyTo) {
      sendSmtpEmail.replyTo = {
        email: emailData.replyTo
      };
    }
    
    // Optional: Add tags for tracking
    if (emailData.tags) {
      sendSmtpEmail.tags = emailData.tags;
    }
    
    const result = await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log('Email sent via Brevo:', result.messageId);
    return result;
  } catch (error) {
    console.error('Brevo email error:', error);
    throw error;
  }
};

// Use Brevo SMTP or fallback to other SMTP
const sendEmailWithSMTP = async (emailData) => {
  // Prefer Brevo SMTP if configured
  const isBrevoSMTP = process.env.BREVO_SMTP_LOGIN && process.env.BREVO_SMTP_PASSWORD;
  
  const transporter = nodemailer.createTransport({
    host: isBrevoSMTP ? 'smtp-relay.brevo.com' : (process.env.SMTP_HOST || 'smtp.gmail.com'),
    port: isBrevoSMTP ? 587 : (process.env.SMTP_PORT || 587),
    secure: false,
    auth: {
      user: isBrevoSMTP ? process.env.BREVO_SMTP_LOGIN : process.env.SMTP_USER,
      pass: isBrevoSMTP ? process.env.BREVO_SMTP_PASSWORD : process.env.SMTP_PASS
    }
  });
  
  const mailOptions = {
    from: `${process.env.BREVO_SENDER_NAME || 'Minzolor'} <${process.env.BREVO_SENDER_EMAIL || 'furqansaify61@gmail.com'}>`,
    to: emailData.to,
    subject: emailData.subject,
    html: emailData.html,
    headers: {
      'X-Sender': process.env.BREVO_SENDER_EMAIL || 'furqansaify61@gmail.com',
      'X-Mailer': 'Quicksell Platform',
      'List-Unsubscribe': `<mailto:${process.env.BREVO_SENDER_EMAIL || 'furqansaify61@gmail.com'}?subject=unsubscribe>`
    }
  };
  
  const result = await transporter.sendMail(mailOptions);
  const smtpType = (process.env.BREVO_SMTP_LOGIN && process.env.BREVO_SMTP_PASSWORD) ? 'Brevo SMTP' : 'SMTP';
  console.log(`Email sent via ${smtpType}:`, result.messageId);
  return result;
};

// Main send email function
const sendEmail = async (emailData) => {
  try {
    // Try Brevo first if API key is configured
    if (process.env.BREVO_API_KEY) {
      return await sendEmailWithBrevo(emailData);
    }
    
    // Fallback to SMTP (Brevo SMTP or regular SMTP)
    if ((process.env.BREVO_SMTP_LOGIN && process.env.BREVO_SMTP_PASSWORD) || 
        (process.env.SMTP_USER && process.env.SMTP_PASS)) {
      return await sendEmailWithSMTP(emailData);
    }
    
    // Development mode - just log the email
    console.log('Email (dev mode):', {
      to: emailData.to,
      subject: emailData.subject,
      preview: emailData.html ? emailData.html.substring(0, 200) + '...' : 'No content'
    });
    return { messageId: 'dev-mode-' + Date.now() };
    
  } catch (error) {
    console.error('Error sending email:', error);
    
    // Try fallback if Brevo API fails
    if (process.env.BREVO_API_KEY && 
        ((process.env.BREVO_SMTP_LOGIN && process.env.BREVO_SMTP_PASSWORD) || 
         (process.env.SMTP_USER && process.env.SMTP_PASS))) {
      console.log('Trying fallback email service...');
      try {
        return await sendEmailWithSMTP(emailData);
      } catch (fallbackError) {
        console.error('Fallback email also failed:', fallbackError);
        throw fallbackError;
      }
    }
    
    throw error;
  }
};

// Send templated email
const sendTemplatedEmail = async (template, data) => {
  if (!emailTemplates[template]) {
    throw new Error(`Email template '${template}' not found`);
  }
  
  const emailContent = emailTemplates[template](data);
  
  return sendEmail({
    to: data.to,
    name: data.name,
    subject: emailContent.subject,
    html: emailContent.html,
    tags: [template],
    replyTo: data.replyTo
  });
};

module.exports = {
  sendEmail,
  sendTemplatedEmail,
  emailTemplates
};