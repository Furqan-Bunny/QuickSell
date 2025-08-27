import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Share
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { SafeAreaView } from 'react-native-safe-area-context';
import affiliateService, { Invitation, AffiliateStats } from '../services/affiliateService';
import authService from '../services/authService';

export default function AffiliateScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [sending, setSending] = useState(false);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [stats, setStats] = useState<AffiliateStats>({
    totalInvitations: 0,
    pending: 0,
    completed: 0,
    totalEarned: 0
  });
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
      const [invitationsData, statsData] = await Promise.all([
        affiliateService.getInvitations(),
        affiliateService.getStats()
      ]);
      setInvitations(invitationsData);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading affiliate data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleSendInvitation = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter an email address');
      return;
    }

    setSending(true);
    try {
      await affiliateService.sendInvitation(email, name);
      Alert.alert('Success', 'Invitation sent successfully!');
      setEmail('');
      setName('');
      loadData();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to send invitation');
    } finally {
      setSending(false);
    }
  };

  const copyReferralLink = async () => {
    if (user?.uid) {
      const referralLink = affiliateService.getReferralLink(user.uid);
      await Clipboard.setStringAsync(referralLink);
      Alert.alert('Copied!', 'Referral link copied to clipboard');
    }
  };

  const shareReferralLink = () => {
    if (user?.uid) {
      const referralLink = affiliateService.getReferralLink(user.uid);
      Share.share({
        title: 'Join Quicksell',
        message: `Join me on Quicksell - South Africa's premier auction marketplace! Sign up using my link and I'll get R5 as a thank you bonus: ${referralLink}`,
        url: referralLink
      });
    }
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
          <Text style={styles.title}>Invite Friends & Earn</Text>
          <Text style={styles.subtitle}>
            Earn R5 for each friend who joins Quicksell!
          </Text>
        </View>

        {/* Stats Cards */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.totalInvitations}</Text>
            <Text style={styles.statLabel}>Total Invites</Text>
          </View>
          
          <View style={[styles.statCard, styles.statCardYellow]}>
            <Text style={styles.statValue}>{stats.pending}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
          
          <View style={[styles.statCard, styles.statCardGreen]}>
            <Text style={styles.statValue}>{stats.completed}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
          
          <View style={[styles.statCard, styles.statCardPurple]}>
            <Text style={[styles.statValue, styles.currencyValue]}>
              R{stats.totalEarned}
            </Text>
            <Text style={styles.statLabel}>Earned</Text>
          </View>
        </ScrollView>

        {/* Invitation Form */}
        <View style={styles.formContainer}>
          <Text style={styles.sectionTitle}>Send Invitation</Text>
          
          <TextInput
            style={styles.input}
            placeholder="Friend's email address"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          
          <TextInput
            style={styles.input}
            placeholder="Friend's name (optional)"
            value={name}
            onChangeText={setName}
          />
          
          <TouchableOpacity
            style={[styles.sendButton, sending && styles.buttonDisabled]}
            onPress={handleSendInvitation}
            disabled={sending}
          >
            {sending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.sendButtonText}>Send Invitation</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Share Options */}
        <View style={styles.shareContainer}>
          <Text style={styles.sectionTitle}>Share Your Link</Text>
          
          <View style={styles.shareButtons}>
            <TouchableOpacity style={styles.shareButton} onPress={copyReferralLink}>
              <Text style={styles.shareIcon}>📋</Text>
              <Text style={styles.shareButtonText}>Copy Link</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.shareButton} onPress={shareReferralLink}>
              <Text style={styles.shareIcon}>🔗</Text>
              <Text style={styles.shareButtonText}>Share Link</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Invitations List */}
        <View style={styles.invitationsContainer}>
          <Text style={styles.sectionTitle}>Your Invitations</Text>
          
          {invitations.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📧</Text>
              <Text style={styles.emptyText}>No invitations sent yet</Text>
              <Text style={styles.emptySubtext}>
                Start inviting friends to earn rewards!
              </Text>
            </View>
          ) : (
            invitations.map((invitation) => (
              <View key={invitation.id} style={styles.invitationCard}>
                <View style={styles.invitationHeader}>
                  <Text style={styles.inviteeEmail}>{invitation.inviteeEmail}</Text>
                  {invitation.status === 'pending' && (
                    <View style={styles.statusBadge}>
                      <Text style={styles.statusText}>Pending</Text>
                    </View>
                  )}
                  {invitation.status === 'completed' && (
                    <View style={[styles.statusBadge, styles.statusCompleted]}>
                      <Text style={styles.statusText}>Completed</Text>
                    </View>
                  )}
                </View>
                
                {invitation.inviteeName && (
                  <Text style={styles.inviteeName}>{invitation.inviteeName}</Text>
                )}
                
                <View style={styles.invitationFooter}>
                  <Text style={styles.invitationDate}>
                    Sent {affiliateService.formatDate(invitation.createdAt)}
                  </Text>
                  {invitation.status === 'pending' && (
                    <Text style={styles.expiryText}>
                      Expires in {affiliateService.getDaysUntilExpiry(invitation.expiresAt)} days
                    </Text>
                  )}
                  {invitation.status === 'completed' && (
                    <Text style={styles.rewardText}>+R{invitation.reward}</Text>
                  )}
                </View>
              </View>
            ))
          )}
        </View>

        {/* How It Works */}
        <View style={styles.howItWorks}>
          <Text style={styles.sectionTitle}>How It Works</Text>
          
          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Send Invitation</Text>
              <Text style={styles.stepDescription}>
                Enter your friend's email and send them an invitation
              </Text>
            </View>
          </View>
          
          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Friend Signs Up</Text>
              <Text style={styles.stepDescription}>
                Your friend creates an account using the invitation link
              </Text>
            </View>
          </View>
          
          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>3</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Earn R5</Text>
              <Text style={styles.stepDescription}>
                You receive R5 in your account balance instantly
              </Text>
            </View>
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
    padding: 20,
    backgroundColor: '#667eea',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#e0e7ff',
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 20,
    paddingBottom: 0,
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    minWidth: 100,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statCardYellow: {
    backgroundColor: '#fef3c7',
  },
  statCardGreen: {
    backgroundColor: '#d1fae5',
  },
  statCardPurple: {
    backgroundColor: '#e0e7ff',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a202c',
    marginBottom: 4,
  },
  currencyValue: {
    color: '#667eea',
  },
  statLabel: {
    fontSize: 12,
    color: '#718096',
  },
  formContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a202c',
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  sendButton: {
    backgroundColor: '#667eea',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  shareContainer: {
    padding: 20,
    paddingTop: 0,
  },
  shareButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  shareButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  shareIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  shareButtonText: {
    fontSize: 14,
    color: '#4a5568',
    fontWeight: '500',
  },
  invitationsContainer: {
    padding: 20,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a202c',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#718096',
  },
  invitationCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  invitationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  inviteeEmail: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a202c',
  },
  inviteeName: {
    fontSize: 14,
    color: '#718096',
    marginBottom: 8,
  },
  statusBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusCompleted: {
    backgroundColor: '#d1fae5',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#92400e',
  },
  invitationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  invitationDate: {
    fontSize: 12,
    color: '#718096',
  },
  expiryText: {
    fontSize: 12,
    color: '#dc2626',
  },
  rewardText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#059669',
  },
  howItWorks: {
    padding: 20,
    backgroundColor: '#f0f4f8',
  },
  step: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stepNumberText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a202c',
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 14,
    color: '#718096',
  },
});