import React, { useState, useEffect } from 'react';
import { FiMail, FiUsers, FiGift, FiSend, FiCheck, FiClock, FiDollarSign } from 'react-icons/fi';
import affiliateService, { Invitation, AffiliateStats } from '../services/affiliateService';
import { useAuthStore } from '../store/authStore';
import { toast } from 'react-hot-toast';

const Affiliate: React.FC = () => {
  const { user } = useAuthStore();
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

  useEffect(() => {
    loadData();
  }, []);

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
      toast.error('Failed to load affiliate data');
    } finally {
      setLoading(false);
    }
  };

  const handleSendInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast.error('Please enter an email address');
      return;
    }

    setSending(true);
    try {
      await affiliateService.sendInvitation(email, name);
      toast.success('Invitation sent successfully!');
      setEmail('');
      setName('');
      loadData(); // Reload data
    } catch (error: any) {
      toast.error(error.message || 'Failed to send invitation');
    } finally {
      setSending(false);
    }
  };

  const copyReferralLink = () => {
    const referralLink = `${window.location.origin}/signup?ref=${user?.uid}`;
    navigator.clipboard.writeText(referralLink);
    toast.success('Referral link copied to clipboard!');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Affiliate Program</h1>
        <p className="mt-2 text-gray-600">
          Invite friends to join Quicksell and earn R5 for each successful signup!
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Invitations</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalInvitations}</p>
            </div>
            <FiMail className="text-3xl text-indigo-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
            </div>
            <FiClock className="text-3xl text-yellow-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
            </div>
            <FiCheck className="text-3xl text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Earned</p>
              <p className="text-2xl font-bold text-green-600">
                {affiliateService.formatCurrency(stats.totalEarned)}
              </p>
            </div>
            <FiDollarSign className="text-3xl text-green-600" />
          </div>
        </div>
      </div>

      {/* Invitation Form */}
      <div className="bg-white rounded-lg shadow mb-8">
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <FiSend className="mr-2" />
            Send Invitation
          </h2>
          
          <form onSubmit={handleSendInvitation}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="friend@example.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name (Optional)
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Friend's name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>
            
            <div className="mt-4 flex items-center gap-4">
              <button
                type="submit"
                disabled={sending}
                className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {sending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    <FiSend className="mr-2" />
                    Send Invitation
                  </>
                )}
              </button>
              
              <button
                type="button"
                onClick={copyReferralLink}
                className="px-6 py-2 border border-gray-300 rounded-md hover:bg-gray-50 flex items-center"
              >
                <FiGift className="mr-2" />
                Copy Referral Link
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Invitations List */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <FiUsers className="mr-2" />
            Your Invitations
          </h2>
          
          {invitations.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FiMail className="mx-auto text-4xl mb-2" />
              <p>No invitations sent yet</p>
              <p className="text-sm mt-1">Start inviting friends to earn rewards!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Invitee
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sent Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Expires In
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Reward
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {invitations.map((invitation) => (
                    <tr key={invitation.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {invitation.inviteeEmail}
                          </p>
                          {invitation.inviteeName && (
                            <p className="text-sm text-gray-500">{invitation.inviteeName}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {invitation.status === 'pending' && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            <FiClock className="mr-1" />
                            Pending
                          </span>
                        )}
                        {invitation.status === 'completed' && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <FiCheck className="mr-1" />
                            Completed
                          </span>
                        )}
                        {invitation.status === 'expired' && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            Expired
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {affiliateService.formatDate(invitation.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {invitation.status === 'pending' ? (
                          <span>{affiliateService.getDaysUntilExpiry(invitation.expiresAt)} days</span>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium">
                        {invitation.status === 'completed' ? (
                          <span className="text-green-600">
                            {affiliateService.formatCurrency(invitation.reward)}
                          </span>
                        ) : (
                          <span className="text-gray-400">
                            {affiliateService.formatCurrency(invitation.reward)}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* How It Works */}
      <div className="mt-8 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">How It Works</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-start">
            <div className="flex-shrink-0 bg-indigo-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">
              1
            </div>
            <div className="ml-3">
              <p className="font-medium">Send Invitation</p>
              <p className="text-sm text-gray-600">
                Enter your friend's email and send them an invitation
              </p>
            </div>
          </div>
          
          <div className="flex items-start">
            <div className="flex-shrink-0 bg-indigo-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">
              2
            </div>
            <div className="ml-3">
              <p className="font-medium">Friend Signs Up</p>
              <p className="text-sm text-gray-600">
                Your friend creates an account using the invitation link
              </p>
            </div>
          </div>
          
          <div className="flex items-start">
            <div className="flex-shrink-0 bg-indigo-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">
              3
            </div>
            <div className="ml-3">
              <p className="font-medium">Earn R5</p>
              <p className="text-sm text-gray-600">
                You receive R5 in your account balance instantly
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Affiliate;