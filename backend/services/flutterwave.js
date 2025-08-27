const Flutterwave = require('flutterwave-node-v3');
const crypto = require('crypto');

class FlutterwaveService {
  constructor() {
    // Only initialize if keys are provided
    if (process.env.FLUTTERWAVE_PUBLIC_KEY && process.env.FLUTTERWAVE_SECRET_KEY) {
      this.flw = new Flutterwave(
        process.env.FLUTTERWAVE_PUBLIC_KEY,
        process.env.FLUTTERWAVE_SECRET_KEY
      );
    } else {
      this.flw = null;
      console.log('Flutterwave service not initialized - missing API keys');
    }
  }

  // Generate unique transaction reference
  generateTransactionRef() {
    return `QS-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
  }

  // Initialize payment - Using standard payment link generation
  async initializePayment(data) {
    if (!this.flw) {
      return {
        success: false,
        error: 'Payment service not configured'
      };
    }
    try {
      const tx_ref = this.generateTransactionRef();
      
      // Generate payment link using Flutterwave's standard hosted payment page
      const baseUrl = 'https://checkout.flutterwave.com/v3/hosted/pay';
      
      // Always use production URL for Flutterwave (they block localhost)
      const clientUrl = 'https://quicksell-80aad.web.app';
      
      const params = new URLSearchParams({
        public_key: process.env.FLUTTERWAVE_PUBLIC_KEY,
        tx_ref: tx_ref,
        amount: data.amount,
        currency: data.currency || 'ZAR',
        redirect_url: `${clientUrl}/payment/success`,
        customer_email: data.email,
        customer_phonenumber: data.phone || '',
        customer_name: data.name,
        payment_options: 'card,mobilemoney,ussd,banktransfer',
        meta: JSON.stringify({
          orderId: data.orderId,
          productId: data.productId,
          userId: data.userId
        }),
        customizations: JSON.stringify({
          title: 'Quicksell Auction Payment',
          description: data.description || 'Payment for auction item',
          logo: `${clientUrl}/logo.png`
        })
      });
      
      const paymentLink = `${baseUrl}?${params.toString()}`;
      
      return {
        success: true,
        data: {
          link: paymentLink,
          tx_ref: tx_ref,
          data: {
            link: paymentLink,
            tx_ref: tx_ref
          }
        }
      };
    } catch (error) {
      console.error('Flutterwave initialization error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Verify payment
  async verifyPayment(transactionId) {
    try {
      const response = await this.flw.Transaction.verify({ id: transactionId });
      
      if (response.data.status === 'successful' && 
          response.data.amount >= response.data.charged_amount) {
        return {
          success: true,
          data: {
            transactionId: response.data.id,
            txRef: response.data.tx_ref,
            amount: response.data.amount,
            currency: response.data.currency,
            status: response.data.status,
            paymentType: response.data.payment_type,
            customer: {
              email: response.data.customer.email,
              name: response.data.customer.name
            },
            meta: response.data.meta
          }
        };
      }
      
      return {
        success: false,
        error: 'Payment verification failed'
      };
    } catch (error) {
      console.error('Flutterwave verification error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Process refund
  async refundPayment(transactionId, amount) {
    try {
      const response = await this.flw.Transaction.refund({
        id: transactionId,
        amount: amount
      });
      
      return {
        success: true,
        data: response
      };
    } catch (error) {
      console.error('Flutterwave refund error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get transaction details
  async getTransaction(transactionId) {
    try {
      const response = await this.flw.Transaction.get({ id: transactionId });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Flutterwave get transaction error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Create virtual account for seller payouts
  async createVirtualAccount(data) {
    try {
      const payload = {
        email: data.email,
        is_permanent: true,
        bvn: data.bvn, // Bank Verification Number for Nigerian accounts
        tx_ref: this.generateTransactionRef(),
        phonenumber: data.phone,
        firstname: data.firstName,
        lastname: data.lastName,
        narration: `Quicksell seller account - ${data.username}`
      };

      const response = await this.flw.VirtualAcct.create(payload);
      return {
        success: true,
        data: response
      };
    } catch (error) {
      console.error('Flutterwave virtual account error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Transfer funds to seller
  async transferToSeller(data) {
    try {
      const payload = {
        account_bank: data.bankCode,
        account_number: data.accountNumber,
        amount: data.amount,
        narration: data.narration || 'Quicksell payout',
        currency: data.currency || 'ZAR',
        reference: this.generateTransactionRef(),
        callback_url: `${process.env.SERVER_URL}/webhooks/flutterwave/transfer`,
        debit_currency: 'ZAR',
        meta: {
          sellerId: data.sellerId,
          orderId: data.orderId
        }
      };

      const response = await this.flw.Transfer.initiate(payload);
      return {
        success: true,
        data: response
      };
    } catch (error) {
      console.error('Flutterwave transfer error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Validate webhook signature
  validateWebhook(signature, payload) {
    const secretHash = process.env.FLUTTERWAVE_ENCRYPTION_KEY || process.env.FLUTTERWAVE_SECRET_HASH;
    const hash = crypto.createHmac('sha256', secretHash)
      .update(JSON.stringify(payload))
      .digest('hex');
    
    return hash === signature;
  }
}

module.exports = new FlutterwaveService();