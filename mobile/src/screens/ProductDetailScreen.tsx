import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import productService, { Product, Bid } from '../services/productService';
import authService from '../services/authService';
import { getImageUrl, processImageArray } from '../utils/imageHelper';

export default function ProductDetailScreen({ route, navigation }: any) {
  const { productId } = route.params;
  const [product, setProduct] = useState<Product | null>(null);
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);
  const [bidAmount, setBidAmount] = useState('');
  const [placingBid, setPlacingBid] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  useEffect(() => {
    loadData();
  }, [productId]);

  const loadData = async () => {
    try {
      const [productData, bidsData, userData] = await Promise.all([
        productService.getProduct(productId),
        productService.getProductBids(productId),
        authService.getCurrentUser()
      ]);
      
      setProduct(productData);
      setBids(bidsData);
      setUser(userData);
      
      // Set minimum bid amount
      if (productData) {
        const minBid = productData.currentPrice + productData.incrementAmount;
        setBidAmount(minBid.toString());
      }
    } catch (error) {
      console.error('Error loading product:', error);
      Alert.alert('Error', 'Failed to load product details');
    } finally {
      setLoading(false);
    }
  };

  const handlePlaceBid = async () => {
    if (!user) {
      Alert.alert(
        'Login Required',
        'Please login to place a bid',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Login', onPress: () => navigation.navigate('Login') }
        ]
      );
      return;
    }

    const amount = parseFloat(bidAmount);
    const minBid = (product?.currentPrice || 0) + (product?.incrementAmount || 0);

    if (isNaN(amount) || amount < minBid) {
      Alert.alert('Invalid Bid', `Minimum bid is ${productService.formatPrice(minBid)}`);
      return;
    }

    if (amount > user.balance) {
      Alert.alert('Insufficient Balance', 'You do not have enough balance to place this bid');
      return;
    }

    setPlacingBid(true);
    try {
      await productService.placeBid(
        productId,
        user.uid,
        user.username,
        amount
      );
      
      Alert.alert('Success', 'Bid placed successfully!');
      loadData(); // Reload to get updated data
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to place bid');
    } finally {
      setPlacingBid(false);
    }
  };

  const handleBuyNow = () => {
    if (!user) {
      Alert.alert(
        'Login Required',
        'Please login to buy now',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Login', onPress: () => navigation.navigate('Login') }
        ]
      );
      return;
    }

    Alert.alert(
      'Buy Now',
      `Confirm purchase for ${productService.formatPrice(product?.buyNowPrice || 0)}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Confirm', onPress: () => Alert.alert('Success', 'Purchase confirmed!') }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#667eea" />
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

  const timeRemaining = productService.getTimeRemaining(product.endDate);
  const isEnded = timeRemaining === 'Ended';

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Image Gallery */}
          <View style={styles.imageContainer}>
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScroll={(e) => {
                const index = Math.round(e.nativeEvent.contentOffset.x / 300);
                setActiveImageIndex(index);
              }}
            >
              {processImageArray(product.images).map((image, index) => (
                <Image
                  key={index}
                  source={{ uri: image }}
                  style={styles.productImage}
                />
              ))}
            </ScrollView>
            <View style={styles.imageDots}>
              {product.images.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.dot,
                    index === activeImageIndex && styles.activeDot
                  ]}
                />
              ))}
            </View>
          </View>

          {/* Product Info */}
          <View style={styles.infoContainer}>
            <Text style={styles.title}>{product.title}</Text>
            
            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>Current Bid</Text>
                <Text style={styles.metaValue}>
                  {productService.formatPrice(product.currentPrice)}
                </Text>
              </View>
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>Time Left</Text>
                <Text style={[styles.metaValue, isEnded && styles.endedText]}>
                  {timeRemaining}
                </Text>
              </View>
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>Bids</Text>
                <Text style={styles.metaValue}>{product.totalBids}</Text>
              </View>
            </View>

            {/* Bidding Section */}
            {!isEnded && (
              <View style={styles.biddingSection}>
                <View style={styles.bidInputContainer}>
                  <Text style={styles.currencySymbol}>R</Text>
                  <TextInput
                    style={styles.bidInput}
                    value={bidAmount}
                    onChangeText={setBidAmount}
                    keyboardType="numeric"
                    placeholder="Enter bid amount"
                  />
                </View>
                <TouchableOpacity
                  style={[styles.bidButton, placingBid && styles.buttonDisabled]}
                  onPress={handlePlaceBid}
                  disabled={placingBid}
                >
                  {placingBid ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.bidButtonText}>Place Bid</Text>
                  )}
                </TouchableOpacity>
                
                {product.buyNowPrice && (
                  <TouchableOpacity
                    style={styles.buyNowButton}
                    onPress={handleBuyNow}
                  >
                    <Text style={styles.buyNowButtonText}>
                      Buy Now for {productService.formatPrice(product.buyNowPrice)}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* Description */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Description</Text>
              <Text style={styles.description}>{product.description}</Text>
            </View>

            {/* Details */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Details</Text>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Condition:</Text>
                <Text style={styles.detailValue}>{product.condition}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Location:</Text>
                <Text style={styles.detailValue}>{product.location}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Shipping:</Text>
                <Text style={styles.detailValue}>
                  {product.freeShipping ? 'Free' : productService.formatPrice(product.shippingCost)}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Seller:</Text>
                <Text style={styles.detailValue}>{product.sellerName}</Text>
              </View>
            </View>

            {/* Recent Bids */}
            {bids.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Recent Bids</Text>
                {bids.slice(0, 5).map((bid, index) => (
                  <View key={index} style={styles.bidItem}>
                    <Text style={styles.bidderName}>{bid.bidderName}</Text>
                    <Text style={styles.bidAmount}>
                      {productService.formatPrice(bid.amount)}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 18,
    color: '#718096',
  },
  imageContainer: {
    position: 'relative',
  },
  productImage: {
    width: 300,
    height: 300,
    backgroundColor: '#f0f0f0',
  },
  imageDots: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
    flexDirection: 'row',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
    opacity: 0.5,
    marginHorizontal: 4,
  },
  activeDot: {
    opacity: 1,
  },
  infoContainer: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a202c',
    marginBottom: 16,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  metaItem: {
    flex: 1,
    alignItems: 'center',
  },
  metaLabel: {
    fontSize: 12,
    color: '#718096',
    marginBottom: 4,
  },
  metaValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a202c',
  },
  endedText: {
    color: '#e53e3e',
  },
  biddingSection: {
    marginVertical: 20,
  },
  bidInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 12,
  },
  currencySymbol: {
    fontSize: 18,
    color: '#4a5568',
    paddingHorizontal: 16,
  },
  bidInput: {
    flex: 1,
    padding: 16,
    fontSize: 18,
    color: '#1a202c',
  },
  bidButton: {
    backgroundColor: '#667eea',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  bidButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buyNowButton: {
    backgroundColor: '#48bb78',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  buyNowButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a202c',
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: '#4a5568',
    lineHeight: 22,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  detailLabel: {
    fontSize: 14,
    color: '#718096',
  },
  detailValue: {
    fontSize: 14,
    color: '#1a202c',
    fontWeight: '500',
  },
  bidItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  bidderName: {
    fontSize: 14,
    color: '#4a5568',
  },
  bidAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#667eea',
  },
});