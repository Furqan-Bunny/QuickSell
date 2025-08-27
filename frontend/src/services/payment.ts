import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export interface PaymentMethod {
  id: string;
  name: string;
  description: string;
  countries: string[];
  currencies: string[];
  logo: string;
}

export interface PaymentData {
  orderId: string;
  paymentMethod: 'flutterwave' | 'payfast';
}

export interface FlutterwaveResponse {
  paymentUrl: string;
  txRef: string;
}

export interface PayfastResponse {
  paymentUrl: string;
  paymentData: Record<string, any>;
}

class PaymentService {
  // Get available payment methods
  async getPaymentMethods(): Promise<PaymentMethod[]> {
    try {
      const response = await axios.get(`${API_URL}/payments/methods`);
      return response.data;
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      throw error;
    }
  }

  // Initialize payment
  async initializePayment(data: PaymentData): Promise<FlutterwaveResponse | PayfastResponse> {
    try {
      const response = await axios.post(`${API_URL}/payments/initialize`, data);
      return response.data;
    } catch (error) {
      console.error('Error initializing payment:', error);
      throw error;
    }
  }

  // Verify payment status
  async verifyPayment(orderId: string) {
    try {
      const response = await axios.get(`${API_URL}/payments/verify/${orderId}`);
      return response.data;
    } catch (error) {
      console.error('Error verifying payment:', error);
      throw error;
    }
  }

  // Process Flutterwave payment
  processFlutterwavePayment(response: FlutterwaveResponse) {
    // Redirect to Flutterwave payment page
    window.location.href = response.paymentUrl;
  }

  // Process Payfast payment
  processPayfastPayment(response: PayfastResponse) {
    // Create and submit form for Payfast
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = response.paymentUrl;

    // Add all payment data as hidden inputs
    Object.keys(response.paymentData).forEach(key => {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = key;
      input.value = response.paymentData[key];
      form.appendChild(input);
    });

    document.body.appendChild(form);
    form.submit();
  }

  // Handle payment callback
  async handlePaymentCallback(params: URLSearchParams) {
    const status = params.get('status');
    const txRef = params.get('tx_ref') || params.get('txref');
    const transactionId = params.get('transaction_id') || params.get('id');

    if (status === 'successful' || status === 'completed') {
      // Payment successful
      return {
        success: true,
        txRef,
        transactionId
      };
    } else if (status === 'cancelled' || status === 'failed') {
      // Payment failed or cancelled
      return {
        success: false,
        txRef,
        transactionId
      };
    }

    // For Payfast, check the return page type
    const returnType = window.location.pathname;
    if (returnType.includes('success')) {
      return { success: true };
    } else if (returnType.includes('cancel')) {
      return { success: false };
    }

    return { success: false };
  }

  // Add funds to wallet
  async addFundsToWallet(amount: number, paymentMethod: 'flutterwave' | 'payfast') {
    try {
      const response = await axios.post(`${API_URL}/payments/add-funds`, {
        amount,
        paymentMethod
      });
      return response.data;
    } catch (error) {
      console.error('Error adding funds:', error);
      throw error;
    }
  }

  // Request refund (admin only)
  async requestRefund(orderId: string, reason: string, amount?: number) {
    try {
      const response = await axios.post(`${API_URL}/payments/refund`, {
        orderId,
        reason,
        amount
      });
      return response.data;
    } catch (error) {
      console.error('Error requesting refund:', error);
      throw error;
    }
  }

  // Format currency based on country
  formatCurrency(amount: number, currency = 'ZAR'): string {
    const formatter = new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });

    return formatter.format(amount);
  }

  // Get currency symbol
  getCurrencySymbol(currency = 'ZAR'): string {
    const symbols: Record<string, string> = {
      'ZAR': 'R',
      'USD': '$',
      'EUR': '€',
      'GBP': '£',
      'NGN': '₦',
      'KES': 'KSh',
      'GHS': 'GH₵',
      'UGX': 'USh',
      'TZS': 'TSh'
    };

    return symbols[currency] || currency;
  }

  // Validate South African phone number
  validateSAPhoneNumber(phone: string): boolean {
    // Remove spaces and special characters
    const cleaned = phone.replace(/\D/g, '');
    
    // Check if it's a valid SA number (starts with 27 or 0)
    const saRegex = /^(?:27|0)(?:6[0-9]|7[0-9]|8[0-9])[0-9]{7}$/;
    return saRegex.test(cleaned);
  }

  // Format South African phone number
  formatSAPhoneNumber(phone: string): string {
    const cleaned = phone.replace(/\D/g, '');
    
    if (cleaned.startsWith('27')) {
      // International format: +27 XX XXX XXXX
      return `+${cleaned.slice(0, 2)} ${cleaned.slice(2, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`;
    } else if (cleaned.startsWith('0')) {
      // Local format: 0XX XXX XXXX
      return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
    }
    
    return phone;
  }
}

export default new PaymentService();