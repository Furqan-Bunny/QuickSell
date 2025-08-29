import axios from 'axios'

export interface Notification {
  id: string
  type: 'bid' | 'outbid' | 'won' | 'lost' | 'price_alert' | 'system' | 'reminder' | 'welcome' | 'payment' | 'shipping' | 'withdrawal'
  title: string
  message: string
  timestamp: any
  read: boolean
  priority: 'low' | 'medium' | 'high' | 'urgent'
  actionUrl?: string
  actionLabel?: string
  metadata?: {
    productId?: string
    productTitle?: string
    amount?: number
    orderId?: string
    imageUrl?: string
    withdrawalId?: string
  }
}

class NotificationService {
  private notifications: Notification[] = []
  private listeners: ((notifications: Notification[]) => void)[] = []

  constructor() {
    // Load notifications from localStorage on init
    const stored = localStorage.getItem('notifications')
    if (stored) {
      try {
        this.notifications = JSON.parse(stored)
      } catch (error) {
        console.error('Error loading notifications:', error)
        this.notifications = []
      }
    }
  }

  // Subscribe to notification changes
  subscribe(listener: (notifications: Notification[]) => void) {
    this.listeners.push(listener)
    // Immediately call with current notifications
    listener(this.notifications)
    
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener)
    }
  }

  // Notify all listeners of changes
  private notifyListeners() {
    localStorage.setItem('notifications', JSON.stringify(this.notifications))
    this.listeners.forEach(listener => listener(this.notifications))
  }

  // Get all notifications
  getNotifications(): Notification[] {
    return this.notifications
  }

  // Get unread count
  getUnreadCount(): number {
    return this.notifications.filter(n => !n.read).length
  }

  // Add a new notification
  addNotification(notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) {
    const newNotification: Notification = {
      ...notification,
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      read: false
    }
    
    this.notifications.unshift(newNotification)
    this.notifyListeners()
    
    return newNotification
  }

  // Mark notification as read
  markAsRead(notificationId: string) {
    const notification = this.notifications.find(n => n.id === notificationId)
    if (notification && !notification.read) {
      notification.read = true
      this.notifyListeners()
    }
  }

  // Mark all as read
  markAllAsRead() {
    let hasUnread = false
    this.notifications.forEach(n => {
      if (!n.read) {
        n.read = true
        hasUnread = true
      }
    })
    
    if (hasUnread) {
      this.notifyListeners()
    }
  }

  // Delete notification
  deleteNotification(notificationId: string) {
    const index = this.notifications.findIndex(n => n.id === notificationId)
    if (index !== -1) {
      this.notifications.splice(index, 1)
      this.notifyListeners()
    }
  }

  // Clear all read notifications
  clearReadNotifications() {
    this.notifications = this.notifications.filter(n => !n.read)
    this.notifyListeners()
  }

  // Clear all notifications
  clearAllNotifications() {
    this.notifications = []
    this.notifyListeners()
  }

  // Fetch notifications from API (if backend endpoint exists)
  async fetchNotifications(userId: string) {
    try {
      const response = await axios.get(`/api/notifications/user/${userId}`)
      if (response.data.success) {
        this.notifications = response.data.data
        this.notifyListeners()
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
      // Use local notifications if API fails
    }
  }

  // Create notifications for common events
  createBidNotification(productTitle: string, amount: number, productId: string) {
    return this.addNotification({
      type: 'bid',
      title: 'Bid Placed Successfully',
      message: `Your bid of R${amount} has been placed on ${productTitle}`,
      priority: 'medium',
      actionUrl: `/products/${productId}`,
      actionLabel: 'View Auction',
      metadata: {
        productId,
        productTitle,
        amount
      }
    })
  }

  createOutbidNotification(productTitle: string, newAmount: number, productId: string) {
    return this.addNotification({
      type: 'outbid',
      title: 'You have been outbid!',
      message: `Someone has placed a higher bid on ${productTitle}. Current price: R${newAmount}`,
      priority: 'high',
      actionUrl: `/products/${productId}`,
      actionLabel: 'Place New Bid',
      metadata: {
        productId,
        productTitle,
        amount: newAmount
      }
    })
  }

  createWonNotification(productTitle: string, amount: number, orderId: string) {
    return this.addNotification({
      type: 'won',
      title: 'Congratulations! You won!',
      message: `You won the auction for ${productTitle} for R${amount}. Complete your payment to secure the item.`,
      priority: 'urgent',
      actionUrl: `/orders/${orderId}`,
      actionLabel: 'Complete Payment',
      metadata: {
        orderId,
        productTitle,
        amount
      }
    })
  }

  createWithdrawalNotification(type: 'requested' | 'approved' | 'rejected', amount: number, withdrawalId?: string) {
    const messages = {
      requested: {
        title: 'Withdrawal Request Submitted',
        message: `Your withdrawal request for R${amount} has been submitted and is pending approval.`,
        priority: 'medium' as const
      },
      approved: {
        title: 'Withdrawal Approved!',
        message: `Your withdrawal of R${amount} has been approved and will be processed within 1-2 business days.`,
        priority: 'high' as const
      },
      rejected: {
        title: 'Withdrawal Rejected',
        message: `Your withdrawal request for R${amount} has been rejected. Please check your email for details.`,
        priority: 'high' as const
      }
    }

    const notification = messages[type]
    
    return this.addNotification({
      type: 'withdrawal',
      title: notification.title,
      message: notification.message,
      priority: notification.priority,
      actionUrl: '/withdrawals',
      actionLabel: 'View Details',
      metadata: {
        amount,
        withdrawalId
      }
    })
  }
}

// Create singleton instance
const notificationService = new NotificationService()

export default notificationService