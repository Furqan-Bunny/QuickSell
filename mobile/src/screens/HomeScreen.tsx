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
      const [featured, recent] = await Promise.all([
        productService.getProducts({ featured: true, status: 'active' }),
        productService.getProducts({ status: 'active' })
      ]);
      
      setFeaturedProducts(featured.slice(0, 5));
      setRecentProducts(recent.slice(0, 10));
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

  const renderProductCard = ({ item }: { item: Product }) => (
    <TouchableOpacity
      style={styles.productCard}
      onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}
    >
      <Image
        source={{ uri: getFirstImageUrl(item.images) }}
        style={styles.productImage}
      />
      <View style={styles.productInfo}>
        <Text style={styles.productTitle} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.productPrice}>
          {productService.formatPrice(item.currentPrice)}
        </Text>
        <View style={styles.productMeta}>
          <Text style={styles.productBids}>{item.totalBids} bids</Text>
          <Text style={styles.productTime}>
            {productService.getTimeRemaining(item.endDate)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderHorizontalProduct = ({ item }: { item: Product }) => (
    <TouchableOpacity
      style={styles.featuredCard}
      onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}
    >
      <Image
        source={{ uri: getFirstImageUrl(item.images) }}
        style={styles.featuredImage}
      />
      <View style={styles.featuredBadge}>
        <Text style={styles.featuredBadgeText}>Featured</Text>
      </View>
      <View style={styles.featuredInfo}>
        <Text style={styles.featuredTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.featuredPrice}>
          {productService.formatPrice(item.currentPrice)}
        </Text>
      </View>
    </TouchableOpacity>
  );

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
});