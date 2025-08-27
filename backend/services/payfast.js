const crypto = require('crypto');
const axios = require('axios');

class PayfastService {
  constructor() {
    this.merchantId = process.env.PAYFAST_MERCHANT_ID;
    this.merchantKey = process.env.PAYFAST_MERCHANT_KEY;
    this.passphrase = process.env.PAYFAST_PASSPHRASE;
    this.testMode = process.env.PAYFAST_TEST_MODE === 'true';
    
    // Set URLs based on environment
    this.baseUrl = this.testMode 
      ? 'https://sandbox.payfast.co.za'
      : 'https://www.payfast.co.za';
    
    this.apiUrl = this.testMode
      ? 'https://api.sandbox.payfast.co.za'
      : 'https://api.payfast.co.za';
  }

  // Generate payment signature
  generateSignature(data) {
    // Create parameter string
    let pfOutput = '';
    for (let key in data) {
      if (data.hasOwnProperty(key) && data[key] !== '') {
        pfOutput += `${key}=${encodeURIComponent(data[key].toString().trim()).replace(/%20/g, '+')}&`;
      }
    }

    // Remove last ampersand
    let getString = pfOutput.slice(0, -1);
    
    // Add passphrase if provided
    if (this.passphrase) {
      getString += `&passphrase=${encodeURIComponent(this.passphrase.trim()).replace(/%20/g, '+')}`;
    }

    return crypto.createHash('md5').update(getString).digest('hex');
  }

  // Initialize payment
  async initializePayment(data) {
    try {
      const paymentData = {
        // Merchant details
        merchant_id: this.merchantId,
        merchant_key: this.merchantKey,
        
        // Buyer details
        email_address: data.email,
        name_first: data.firstName,
        name_last: data.lastName,
        cell_number: data.phone,
        
        // Transaction details
        m_payment_id: data.orderId,
        amount: data.amount.toFixed(2),
        item_name: data.itemName || 'Quicksell Auction Payment',
        item_description: data.description || 'Payment for auction item',
        
        // Transaction options
        email_confirmation: 1,
        confirmation_address: data.email,
        
        // Security
        custom_str1: data.userId,
        custom_str2: data.productId,
        custom_int1: data.bidId,
        
        // URLs
        return_url: `${process.env.CLIENT_URL}/payment/success`,
        cancel_url: `${process.env.CLIENT_URL}/payment/cancel`,
        notify_url: `${process.env.SERVER_URL}/api/payments/payfast/webhook`
      };

      // Generate signature
      paymentData.signature = this.generateSignature(paymentData);

      // Return payment form data
      return {
        success: true,
        data: {
          paymentUrl: `${this.baseUrl}/eng/process`,
          paymentData: paymentData
        }
      };
    } catch (error) {
      console.error('Payfast initialization error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Validate webhook notification (ITN)
  async validateWebhook(pfData, pfParamString) {
    try {
      // Step 1: Strip slashes if magic quotes is on
      let pfParamStringClean = pfParamString;

      // Step 2: Verify security signature
      const tempParamString = pfParamString.substring(0, pfParamString.indexOf('&signature'));
      const signature = this.generateSignature(this.parseUrlParams(tempParamString));
      
      if (pfData.signature !== signature) {
        console.error('Invalid signature');
        return false;
      }

      // Step 3: Verify source IP (optional but recommended)
      const validHosts = [
        'www.payfast.co.za',
        'sandbox.payfast.co.za',
        'w1w.payfast.co.za',
        'w2w.payfast.co.za'
      ];

      // Step 4: Confirm payment data with Payfast
      const isValid = await this.verifyPaymentWithPayfast(pfParamString);
      
      return isValid;
    } catch (error) {
      console.error('Payfast validation error:', error);
      return false;
    }
  }

  // Verify payment with Payfast server
  async verifyPaymentWithPayfast(pfParamString) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/eng/query/validate`,
        pfParamString,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      return response.data === 'VALID';
    } catch (error) {
      console.error('Payfast verification error:', error);
      return false;
    }
  }

  // Parse URL parameters
  parseUrlParams(paramString) {
    const params = {};
    const pairs = paramString.split('&');
    
    for (let pair of pairs) {
      const [key, value] = pair.split('=');
      params[key] = decodeURIComponent(value || '');
    }
    
    return params;
  }

  // Get subscription details
  async getSubscription(token) {
    try {
      const timestamp = new Date().toISOString();
      const signature = this.generateApiSignature({ token }, timestamp);

      const response = await axios.get(
        `${this.apiUrl}/subscriptions/${token}`,
        {
          headers: {
            'merchant-id': this.merchantId,
            'version': 'v1',
            'timestamp': timestamp,
            'signature': signature
          }
        }
      );

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Payfast get subscription error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Cancel subscription
  async cancelSubscription(token) {
    try {
      const timestamp = new Date().toISOString();
      const signature = this.generateApiSignature({ token }, timestamp);

      const response = await axios.put(
        `${this.apiUrl}/subscriptions/${token}/cancel`,
        {},
        {
          headers: {
            'merchant-id': this.merchantId,
            'version': 'v1',
            'timestamp': timestamp,
            'signature': signature
          }
        }
      );

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Payfast cancel subscription error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Generate API signature for authenticated requests
  generateApiSignature(data, timestamp) {
    const allData = {
      ...data,
      'merchant-id': this.merchantId,
      'version': 'v1',
      'timestamp': timestamp,
      'passphrase': this.passphrase
    };

    let pfOutput = '';
    for (let key in allData) {
      if (allData.hasOwnProperty(key) && allData[key] !== '') {
        pfOutput += `${key}=${encodeURIComponent(allData[key].toString().trim()).replace(/%20/g, '+')}&`;
      }
    }

    const getString = pfOutput.slice(0, -1);
    return crypto.createHash('md5').update(getString).digest('hex');
  }

  // Process refund
  async refundPayment(paymentId, amount, reason) {
    try {
      const timestamp = new Date().toISOString();
      const data = {
        amount: amount,
        reason: reason
      };
      
      const signature = this.generateApiSignature(data, timestamp);

      const response = await axios.post(
        `${this.apiUrl}/refunds`,
        {
          ...data,
          payment_id: paymentId
        },
        {
          headers: {
            'merchant-id': this.merchantId,
            'version': 'v1',
            'timestamp': timestamp,
            'signature': signature
          }
        }
      );

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Payfast refund error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get transaction history
  async getTransactionHistory(from, to) {
    try {
      const timestamp = new Date().toISOString();
      const data = {
        from: from,
        to: to
      };
      
      const signature = this.generateApiSignature(data, timestamp);

      const response = await axios.get(
        `${this.apiUrl}/transactions/history`,
        {
          params: data,
          headers: {
            'merchant-id': this.merchantId,
            'version': 'v1',
            'timestamp': timestamp,
            'signature': signature
          }
        }
      );

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Payfast transaction history error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new PayfastService();