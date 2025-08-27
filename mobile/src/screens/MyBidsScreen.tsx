import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import productService, { Bid } from '../services/productService';
import authService from '../services/authService';

export default function MyBidsScreen({ navigation }: any) {
  const [bids, setBids] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all'); // all, winning, outbid, won

  useEffect(() => {
    loadBids();
  }, []);

  const loadBids = async () => {
    try {
      const user = await authService.getCurrentUser();
      if (user) {
        const userBids = await productService.getUserBids(user.uid);
        // In a real app, you'd also fetch product details for each bid
        setBids(userBids);
      }
    } catch (error) {
      console.error('Error loading bids:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadBids();
  };

  const getFilteredBids = () => {
    if (filter === 'all') return bids;
    return bids.filter(bid => bid.status === filter);
  };

  const renderBid = ({ item }: { item: any }) => {
    const statusColor = 
      item.status === 'winning' ? '#48bb78' :
      item.status === 'outbid' ? '#ed8936' :
      item.status === 'won' ? '#667eea' : '#718096';

    return (
      <TouchableOpacity
        style={styles.bidCard}
        onPress={() => navigation.navigate('ProductDetail', { productId: item.productId })}
      >
        <Image
          source={{ uri: 'https://via.placeholder.com/80' }}
          style={styles.productImage}
        />
        <View style={styles.bidInfo}>
          <Text style={styles.productTitle} numberOfLines={1}>
            Product #{item.productId}
          </Text>
          <Text style={styles.bidAmount}>
            Your bid: {productService.formatPrice(item.amount)}
          </Text>
          <View style={styles.statusContainer}>
            <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
              <Text style={[styles.statusText, { color: statusColor }]}>
                {item.status.toUpperCase()}
              </Text>
            </View>
            <Text style={styles.bidTime}>
              {new Date(item.placedAt?.toDate ? item.placedAt.toDate() : item.placedAt).toLocaleDateString()}
            </Text>
          </View>
        </View>
        <Text style={styles.arrow}>›</Text>
      </TouchableOpacity>
    );
  };

  const filters = [
    { id: 'all', label: 'All', count: bids.length },
    { id: 'winning', label: 'Winning', count: bids.filter(b => b.status === 'winning').length },
    { id: 'outbid', label: 'Outbid', count: bids.filter(b => b.status === 'outbid').length },
    { id: 'won', label: 'Won', count: bids.filter(b => b.status === 'won').length },
  ];

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#667eea" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        {filters.map((f) => (
          <TouchableOpacity
            key={f.id}
            style={[styles.filterTab, filter === f.id && styles.filterTabActive]}
            onPress={() => setFilter(f.id)}
          >
            <Text style={[styles.filterText, filter === f.id && styles.filterTextActive]}>
              {f.label}
            </Text>
            {f.count > 0 && (
              <View style={[styles.filterCount, filter === f.id && styles.filterCountActive]}>
                <Text style={[styles.filterCountText, filter === f.id && styles.filterCountTextActive]}>
                  {f.count}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Bids List */}
      <FlatList
        data={getFilteredBids()}
        renderItem={renderBid}
        keyExtractor={(item, index) => index.toString()}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🎯</Text>
            <Text style={styles.emptyText}>No bids found</Text>
            <Text style={styles.emptySubtext}>
              Start bidding on products to see them here
            </Text>
            <TouchableOpacity
              style={styles.browseButton}
              onPress={() => navigation.navigate('Products')}
            >
              <Text style={styles.browseButtonText}>Browse Products</Text>
            </TouchableOpacity>
          </View>
        }
      />
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
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
    paddingVertical: 4,
  },
  filterTabActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#667eea',
  },
  filterText: {
    fontSize: 14,
    color: '#718096',
    fontWeight: '500',
  },
  filterTextActive: {
    color: '#667eea',
  },
  filterCount: {
    marginLeft: 6,
    backgroundColor: '#e2e8f0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  filterCountActive: {
    backgroundColor: '#667eea',
  },
  filterCountText: {
    fontSize: 11,
    color: '#4a5568',
    fontWeight: 'bold',
  },
  filterCountTextActive: {
    color: '#fff',
  },
  listContainer: {
    paddingVertical: 8,
  },
  bidCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    marginRight: 12,
  },
  bidInfo: {
    flex: 1,
  },
  productTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a202c',
    marginBottom: 4,
  },
  bidAmount: {
    fontSize: 14,
    color: '#4a5568',
    marginBottom: 8,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  bidTime: {
    fontSize: 12,
    color: '#a0aec0',
  },
  arrow: {
    fontSize: 24,
    color: '#cbd5e0',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a202c',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#718096',
    marginBottom: 20,
    textAlign: 'center',
  },
  browseButton: {
    backgroundColor: '#667eea',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  browseButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});