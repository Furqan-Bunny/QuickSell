const nodemailer = require('nodemailer');
const admin = require('firebase-admin');

const db = admin.firestore();

class EmailService {
  constructor() {
    // Initialize nodemailer transporter with Brevo (SendinBlue)
    this.transporter = nodemailer.createTransport({
      host: 'smtp-relay.brevo.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.BREVO_SMTP_LOGIN,
        pass: process.env.BREVO_SMTP_PASSWORD
      }
    });

    this.senderEmail = process.env.BREVO_SENDER_EMAIL || 'noreply@quicksell.com';
    this.senderName = process.env.BREVO_SENDER_NAME || 'Quicksell Auctions';
  }

  // Send welcome email
  async sendWelcomeEmail(user) {
    try {
      const mailOptions = {
        from: `${this.senderName} <${this.senderEmail}>`,
        to: user.email,
        subject: 'Welcome to Quicksell Auctions!',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0;">Welcome to Quicksell!</h1>
            </div>
            <div style="padding: 30px; background: #f7f7f7;">
              <h2>Hi ${user.firstName || 'there'}!</h2>
              <p>Thank you for joining Quicksell Auctions, South Africa's premier online auction platform.</p>
              
              <div style="background: white; padding: 20px; border-radius: 10px; margin: 20px 0;">
                <h3>🎯 Get Started:</h3>
                <ul style="list-style: none; padding: 0;">
                  <li>✅ Browse our featured auctions</li>
                  <li>✅ Place your first bid</li>
                  <li>✅ Add items to your wishlist</li>
                  <li>✅ Set up bid alerts</li>
                </ul>
              </div>
              
              <a href="${process.env.FRONTEND_URL || 'https://quicksell-80aad.web.app'}/products" 
                 style="display: inline-block; background: #667eea; color: white; padding: 15px 30px; 
                        text-decoration: none; border-radius: 5px; margin: 20px 0;">
                Start Bidding Now
              </a>
              
              <p style="color: #666; font-size: 14px;">
                If you have any questions, feel free to contact our support team.
              </p>
            </div>
            <div style="padding: 20px; background: #333; color: #999; text-align: center; font-size: 12px;">
              © 2024 Quicksell Auctions. All rights reserved.
            </div>
          </div>
        `
      };

      await this.transporter.sendMail(mailOptions);
      console.log('Welcome email sent to:', user.email);
      
      // Log email sent
      await this.logEmailSent('welcome', user.email, user.uid);
      
      return true;
    } catch (error) {
      console.error('Error sending welcome email:', error);
      return false;
    }
  }

  // Send bid confirmation email
  async sendBidConfirmation(user, bid, product) {
    try {
      const mailOptions = {
        from: `${this.senderName} <${this.senderEmail}>`,
        to: user.email,
        subject: `Bid Confirmed: ${product.title}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #28a745; padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0;">Bid Confirmed! 🎉</h1>
            </div>
            <div style="padding: 30px; background: #f7f7f7;">
              <h2>Your bid has been placed successfully!</h2>
              
              <div style="background: white; padding: 20px; border-radius: 10px; margin: 20px 0;">
                <h3>${product.title}</h3>
                <img src="${product.images?.[0] || ''}" alt="${product.title}" 
                     style="width: 100%; max-width: 300px; border-radius: 10px; margin: 10px 0;">
                
                <table style="width: 100%; margin: 20px 0;">
                  <tr>
                    <td style="padding: 10px; border-bottom: 1px solid #eee;">
                      <strong>Your Bid Amount:</strong>
                    </td>
                    <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">
                      <strong style="color: #28a745; font-size: 20px;">R${bid.amount}</strong>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 10px; border-bottom: 1px solid #eee;">
                      Auction Ends:
                    </td>
                    <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">
                      ${new Date(product.endDate).toLocaleString()}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 10px;">
                      Current Status:
                    </td>
                    <td style="padding: 10px; text-align: right;">
                      <span style="background: #28a745; color: white; padding: 5px 10px; border-radius: 5px;">
                        Highest Bidder
                      </span>
                    </td>
                  </tr>
                </table>
              </div>
              
              <p style="background: #fff3cd; padding: 15px; border-radius: 5px; border-left: 4px solid #ffc107;">
                <strong>⚠️ Important:</strong> Keep an eye on this auction! You'll be notified if someone outbids you.
              </p>
              
              <a href="${process.env.FRONTEND_URL || 'https://quicksell-80aad.web.app'}/products/${product.id}" 
                 style="display: inline-block; background: #667eea; color: white; padding: 15px 30px; 
                        text-decoration: none; border-radius: 5px; margin: 20px 0;">
                View Auction
              </a>
            </div>
            <div style="padding: 20px; background: #333; color: #999; text-align: center; font-size: 12px;">
              © 2024 Quicksell Auctions. All rights reserved.
            </div>
          </div>
        `
      };

      await this.transporter.sendMail(mailOptions);
      console.log('Bid confirmation sent to:', user.email);
      
      await this.logEmailSent('bid_confirmation', user.email, user.uid);
      
      return true;
    } catch (error) {
      console.error('Error sending bid confirmation:', error);
      return false;
    }
  }

  // Send outbid notification
  async sendOutbidNotification(user, product, newBidAmount) {
    try {
      const mailOptions = {
        from: `${this.senderName} <${this.senderEmail}>`,
        to: user.email,
        subject: `You've been outbid on: ${product.title}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #dc3545; padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0;">You've Been Outbid! ⚡</h1>
            </div>
            <div style="padding: 30px; background: #f7f7f7;">
              <h2>Someone just placed a higher bid!</h2>
              
              <div style="background: white; padding: 20px; border-radius: 10px; margin: 20px 0;">
                <h3>${product.title}</h3>
                
                <table style="width: 100%; margin: 20px 0;">
                  <tr>
                    <td style="padding: 10px; border-bottom: 1px solid #eee;">
                      New Highest Bid:
                    </td>
                    <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">
                      <strong style="color: #dc3545; font-size: 20px;">R${newBidAmount}</strong>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 10px;">
                      Time Remaining:
                    </td>
                    <td style="padding: 10px; text-align: right;">
                      ${this.getTimeRemaining(product.endDate)}
                    </td>
                  </tr>
                </table>
                
                <p style="text-align: center; margin: 20px 0;">
                  <strong>Don't let this one get away!</strong>
                </p>
              </div>
              
              <a href="${process.env.FRONTEND_URL || 'https://quicksell-80aad.web.app'}/products/${product.id}" 
                 style="display: inline-block; background: #dc3545; color: white; padding: 15px 30px; 
                        text-decoration: none; border-radius: 5px; margin: 20px auto; text-align: center;">
                Place a Higher Bid Now
              </a>
            </div>
            <div style="padding: 20px; background: #333; color: #999; text-align: center; font-size: 12px;">
              © 2024 Quicksell Auctions. All rights reserved.
            </div>
          </div>
        `
      };

      await this.transporter.sendMail(mailOptions);
      console.log('Outbid notification sent to:', user.email);
      
      await this.logEmailSent('outbid_notification', user.email, user.uid);
      
      return true;
    } catch (error) {
      console.error('Error sending outbid notification:', error);
      return false;
    }
  }

  // Send auction won notification
  async sendAuctionWonNotification(user, product, finalAmount) {
    try {
      const mailOptions = {
        from: `${this.senderName} <${this.senderEmail}>`,
        to: user.email,
        subject: `Congratulations! You won: ${product.title}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0;">🎉 Congratulations! You Won! 🎉</h1>
            </div>
            <div style="padding: 30px; background: #f7f7f7;">
              <h2>You've won the auction!</h2>
              
              <div style="background: white; padding: 20px; border-radius: 10px; margin: 20px 0;">
                <h3>${product.title}</h3>
                <img src="${product.images?.[0] || ''}" alt="${product.title}" 
                     style="width: 100%; max-width: 300px; border-radius: 10px; margin: 10px 0;">
                
                <table style="width: 100%; margin: 20px 0;">
                  <tr>
                    <td style="padding: 10px; border-bottom: 1px solid #eee;">
                      <strong>Winning Bid:</strong>
                    </td>
                    <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">
                      <strong style="color: #28a745; font-size: 24px;">R${finalAmount}</strong>
                    </td>
                  </tr>
                </table>
                
                <div style="background: #d4edda; padding: 15px; border-radius: 5px; margin: 20px 0;">
                  <h4 style="margin-top: 0;">Next Steps:</h4>
                  <ol>
                    <li>Complete payment within 48 hours</li>
                    <li>Arrange shipping or collection</li>
                    <li>Leave feedback for the seller</li>
                  </ol>
                </div>
              </div>
              
              <a href="${process.env.FRONTEND_URL || 'https://quicksell-80aad.web.app'}/checkout/${product.id}" 
                 style="display: inline-block; background: #28a745; color: white; padding: 15px 30px; 
                        text-decoration: none; border-radius: 5px; margin: 20px 0;">
                Complete Purchase
              </a>
            </div>
            <div style="padding: 20px; background: #333; color: #999; text-align: center; font-size: 12px;">
              © 2024 Quicksell Auctions. All rights reserved.
            </div>
          </div>
        `
      };

      await this.transporter.sendMail(mailOptions);
      console.log('Auction won notification sent to:', user.email);
      
      await this.logEmailSent('auction_won', user.email, user.uid);
      
      return true;
    } catch (error) {
      console.error('Error sending auction won notification:', error);
      return false;
    }
  }

  // Helper function to calculate time remaining
  getTimeRemaining(endDate) {
    const end = new Date(endDate).getTime();
    const now = new Date().getTime();
    const diff = end - now;

    if (diff <= 0) return 'Ended';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) return `${days} days, ${hours} hours`;
    return `${hours} hours`;
  }

  // Send withdrawal request confirmation
  async sendWithdrawalRequest(user, withdrawal) {
    try {
      const mailOptions = {
        from: `${this.senderName} <${this.senderEmail}>`,
        to: user.email,
        subject: 'Withdrawal Request Submitted',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0;">Withdrawal Request Received</h1>
            </div>
            <div style="padding: 30px; background: #f7f7f7;">
              <h2>Hi ${user.firstName}!</h2>
              <p>Your withdrawal request has been submitted successfully and is pending admin approval.</p>
              
              <div style="background: white; padding: 20px; border-radius: 10px; margin: 20px 0;">
                <h3>Withdrawal Details:</h3>
                <p><strong>Amount:</strong> R${withdrawal.amount}</p>
                <p><strong>Bank:</strong> ${withdrawal.bankDetails.bankName}</p>
                <p><strong>Account:</strong> ***${withdrawal.bankDetails.accountNumber.slice(-4)}</p>
                <p><strong>Status:</strong> Pending Approval</p>
              </div>
              
              <p style="color: #666;">You will receive an email notification once your withdrawal is processed.</p>
              <p style="color: #666;">Processing typically takes 1-2 business days.</p>
            </div>
          </div>
        `
      };

      await this.transporter.sendMail(mailOptions);
      await this.logEmailSent('withdrawal_request', user.email, user.uid);
    } catch (error) {
      console.error('Error sending withdrawal request email:', error);
      throw error;
    }
  }

  // Send withdrawal approved notification
  async sendWithdrawalApproved(user, withdrawal, transactionReference) {
    try {
      const mailOptions = {
        from: `${this.senderName} <${this.senderEmail}>`,
        to: user.email,
        subject: 'Withdrawal Approved - Funds Transferred',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #4CAF50; padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0;">✅ Withdrawal Approved!</h1>
            </div>
            <div style="padding: 30px; background: #f7f7f7;">
              <h2>Hi ${user.firstName}!</h2>
              <p>Great news! Your withdrawal request has been approved and processed.</p>
              
              <div style="background: white; padding: 20px; border-radius: 10px; margin: 20px 0;">
                <h3>Transaction Details:</h3>
                <p><strong>Amount:</strong> R${withdrawal.amount}</p>
                <p><strong>Bank:</strong> ${withdrawal.bankDetails.bankName}</p>
                <p><strong>Account:</strong> ***${withdrawal.bankDetails.accountNumber.slice(-4)}</p>
                ${transactionReference ? `<p><strong>Reference:</strong> ${transactionReference}</p>` : ''}
                <p><strong>Status:</strong> ✅ Completed</p>
              </div>
              
              <p style="color: #666;">The funds should reflect in your account within 1-2 business days.</p>
              <p style="color: #666;">If you have any questions, please contact support.</p>
            </div>
          </div>
        `
      };

      await this.transporter.sendMail(mailOptions);
      await this.logEmailSent('withdrawal_approved', user.email, user.uid);
    } catch (error) {
      console.error('Error sending withdrawal approval email:', error);
      throw error;
    }
  }

  // Send withdrawal rejected notification
  async sendWithdrawalRejected(user, withdrawal, reason) {
    try {
      const mailOptions = {
        from: `${this.senderName} <${this.senderEmail}>`,
        to: user.email,
        subject: 'Withdrawal Request Update',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #f44336; padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0;">Withdrawal Request Update</h1>
            </div>
            <div style="padding: 30px; background: #f7f7f7;">
              <h2>Hi ${user.firstName},</h2>
              <p>Your withdrawal request could not be processed at this time.</p>
              
              <div style="background: white; padding: 20px; border-radius: 10px; margin: 20px 0;">
                <h3>Request Details:</h3>
                <p><strong>Amount:</strong> R${withdrawal.amount}</p>
                <p><strong>Reason:</strong> ${reason}</p>
              </div>
              
              <p>The amount has been refunded to your Quicksell balance.</p>
              <p>You may submit a new withdrawal request at any time.</p>
              
              <p style="color: #666;">If you have questions about this decision, please contact support.</p>
            </div>
          </div>
        `
      };

      await this.transporter.sendMail(mailOptions);
      await this.logEmailSent('withdrawal_rejected', user.email, user.uid);
    } catch (error) {
      console.error('Error sending withdrawal rejection email:', error);
      throw error;
    }
  }

  // Send payment confirmation
  async sendPaymentConfirmation(user, order) {
    try {
      const mailOptions = {
        from: `${this.senderName} <${this.senderEmail}>`,
        to: user.email,
        subject: `Payment Confirmed - ${order.productTitle}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #4CAF50; padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0;">Payment Successful!</h1>
            </div>
            <div style="padding: 30px; background: #f7f7f7;">
              <h2>Hi ${user.firstName}!</h2>
              <p>Your payment has been processed successfully.</p>
              
              <div style="background: white; padding: 20px; border-radius: 10px; margin: 20px 0;">
                <h3>Order Details:</h3>
                <p><strong>Item:</strong> ${order.productTitle}</p>
                <p><strong>Amount:</strong> R${order.amount}</p>
                <p><strong>Order ID:</strong> ${order.id || 'N/A'}</p>
                <p><strong>Payment Method:</strong> ${order.paymentMethod}</p>
              </div>
              
              <p>The seller has been notified and will arrange shipping soon.</p>
              
              <a href="${process.env.FRONTEND_URL || 'https://quicksell-80aad.web.app'}/orders/${order.id}" 
                 style="display: inline-block; background: #667eea; color: white; padding: 15px 30px; 
                        text-decoration: none; border-radius: 5px; margin: 20px 0;">
                View Order
              </a>
            </div>
          </div>
        `
      };

      await this.transporter.sendMail(mailOptions);
      await this.logEmailSent('payment_confirmation', user.email, user.uid);
    } catch (error) {
      console.error('Error sending payment confirmation:', error);
      throw error;
    }
  }

  // Send sale notification to seller
  async sendSaleNotification(seller, order) {
    try {
      const platformFee = order.amount * 0.1;
      const sellerAmount = order.amount - platformFee;
      
      const mailOptions = {
        from: `${this.senderName} <${this.senderEmail}>`,
        to: seller.email,
        subject: `Item Sold - ${order.productTitle}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #4CAF50; padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0;">🎉 Congratulations! Item Sold</h1>
            </div>
            <div style="padding: 30px; background: #f7f7f7;">
              <h2>Hi ${seller.firstName}!</h2>
              <p>Great news! Your item has been sold.</p>
              
              <div style="background: white; padding: 20px; border-radius: 10px; margin: 20px 0;">
                <h3>Sale Details:</h3>
                <p><strong>Item:</strong> ${order.productTitle}</p>
                <p><strong>Sale Price:</strong> R${order.amount}</p>
                <p><strong>Platform Fee (10%):</strong> R${platformFee.toFixed(2)}</p>
                <p><strong>Your Earnings:</strong> R${sellerAmount.toFixed(2)}</p>
                <p><strong>Buyer:</strong> ${order.buyerName}</p>
              </div>
              
              <p><strong>Next Steps:</strong></p>
              <ol>
                <li>Package the item securely</li>
                <li>Ship to the buyer within 2 business days</li>
                <li>Update the order with tracking information</li>
              </ol>
              
              <a href="${process.env.FRONTEND_URL || 'https://quicksell-80aad.web.app'}/orders/${order.id}" 
                 style="display: inline-block; background: #667eea; color: white; padding: 15px 30px; 
                        text-decoration: none; border-radius: 5px; margin: 20px 0;">
                View Order Details
              </a>
            </div>
          </div>
        `
      };

      await this.transporter.sendMail(mailOptions);
      await this.logEmailSent('sale_notification', seller.email, seller.uid);
    } catch (error) {
      console.error('Error sending sale notification:', error);
      throw error;
    }
  }

  // Log email sent to database
  async logEmailSent(type, recipient, userId) {
    try {
      await db.collection('email_logs').add({
        type,
        recipient,
        userId,
        sentAt: admin.firestore.FieldValue.serverTimestamp(),
        status: 'sent'
      });
    } catch (error) {
      console.error('Error logging email:', error);
    }
  }
}

module.exports = new EmailService();