import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ordersAPI, paymentAPI, productsAPI } from '../services/apiService';
import { auth } from '../config/firebase';

const CheckoutScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { productId, buyNowPrice, type = 'buy_now' } = route.params || {};

  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('wallet');
  
  // Shipping form state
  const [shippingForm, setShippingForm] = useState({
    firstName: '',
    lastName: '',
    email: auth.currentUser?.email || '',
    phone: '',
    address: '',
    city: '',
    province: 'Gauteng',
    postalCode: '',
    country: 'South Africa',
  });

  const provinces = [
    'Eastern Cape',
    'Free State',
    'Gauteng',
    'KwaZulu-Natal',
    'Limpopo',
    'Mpumalanga',
    'Northern Cape',
    'North West',
    'Western Cape',
  ];

  useEffect(() => {
    if (productId) {
      fetchProduct();
    } else {
      Alert.alert('Error', 'No product selected');
      navigation.goBack();
    }
  }, [productId]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const response = await productsAPI.getById(productId);
      if (response.success) {
        setProduct(response.data);
      }
    } catch (error) {
      console.error('Error fetching product:', error);
      Alert.alert('Error', 'Failed to load product details');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return `R${price.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
  };

  const calculateTotal = () => {
    if (!product) return { subtotal: 0, vat: 0, shipping: 0, total: 0 };
    
    const subtotal = buyNowPrice || product.currentPrice || product.startingPrice;
    const vat = subtotal * 0.15; // 15% VAT
    const shipping = product.shipping?.cost || 0;
    const total = subtotal + vat + shipping;

    return { subtotal, vat, shipping, total };
  };

  const validateForm = () => {
    const required = ['firstName', 'lastName', 'phone', 'address', 'city', 'postalCode'];
    for (const field of required) {
      if (!shippingForm[field as keyof typeof shippingForm]) {
        Alert.alert('Error', `Please fill in ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`);
        return false;
      }
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(shippingForm.email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return false;
    }

    // Validate phone
    const phoneRegex = /^(\+27|0)[0-9]{9}$/;
    if (!phoneRegex.test(shippingForm.phone.replace(/\s/g, ''))) {
      Alert.alert('Error', 'Please enter a valid South African phone number');
      return false;
    }

    return true;
  };

  const handleCheckout = async () => {
    if (!validateForm()) return;

    setProcessing(true);
    const { total } = calculateTotal();

    try {
      // Create order
      const orderData = {
        productId: product.id,
        type,
        amount: total,
        shippingAddress: shippingForm,
        paymentMethod,
      };

      const orderResponse = await ordersAPI.create(orderData);
      
      if (!orderResponse.success) {
        throw new Error(orderResponse.error || 'Failed to create order');
      }

      const orderId = orderResponse.data.id;

      // Process payment based on method
      if (paymentMethod === 'wallet') {
        const paymentResponse = await paymentAPI.processWalletPayment(orderId, total);
        
        if (paymentResponse.success) {
          Alert.alert(
            'Success!',
            'Your order has been placed successfully.',
            [
              {
                text: 'View Order',
                onPress: () => navigation.navigate('Orders' as never),
              },
            ]
          );
        } else {
          throw new Error(paymentResponse.error || 'Payment failed');
        }
      } else if (paymentMethod === 'payfast') {
        const paymentResponse = await paymentAPI.initializePayfast(orderId);
        
        if (paymentResponse.success && paymentResponse.data.paymentUrl) {
          // Navigate to payment screen or open web view
          navigation.navigate('PaymentWebView' as never, {
            url: paymentResponse.data.paymentUrl,
            orderId,
          } as never);
        } else {
          throw new Error('Failed to initialize payment');
        }
      } else if (paymentMethod === 'flutterwave') {
        const paymentResponse = await paymentAPI.initializeFlutterwave(orderId);
        
        if (paymentResponse.success && paymentResponse.data.paymentUrl) {
          // Navigate to payment screen or open web view
          navigation.navigate('PaymentWebView' as never, {
            url: paymentResponse.data.paymentUrl,
            orderId,
          } as never);
        } else {
          throw new Error('Failed to initialize payment');
        }
      }
    } catch (error: any) {
      console.error('Checkout error:', error);
      Alert.alert('Error', error.message || 'Failed to process checkout');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#667eea" />
        <Text style={styles.loadingText}>Loading checkout...</Text>
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Product not found</Text>
      </View>
    );
  }

  const { subtotal, vat, shipping, total } = calculateTotal();

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Product Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          <View style={styles.productCard}>
            <Image
              source={{ uri: product.images?.[0] || 'https://via.placeholder.com/80' }}
              style={styles.productImage}
            />
            <View style={styles.productInfo}>
              <Text style={styles.productTitle} numberOfLines={2}>{product.title}</Text>
              <Text style={styles.productPrice}>{formatPrice(subtotal)}</Text>
              <Text style={styles.productType}>
                {type === 'buy_now' ? 'Buy Now' : 'Auction Won'}
              </Text>
            </View>
          </View>
        </View>

        {/* Shipping Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Shipping Information</Text>
          
          <View style={styles.row}>
            <TextInput
              style={[styles.input, styles.halfInput]}
              placeholder="First Name"
              value={shippingForm.firstName}
              onChangeText={(text) => setShippingForm({ ...shippingForm, firstName: text })}
            />
            <TextInput
              style={[styles.input, styles.halfInput]}
              placeholder="Last Name"
              value={shippingForm.lastName}
              onChangeText={(text) => setShippingForm({ ...shippingForm, lastName: text })}
            />
          </View>

          <TextInput
            style={styles.input}
            placeholder="Email"
            value={shippingForm.email}
            onChangeText={(text) => setShippingForm({ ...shippingForm, email: text })}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <TextInput
            style={styles.input}
            placeholder="Phone Number"
            value={shippingForm.phone}
            onChangeText={(text) => setShippingForm({ ...shippingForm, phone: text })}
            keyboardType="phone-pad"
          />

          <TextInput
            style={styles.input}
            placeholder="Street Address"
            value={shippingForm.address}
            onChangeText={(text) => setShippingForm({ ...shippingForm, address: text })}
          />

          <View style={styles.row}>
            <TextInput
              style={[styles.input, styles.halfInput]}
              placeholder="City"
              value={shippingForm.city}
              onChangeText={(text) => setShippingForm({ ...shippingForm, city: text })}
            />
            <TextInput
              style={[styles.input, styles.halfInput]}
              placeholder="Postal Code"
              value={shippingForm.postalCode}
              onChangeText={(text) => setShippingForm({ ...shippingForm, postalCode: text })}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.pickerContainer}>
            <Text style={styles.pickerLabel}>Province</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {provinces.map((province) => (
                <TouchableOpacity
                  key={province}
                  style={[
                    styles.provinceOption,
                    shippingForm.province === province && styles.provinceOptionActive,
                  ]}
                  onPress={() => setShippingForm({ ...shippingForm, province })}
                >
                  <Text
                    style={[
                      styles.provinceText,
                      shippingForm.province === province && styles.provinceTextActive,
                    ]}
                  >
                    {province}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>

        {/* Payment Method */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          
          <TouchableOpacity
            style={[styles.paymentOption, paymentMethod === 'wallet' && styles.paymentOptionActive]}
            onPress={() => setPaymentMethod('wallet')}
          >
            <Text style={styles.paymentIcon}>💳</Text>
            <View style={styles.paymentInfo}>
              <Text style={styles.paymentTitle}>Wallet Balance</Text>
              <Text style={styles.paymentDescription}>Pay with your account balance</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.paymentOption, paymentMethod === 'payfast' && styles.paymentOptionActive]}
            onPress={() => setPaymentMethod('payfast')}
          >
            <Text style={styles.paymentIcon}>🔒</Text>
            <View style={styles.paymentInfo}>
              <Text style={styles.paymentTitle}>PayFast</Text>
              <Text style={styles.paymentDescription}>Cards, EFT, QR codes</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.paymentOption, paymentMethod === 'flutterwave' && styles.paymentOptionActive]}
            onPress={() => setPaymentMethod('flutterwave')}
          >
            <Text style={styles.paymentIcon}>🌍</Text>
            <View style={styles.paymentInfo}>
              <Text style={styles.paymentTitle}>Flutterwave</Text>
              <Text style={styles.paymentDescription}>International payments</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Price Breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Price Breakdown</Text>
          
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Subtotal</Text>
            <Text style={styles.priceValue}>{formatPrice(subtotal)}</Text>
          </View>
          
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>VAT (15%)</Text>
            <Text style={styles.priceValue}>{formatPrice(vat)}</Text>
          </View>
          
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Shipping</Text>
            <Text style={styles.priceValue}>
              {shipping === 0 ? 'FREE' : formatPrice(shipping)}
            </Text>
          </View>
          
          <View style={[styles.priceRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{formatPrice(total)}</Text>
          </View>
        </View>

        {/* Checkout Button */}
        <TouchableOpacity
          style={[styles.checkoutButton, processing && styles.checkoutButtonDisabled]}
          onPress={handleCheckout}
          disabled={processing}
        >
          {processing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.checkoutButtonText}>Complete Order</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.secureText}>🔒 Secure checkout powered by SSL encryption</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContent: {
    paddingBottom: 30,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#718096',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#e53e3e',
  },
  section: {
    backgroundColor: '#fff',
    marginVertical: 10,
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a202c',
    marginBottom: 15,
  },
  productCard: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#f7fafc',
  },
  productInfo: {
    flex: 1,
    marginLeft: 12,
  },
  productTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#667eea',
    marginBottom: 4,
  },
  productType: {
    fontSize: 12,
    color: '#718096',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfInput: {
    width: '48%',
  },
  pickerContainer: {
    marginTop: 8,
  },
  pickerLabel: {
    fontSize: 14,
    color: '#4a5568',
    marginBottom: 8,
  },
  provinceOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginRight: 8,
  },
  provinceOptionActive: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
  },
  provinceText: {
    fontSize: 14,
    color: '#4a5568',
  },
  provinceTextActive: {
    color: '#fff',
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    marginBottom: 12,
  },
  paymentOptionActive: {
    borderColor: '#667eea',
    backgroundColor: '#f0f4ff',
  },
  paymentIcon: {
    fontSize: 24,
    marginRight: 15,
  },
  paymentInfo: {
    flex: 1,
  },
  paymentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: 2,
  },
  paymentDescription: {
    fontSize: 12,
    color: '#718096',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  priceLabel: {
    fontSize: 14,
    color: '#718096',
  },
  priceValue: {
    fontSize: 14,
    color: '#2d3748',
    fontWeight: '500',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    marginTop: 8,
    paddingTop: 12,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a202c',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#667eea',
  },
  checkoutButton: {
    backgroundColor: '#667eea',
    marginHorizontal: 20,
    marginTop: 20,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  checkoutButtonDisabled: {
    opacity: 0.6,
  },
  checkoutButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  secureText: {
    textAlign: 'center',
    fontSize: 12,
    color: '#718096',
    marginTop: 10,
  },
});

export default CheckoutScreen;