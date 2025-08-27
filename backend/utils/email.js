const sgMail = require('@sendgrid/mail');
const nodemailer = require('nodemailer');

// Initialize SendGrid if API key is available
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

// Fallback to nodemailer for development
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

const sendEmail = async (emailData) => {
  try {
    // Try SendGrid first if configured
    if (process.env.SENDGRID_API_KEY) {
      const msg = {
        to: emailData.to,
        from: process.env.SENDGRID_FROM_EMAIL || 'noreply@quicksell.co.za',
        subject: emailData.subject,
        html: emailData.html
      };
      
      await sgMail.send(msg);
      console.log('Email sent via SendGrid');
      return true;
    }
    
    // Fallback to nodemailer
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      const mailOptions = {
        from: process.env.SMTP_FROM || 'Quicksell <noreply@quicksell.co.za>',
        to: emailData.to,
        subject: emailData.subject,
        html: emailData.html
      };
      
      await transporter.sendMail(mailOptions);
      console.log('Email sent via SMTP');
      return true;
    }
    
    // Development mode - just log the email
    console.log('Email (dev mode):', {
      to: emailData.to,
      subject: emailData.subject,
      preview: emailData.html.substring(0, 200) + '...'
    });
    return true;
    
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

module.exports = sendEmail;