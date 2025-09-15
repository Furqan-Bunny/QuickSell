import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import apiService, { shippingAPI } from '../services/apiService';

interface TrackingEvent {
  code: string;
  description: string;
  office: string;
  officeCode: string;
  timestamp: string;
  status: string;
}

interface TrackingInfo {
  trackingNumber: string;
  weight: number;
  origin: {
    country: string;
    code: string;
  };
  destination: {
    country: string;
    code: string;
  };
  characteristics: {
    express: boolean;
    insured: {
      amount: number;
      currency: string;
    };
  };
  events: TrackingEvent[];
  currentStatus: string;
  lastUpdate: string | null;
}

export default function TrackingScreen({ navigation, route }: any) {
  const [trackingNumber, setTrackingNumber] = useState(route.params?.trackingNumber || '');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [trackingInfo, setTrackingInfo] = useState<TrackingInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (trackingNumber) {
      fetchTrackingInfo();
    }
  }, []);

  const fetchTrackingInfo = async () => {
    if (!trackingNumber.trim()) {
      Alert.alert('Error', 'Please enter a tracking number');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await shippingAPI.trackShipment(trackingNumber);
      if (response.success && response.data.items.length > 0) {
        setTrackingInfo(response.data.items[0]);
      } else {
        setError('No tracking information found for this number');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch tracking information');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchTrackingInfo();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Order Shipped':
      case 'In Transit':
        return { name: 'truck-delivery', color: '#3b82f6' };
      case 'Delivered':
        return { name: 'check-circle', color: '#10b981' };
      case 'Order Cancelled':
        return { name: 'close-circle', color: '#ef4444' };
      case 'At Delivery Hub':
      case 'Out for Delivery':
        return { name: 'map-marker', color: '#6366f1' };
      case 'On Hold':
      case 'Delivery Attempted':
        return { name: 'alert-circle', color: '#f59e0b' };
      default:
        return { name: 'clock-outline', color: '#6b7280' };
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Order Shipped':
      case 'In Transit':
        return '#dbeafe';
      case 'Delivered':
        return '#d1fae5';
      case 'Order Cancelled':
        return '#fee2e2';
      case 'At Delivery Hub':
      case 'Out for Delivery':
        return '#e0e7ff';
      case 'On Hold':
      case 'Delivery Attempted':
        return '#fed7aa';
      default:
        return '#f3f4f6';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderTrackingInfo = () => {
    if (!trackingInfo) return null;

    const statusIcon = getStatusIcon(trackingInfo.currentStatus);

    return (
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Current Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <Icon name={statusIcon.name} size={32} color={statusIcon.color} />
            <View style={styles.statusInfo}>
              <Text style={styles.statusTitle}>Current Status</Text>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: getStatusColor(trackingInfo.currentStatus) },
                ]}
              >
                <Text style={[styles.statusText, { color: statusIcon.color }]}>
                  {trackingInfo.currentStatus}
                </Text>
              </View>
            </View>
          </View>
          {trackingInfo.lastUpdate && (
            <Text style={styles.lastUpdate}>
              Last updated: {formatDate(trackingInfo.lastUpdate)}
            </Text>
          )}
        </View>

        {/* Shipment Details */}
        <View style={styles.detailsCard}>
          <Text style={styles.cardTitle}>Shipment Details</Text>
          <View style={styles.detailsGrid}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Tracking Number</Text>
              <Text style={styles.detailValue}>{trackingInfo.trackingNumber}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Weight</Text>
              <Text style={styles.detailValue}>{trackingInfo.weight} kg</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Origin</Text>
              <Text style={styles.detailValue}>{trackingInfo.origin.country}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Destination</Text>
              <Text style={styles.detailValue}>{trackingInfo.destination.country}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Service Type</Text>
              <Text style={styles.detailValue}>
                {trackingInfo.characteristics.express ? 'Express' : 'Standard'}
              </Text>
            </View>
            {trackingInfo.characteristics.insured.amount > 0 && (
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Insured Value</Text>
                <Text style={styles.detailValue}>
                  {trackingInfo.characteristics.insured.currency}{' '}
                  {trackingInfo.characteristics.insured.amount}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Tracking Timeline */}
        <View style={styles.timelineCard}>
          <Text style={styles.cardTitle}>Tracking History</Text>
          {trackingInfo.events.map((event, index) => {
            const eventIcon = getStatusIcon(event.status);
            const isLast = index === trackingInfo.events.length - 1;

            return (
              <View key={index} style={styles.timelineItem}>
                <View style={styles.timelineLeft}>
                  <View
                    style={[
                      styles.timelineIconContainer,
                      { backgroundColor: getStatusColor(event.status) },
                    ]}
                  >
                    <Icon name={eventIcon.name} size={20} color={eventIcon.color} />
                  </View>
                  {!isLast && <View style={styles.timelineLine} />}
                </View>
                <View style={styles.timelineContent}>
                  <Text style={styles.eventDescription}>{event.description}</Text>
                  <Text style={styles.eventLocation}>
                    {event.office} • {event.officeCode}
                  </Text>
                  <Text style={styles.eventTime}>{formatDate(event.timestamp)}</Text>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color="#1a202c" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Track Shipment</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Icon name="magnify" size={24} color="#6b7280" />
          <TextInput
            style={styles.searchInput}
            placeholder="Enter tracking number"
            value={trackingNumber}
            onChangeText={setTrackingNumber}
            onSubmitEditing={fetchTrackingInfo}
            autoCapitalize="characters"
          />
        </View>
        <TouchableOpacity style={styles.searchButton} onPress={fetchTrackingInfo}>
          <Text style={styles.searchButtonText}>Track</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#667eea" />
          <Text style={styles.loadingText}>Fetching tracking information...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <Icon name="alert-circle-outline" size={48} color="#ef4444" />
          <Text style={styles.errorTitle}>Tracking Error</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchTrackingInfo}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : trackingInfo ? (
        renderTrackingInfo()
      ) : (
        <View style={styles.centerContainer}>
          <Icon name="truck-delivery-outline" size={48} color="#6b7280" />
          <Text style={styles.emptyTitle}>No Tracking Info</Text>
          <Text style={styles.emptyText}>Enter a tracking number to get started</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a202c',
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1a202c',
    paddingVertical: 12,
    marginLeft: 8,
  },
  searchButton: {
    backgroundColor: '#667eea',
    borderRadius: 12,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  searchButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a202c',
    marginTop: 12,
  },
  errorText: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 20,
    backgroundColor: '#667eea',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a202c',
    marginTop: 12,
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
  },
  statusCard: {
    backgroundColor: '#fff',
    margin: 20,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusInfo: {
    marginLeft: 16,
    flex: 1,
  },
  statusTitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  lastUpdate: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 12,
  },
  detailsCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a202c',
    marginBottom: 16,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
  },
  detailItem: {
    width: '50%',
    paddingHorizontal: 8,
    marginBottom: 16,
  },
  detailLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1a202c',
  },
  timelineCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  timelineLeft: {
    alignItems: 'center',
    marginRight: 16,
  },
  timelineIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timelineLine: {
    position: 'absolute',
    top: 40,
    width: 2,
    height: 48,
    backgroundColor: '#e5e7eb',
  },
  timelineContent: {
    flex: 1,
  },
  eventDescription: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1a202c',
    marginBottom: 4,
  },
  eventLocation: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 2,
  },
  eventTime: {
    fontSize: 12,
    color: '#9ca3af',
  },
});