import api from './api';

export interface Invitation {
  id: string;
  inviterEmail: string;
  inviterName: string;
  inviteeEmail: string;
  inviteeName?: string;
  referralCode: string;
  status: 'pending' | 'completed' | 'expired';
  reward: number;
  createdAt: Date;
  expiresAt: Date;
  completedAt?: Date;
}

export interface AffiliateStats {
  totalInvitations: number;
  pending: number;
  completed: number;
  totalEarned: number;
}

class AffiliateService {
  // Send invitation
  async sendInvitation(email: string, name?: string): Promise<{ message: string }> {
    try {
      const response = await api.post('/affiliate/invite', { email, name });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to send invitation');
    }
  }

  // Get user's invitations
  async getInvitations(): Promise<Invitation[]> {
    try {
      const response = await api.get('/affiliate/invitations');
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to fetch invitations');
    }
  }

  // Get affiliate statistics
  async getStats(): Promise<AffiliateStats> {
    try {
      const response = await api.get('/affiliate/stats');
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to fetch statistics');
    }
  }

  // Validate referral code
  async validateReferralCode(code: string): Promise<{
    valid: boolean;
    inviterName?: string;
    inviterEmail?: string;
    error?: string;
  }> {
    try {
      const response = await api.get(`/affiliate/validate/${code}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return { valid: false, error: 'Invalid referral code' };
      }
      return { valid: false, error: error.response?.data?.error || 'Failed to validate code' };
    }
  }

  // Format date
  formatDate(date: Date | string): string {
    return new Date(date).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  // Format currency
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  // Calculate days until expiry
  getDaysUntilExpiry(expiresAt: Date | string): number {
    const expiry = new Date(expiresAt);
    const now = new Date();
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  }
}

export default new AffiliateService();