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
import socketService from '../services/socketService';
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
  const [socketConnected, setSocketConnected] = useState(false);

  useEffect(() => {
    loadData();
    setupSocketConnection();

    return () => {
      // Cleanup socket connection when leaving screen
      if (productId) {
        socketService.leaveAuction(productId);
      }
    };
  }, [productId]);

  const setupSocketConnection = () => {
    // Connect to socket server
    socketService.connect();
    
    // Join auction room
    if (productId) {
      socketService.joinAuction(productId);
    }

    // Listen for connection status
    const unsubscribeConnection = socketService.onConnectionChange((connected: boolean) => {
      setSocketConnected(connected);
      // Don't rejoin here - the socket service handles reconnection automatically
    });

    // Listen for new bids
    const unsubscribeBids = socketService.onNewBid(productId, (bidData: any) => {
      // Update product price
      setProduct(prev => prev ? {
        ...prev,
        currentPrice: bidData.amount,
        totalBids: (prev.totalBids || 0) + 1
      } : null);
      
      // Add new bid to list
      setBids(prev => [bidData, ...prev]);
      
      // Show notification if it's not our bid
      if (user && bidData.userId !== user.uid) {
        Alert.alert('New Bid!', `Someone bid ${productService.formatPrice(bidData.amount)}`);
      }
    });

    // Listen for auction info
    const unsubscribeInfo = socketService.onAuctionInfo((info: any) => {
      if (info.currentPrice && product) {
        setProduct(prev => prev ? {
          ...prev,
          currentPrice: info.currentPrice,
          totalBids: info.bidsCount || prev.totalBids
        } : null);
      }
      if (info.topBids) {
        setBids(info.topBids);
      }
    });

    // Cleanup function
    return () => {
      unsubscribeConnection();
      unsubscribeBids();
      unsubscribeInfo();
    };
  };

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
        const minBid = productData.currentPrice + (productData.incrementAmount || 100);
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
    const minBid = (product?.currentPrice || 0) + (product?.incrementAmount || 100);

    if (isNaN(amount) || amount < minBid) {
      Alert.alert('Invalid Bid', `Minimum bid is ${productService.formatPrice(minBid)}`);
      return;
    }

    // No balance check - users can bid and pay later when they win
    // This matches the main website behavior

    setPlacingBid(true);
    try {
      // Place bid through API (this already handles everything including socket notifications)
      await productService.placeBid(
        productId,
        user.uid || user.id,
        user.username || `${user.firstName} ${user.lastName}`,
        amount
      );
      
      // Don't emit through socket - the API already updates the database
      // and the socket service will pick up the change automatically
      
      Alert.alert('Success', 'Bid placed successfully!');
      
      // Update minimum bid for next bid
      const nextMinBid = amount + (product?.incrementAmount || 100);
      setBidAmount(nextMinBid.toString());
      
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

    navigation.navigate('Checkout', {
      productId: product?.id,
      type: 'buy_now',
      amount: product?.buyNowPrice
    });
  };

  const handleAddToWishlist = async () => {
    if (!user) {
      Alert.alert('Login Required', 'Please login to add to wishlist');
      return;
    }

    try {
      // TODO: Implement wishlist API call
      Alert.alert('Success', 'Added to wishlist!');
    } catch (error) {
      Alert.alert('Error', 'Failed to add to wishlist');
    }
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
          {/* Socket Connection Status */}
          {!socketConnected && (
            <View style={styles.connectionBar}>
              <Text style={styles.connectionText}>⚠️ Live updates unavailable</Text>
            </View>
          )}

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
            
            {/* Wishlist Button */}
            <TouchableOpacity style={styles.wishlistButton} onPress={handleAddToWishlist}>
              <Text style={styles.wishlistIcon}>❤️</Text>
            </TouchableOpacity>
          </View>

          {/* Product Info */}
          <View style={styles.infoContainer}>
            <Text style={styles.title}>{product.title}</Text>
            
            {/* Category, Condition, and Views */}
            <View style={styles.badgeRow}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{product.category}</Text>
              </View>
              <View style={[styles.badge, styles.conditionBadge]}>
                <Text style={styles.badgeText}>{productService.getConditionLabel(product.condition)}</Text>
              </View>
              <Text style={styles.viewsText}>👁 {product.views} views</Text>
            </View>
            
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
                <Text style={styles.metaLabel}>Activity</Text>
                <Text style={styles.metaValue}>{product.totalBids || 0} bids</Text>
                <Text style={styles.metaSubLabel}>{product.uniqueBidders || 0} bidders</Text>
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
                <Text style={styles.minBidText}>
                  Min bid: {productService.formatPrice((product.currentPrice || 0) + (product.incrementAmount || 100))}
                </Text>
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

            {/* Auction Ended */}
            {isEnded && (
              <View style={styles.endedSection}>
                <Text style={styles.endedTitle}>🔨 Auction Ended</Text>
                <Text style={styles.endedSubtext}>
                  Final Price: {productService.formatPrice(product.currentPrice)}
                </Text>
              </View>
            )}

            {/* Description */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Description</Text>
              <Text style={styles.description}>{product.description}</Text>
            </View>

            {/* Seller Information */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Seller Information</Text>
              <View style={styles.sellerCard}>
                <View style={styles.sellerAvatar}>
                  <Text style={styles.avatarIcon}>👤</Text>
                </View>
                <View style={styles.sellerInfo}>
                  <Text style={styles.sellerName}>{product.sellerName || 'Unknown Seller'}</Text>
                  <View style={styles.ratingRow}>
                    <Text style={styles.stars}>⭐⭐⭐⭐⭐</Text>
                    <Text style={styles.ratingText}>(0 reviews)</Text>
                  </View>
                </View>
              </View>
            </View>
            
            {/* Shipping Information */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Shipping & Location</Text>
              <View style={styles.shippingCard}>
                <View style={styles.shippingRow}>
                  <Text style={styles.shippingIcon}>📍</Text>
                  <Text style={styles.shippingText}>Ships from: {product.location || 'South Africa'}</Text>
                </View>
                <View style={styles.shippingRow}>
                  <Text style={styles.shippingIcon}>📦</Text>
                  <Text style={styles.shippingText}>
                    Shipping: {product.freeShipping ? 'FREE' : productService.formatPrice(product.shippingCost || 0)}
                  </Text>
                </View>
                {product.freeShipping && (
                  <View style={styles.freeShippingBadge}>
                    <Text style={styles.freeShippingText}>✅ Free Shipping Available</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Recent Bids */}
            {bids.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Recent Bids ({bids.length})</Text>
                {bids.slice(0, 5).map((bid, index) => (
                  <View key={bid.id || index} style={styles.bidItem}>
                    <View>
                      <Text style={styles.bidderName}>
                        {bid.userName || bid.bidderName || 'Anonymous'}
                      </Text>
                      <Text style={styles.bidTime}>
                        {bid.createdAt ? new Date(bid.createdAt).toLocaleString() : 'Just now'}
                      </Text>
                    </View>
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
  connectionBar: {
    backgroundColor: '#fed7d7',
    padding: 8,
    alignItems: 'center',
  },
  connectionText: {
    color: '#c53030',
    fontSize: 12,
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
  wishlistButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: '#fff',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  wishlistIcon: {
    fontSize: 20,
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
    marginBottom: 8,
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
  minBidText: {
    fontSize: 12,
    color: '#718096',
    marginBottom: 12,
    textAlign: 'center',
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
  endedSection: {
    backgroundColor: '#fed7d7',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginVertical: 20,
  },
  endedTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#c53030',
    marginBottom: 4,
  },
  endedSubtext: {
    fontSize: 14,
    color: '#9b2c2c',
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
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  bidderName: {
    fontSize: 14,
    color: '#4a5568',
    fontWeight: '500',
  },
  bidTime: {
    fontSize: 12,
    color: '#a0aec0',
    marginTop: 2,
  },
  bidAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#667eea',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  badge: {
    backgroundColor: '#edf2f7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  conditionBadge: {
    backgroundColor: '#c6f6d5',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2d3748',
  },
  viewsText: {
    fontSize: 12,
    color: '#718096',
    marginLeft: 'auto',
  },
  metaSubLabel: {
    fontSize: 11,
    color: '#a0aec0',
    marginTop: 2,
  },
  sellerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f7fafc',
    padding: 16,
    borderRadius: 12,
  },
  sellerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarIcon: {
    fontSize: 24,
  },
  sellerInfo: {
    flex: 1,
  },
  sellerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a202c',
    marginBottom: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stars: {
    fontSize: 12,
  },
  ratingText: {
    fontSize: 12,
    color: '#718096',
    marginLeft: 4,
  },
  shippingCard: {
    backgroundColor: '#f7fafc',
    padding: 16,
    borderRadius: 12,
  },
  shippingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  shippingIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  shippingText: {
    fontSize: 14,
    color: '#4a5568',
  },
  freeShippingBadge: {
    backgroundColor: '#c6f6d5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  freeShippingText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#22543d',
  },
});