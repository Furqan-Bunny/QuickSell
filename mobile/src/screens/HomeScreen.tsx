import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Image,
  RefreshControl,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import productService, { Product } from '../services/productService';
import authService from '../services/authService';
import { getFirstImageUrl } from '../utils/imageHelper';
import { testAuthToken } from '../utils/testAuth';

export default function HomeScreen({ navigation }: any) {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [recentProducts, setRecentProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    loadData();
    loadUser();
  }, []);

  const loadUser = async () => {
    const currentUser = await authService.getCurrentUser();
    setUser(currentUser);
  };

  const loadData = async () => {
    try {
      // Fetch ALL products without any status filter, like the main website does
      const allProducts = await productService.getProducts();
      
      // Filter featured products client-side
      const featured = allProducts.filter((p: Product) => p.featured);
      
      // Show all products - featured ones in featured section, all products in recent section
      setFeaturedProducts(featured); // Show all featured products
      setRecentProducts(allProducts); // Show ALL products (not just active)
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const renderProductCard = ({ item }: { item: Product }) => {
    const timeRemaining = productService.getTimeRemaining(item.endDate);
    const isEnded = timeRemaining === 'Ended' || item.status === 'ended' || item.status === 'sold';
    
    return (
      <TouchableOpacity
        style={styles.productCard}
        onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}
      >
        <View>
          <Image
            source={{ uri: getFirstImageUrl(item.images) }}
            style={[styles.productImage, isEnded && styles.productImageEnded]}
          />
          {isEnded && (
            <View style={styles.endedOverlay}>
              <Text style={styles.endedText}>ENDED</Text>
            </View>
          )}
        </View>
        <View style={styles.productInfo}>
          <Text style={styles.productTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.productPrice}>
            {productService.formatPrice(item.currentPrice)}
          </Text>
          <View style={styles.productMeta}>
            <Text style={styles.productBids}>{item.totalBids} bids</Text>
            <Text style={[styles.productTime, isEnded && styles.productTimeEnded]}>
              {timeRemaining}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderHorizontalProduct = ({ item }: { item: Product }) => {
    const timeRemaining = productService.getTimeRemaining(item.endDate);
    const isEnded = timeRemaining === 'Ended' || item.status === 'ended' || item.status === 'sold';
    
    return (
      <TouchableOpacity
        style={styles.featuredCard}
        onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}
      >
        <View>
          <Image
            source={{ uri: getFirstImageUrl(item.images) }}
            style={[styles.featuredImage, isEnded && styles.productImageEnded]}
          />
          {!isEnded && (
            <View style={styles.featuredBadge}>
              <Text style={styles.featuredBadgeText}>Featured</Text>
            </View>
          )}
          {isEnded && (
            <View style={styles.endedOverlay}>
              <Text style={styles.endedText}>ENDED</Text>
            </View>
          )}
        </View>
        <View style={styles.featuredInfo}>
          <Text style={styles.featuredTitle} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={styles.featuredPrice}>
            {productService.formatPrice(item.currentPrice)}
          </Text>
          <Text style={[styles.timeText, isEnded && styles.productTimeEnded]}>
            {timeRemaining}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#667eea" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.userName}>
              {user?.firstName || 'Guest'} 👋
            </Text>
          </View>
          <TouchableOpacity style={styles.balanceContainer}>
            <Text style={styles.balanceLabel}>Balance</Text>
            <Text style={styles.balanceAmount}>
              {productService.formatPrice(user?.balance || 0)}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <TouchableOpacity
          style={styles.searchBar}
          onPress={() => navigation.navigate('Products')}
        >
          <Text style={styles.searchPlaceholder}>🔍 Search for products...</Text>
        </TouchableOpacity>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => navigation.navigate('Tracking')}
          >
            <Text style={styles.quickActionIcon}>📦</Text>
            <Text style={styles.quickActionText}>Track Order</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => navigation.navigate('Orders')}
          >
            <Text style={styles.quickActionIcon}>📋</Text>
            <Text style={styles.quickActionText}>My Orders</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => navigation.navigate('MyBids')}
          >
            <Text style={styles.quickActionIcon}>🎯</Text>
            <Text style={styles.quickActionText}>My Bids</Text>
          </TouchableOpacity>
        </View>

        {/* Debug Auth Button - Remove this in production */}
        <TouchableOpacity
          style={[styles.searchBar, { backgroundColor: '#f0f0f0', marginTop: 10 }]}
          onPress={async () => {
            await testAuthToken();
          }}
        >
          <Text style={styles.searchPlaceholder}>🔧 Test Auth Token</Text>
        </TouchableOpacity>

        {/* Categories */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Categories</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {['Electronics', 'Fashion', 'Vehicles', 'Home', 'Sports'].map((cat) => (
              <TouchableOpacity key={cat} style={styles.categoryCard}>
                <Text style={styles.categoryEmoji}>
                  {cat === 'Electronics' ? '📱' : 
                   cat === 'Fashion' ? '👗' :
                   cat === 'Vehicles' ? '🚗' :
                   cat === 'Home' ? '🏠' : '⚽'}
                </Text>
                <Text style={styles.categoryName}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Featured Products */}
        {featuredProducts.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>✨ Featured Auctions</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Products')}>
                <Text style={styles.seeAll}>See All →</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              horizontal
              data={featuredProducts}
              renderItem={renderHorizontalProduct}
              keyExtractor={(item) => item.id || ''}
              showsHorizontalScrollIndicator={false}
            />
          </View>
        )}

        {/* Recent Products */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>🔥 Active Auctions</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Products')}>
              <Text style={styles.seeAll}>See All →</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.productsGrid}>
            {recentProducts.map((product) => (
              <View key={product.id} style={styles.gridItem}>
                {renderProductCard({ item: product })}
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  greeting: {
    fontSize: 14,
    color: '#718096',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a202c',
    marginTop: 4,
  },
  balanceContainer: {
    backgroundColor: '#667eea',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  balanceLabel: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.9,
  },
  balanceAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  searchBar: {
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  searchPlaceholder: {
    color: '#a0aec0',
    fontSize: 16,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  quickActionButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    minWidth: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  quickActionIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 12,
    color: '#4a5568',
    fontWeight: '500',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a202c',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  seeAll: {
    fontSize: 14,
    color: '#667eea',
    fontWeight: '600',
  },
  categoryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginLeft: 12,
    alignItems: 'center',
    minWidth: 80,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryEmoji: {
    fontSize: 24,
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 12,
    color: '#4a5568',
    fontWeight: '500',
  },
  featuredCard: {
    width: 200,
    marginLeft: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  featuredImage: {
    width: '100%',
    height: 150,
    backgroundColor: '#f0f0f0',
  },
  featuredBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#667eea',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  featuredBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  featuredInfo: {
    padding: 12,
  },
  featuredTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a202c',
    marginBottom: 4,
  },
  featuredPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#667eea',
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 14,
  },
  gridItem: {
    width: '50%',
    padding: 6,
  },
  productCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  productImage: {
    width: '100%',
    height: 120,
    backgroundColor: '#f0f0f0',
  },
  productInfo: {
    padding: 12,
  },
  productTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a202c',
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#667eea',
    marginBottom: 4,
  },
  productMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  productBids: {
    fontSize: 12,
    color: '#718096',
  },
  productTime: {
    fontSize: 12,
    color: '#e53e3e',
    fontWeight: '500',
  },
  productImageEnded: {
    opacity: 0.6,
  },
  productTimeEnded: {
    color: '#718096',
  },
  endedOverlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -40 }, { translateY: -15 }],
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  endedText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  timeText: {
    fontSize: 12,
    color: '#718096',
    marginTop: 4,
  },
});