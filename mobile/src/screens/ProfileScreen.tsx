import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import authService from '../services/authService';
import productService from '../services/productService';

export default function ProfileScreen({ navigation }: any) {
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState({
    activeBids: 0,
    wonAuctions: 0,
    watchlist: 0
  });

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    const userData = await authService.getCurrentUser();
    setUser(userData);
    
    if (userData) {
      // Load user statistics
      const bids = await productService.getUserBids(userData.uid);
      setStats({
        activeBids: bids.filter((b: any) => b.status === 'winning').length,
        wonAuctions: bids.filter((b: any) => b.status === 'won').length,
        watchlist: 0
      });
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          onPress: async () => {
            await authService.logout();
            // Navigation will be handled by auth state change
          },
          style: 'destructive'
        }
      ]
    );
  };

  const menuItems = [
    { icon: '🏷️', title: 'My Bids', subtitle: 'View your bidding history', screen: 'MyBids' },
    { icon: '🏆', title: 'Won Auctions', subtitle: 'Items you\'ve won', screen: 'WonAuctions' },
    { icon: '❤️', title: 'Watchlist', subtitle: 'Saved items', screen: 'Watchlist' },
    { icon: '💰', title: 'Balance', subtitle: 'Manage your wallet', screen: 'Balance' },
    { icon: '⚙️', title: 'Settings', subtitle: 'Account preferences', screen: 'Settings' },
    { icon: '❓', title: 'Help & Support', subtitle: 'Get assistance', screen: 'Help' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.header}>
          <View style={styles.profileSection}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.userName}>
                {user?.firstName} {user?.lastName}
              </Text>
              <Text style={styles.userEmail}>{user?.email}</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {user?.role === 'admin' ? 'Admin' : 'Buyer'}
                </Text>
              </View>
            </View>
          </View>

          {/* Balance Card */}
          <View style={styles.balanceCard}>
            <Text style={styles.balanceLabel}>Available Balance</Text>
            <Text style={styles.balanceAmount}>
              {productService.formatPrice(user?.balance || 0)}
            </Text>
            <TouchableOpacity style={styles.addFundsButton}>
              <Text style={styles.addFundsText}>+ Add Funds</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.activeBids}</Text>
            <Text style={styles.statLabel}>Active Bids</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.wonAuctions}</Text>
            <Text style={styles.statLabel}>Won</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.watchlist}</Text>
            <Text style={styles.statLabel}>Watching</Text>
          </View>
        </View>

        {/* Menu Items */}
        <View style={styles.menuContainer}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.menuItem}
              onPress={() => {
                if (item.screen === 'MyBids') {
                  navigation.navigate('MyBids');
                } else {
                  Alert.alert('Coming Soon', `${item.title} feature is coming soon!`);
                }
              }}
            >
              <View style={styles.menuIcon}>
                <Text style={styles.menuIconText}>{item.icon}</Text>
              </View>
              <View style={styles.menuContent}>
                <Text style={styles.menuTitle}>{item.title}</Text>
                <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
              </View>
              <Text style={styles.menuArrow}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appVersion}>Quicksell v1.0.0</Text>
          <Text style={styles.appCopyright}>© 2025 Quicksell Auctions</Text>
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
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a202c',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 14,
    color: '#718096',
    marginBottom: 8,
  },
  badge: {
    backgroundColor: '#edf2f7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: 12,
    color: '#4a5568',
    fontWeight: '600',
  },
  balanceCard: {
    backgroundColor: '#667eea',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  addFundsButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  addFundsText: {
    color: '#667eea',
    fontWeight: 'bold',
    fontSize: 14,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginTop: 2,
    paddingVertical: 20,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a202c',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#718096',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#e2e8f0',
  },
  menuContainer: {
    backgroundColor: '#fff',
    marginTop: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f7fafc',
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f7fafc',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuIconText: {
    fontSize: 20,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a202c',
    marginBottom: 2,
  },
  menuSubtitle: {
    fontSize: 12,
    color: '#718096',
  },
  menuArrow: {
    fontSize: 24,
    color: '#cbd5e0',
  },
  logoutButton: {
    backgroundColor: '#fff',
    marginTop: 12,
    marginHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e53e3e',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#e53e3e',
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  appVersion: {
    fontSize: 12,
    color: '#a0aec0',
    marginBottom: 4,
  },
  appCopyright: {
    fontSize: 12,
    color: '#a0aec0',
  },
});