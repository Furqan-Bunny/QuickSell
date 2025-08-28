import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  BellIcon,
  CheckIcon,
  TrashIcon,
  FunnelIcon,
  TrophyIcon,
  ShoppingBagIcon,
  ClockIcon,
  HeartIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  GiftIcon,
  UserIcon,
  CogIcon,
  EllipsisVerticalIcon,
  TruckIcon,
  CreditCardIcon
} from '@heroicons/react/24/outline'
import {
  BellIcon as BellIconSolid
} from '@heroicons/react/24/solid'
import { formatPrice } from '../utils/formatters'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'

interface Notification {
  id: string
  type: 'bid' | 'outbid' | 'won' | 'lost' | 'price_alert' | 'system' | 'reminder' | 'welcome' | 'payment' | 'shipping'
  title: string
  message: string
  timestamp: string
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
  }
}

const Notifications = () => {
  const { user } = useAuthStore()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [activeTab, setActiveTab] = useState('all')
  const [filterType, setFilterType] = useState('all')
  const [showMenu, setShowMenu] = useState<string | null>(null)

  useEffect(() => {
    loadNotifications()
  }, [])

  const loadNotifications = () => {
    // Mock notifications data
    const mockNotifications: Notification[] = [
      {
        id: 'notif-1',
        type: 'bid',
        title: 'Bid Placed Successfully',
        message: 'Your bid of R16,500 has been placed on iPhone 14 Pro Max 256GB',
        timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        read: false,
        priority: 'medium',
        actionUrl: '/products/1',
        actionLabel: 'View Auction',
        metadata: {
          productId: '1',
          productTitle: 'iPhone 14 Pro Max 256GB - Excellent Condition',
          amount: 16500,
          imageUrl: 'https://images.unsplash.com/photo-1678685888221-cda773a3dcdb?w=800'
        }
      },
      {
        id: 'notif-2',
        type: 'outbid',
        title: 'You have been outbid!',
        message: 'Someone has placed a higher bid on MacBook Pro M2 13". Current price: R20,500',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        read: false,
        priority: 'high',
        actionUrl: '/products/3',
        actionLabel: 'Place New Bid',
        metadata: {
          productId: '3',
          productTitle: 'MacBook Pro M2 13" - 2023 Model',
          amount: 20500,
          imageUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800'
        }
      },
      {
        id: 'notif-3',
        type: 'won',
        title: 'Congratulations! You won!',
        message: 'You won the auction for Nike Air Jordan 1 Retro High for R4,200. Complete your payment to secure the item.',
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        read: false,
        priority: 'urgent',
        actionUrl: '/orders/ORD-002',
        actionLabel: 'Complete Payment',
        metadata: {
          productId: '4',
          productTitle: 'Nike Air Jordan 1 Retro High - Size 10',
          amount: 4200,
          orderId: 'ORD-002',
          imageUrl: 'https://images.unsplash.com/photo-1600181516264-3ea807ff44b9?w=800'
        }
      },
      {
        id: 'notif-4',
        type: 'price_alert',
        title: 'Price Alert Triggered!',
        message: 'Krugerrand Gold Coin Collection price dropped to R125,000 - your target price!',
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        read: true,
        priority: 'high',
        actionUrl: '/products/5',
        actionLabel: 'View & Bid',
        metadata: {
          productId: '5',
          productTitle: 'Rare Krugerrand Gold Coin Collection - 1970s',
          amount: 125000,
          imageUrl: 'https://images.unsplash.com/photo-1610375461246-83df859d849d?w=800'
        }
      },
      {
        id: 'notif-5',
        type: 'reminder',
        title: 'Auction Ending Soon!',
        message: 'Samsung 55" 4K Smart TV auction ends in 2 hours. Current bid: R6,500',
        timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
        read: true,
        priority: 'medium',
        actionUrl: '/products/6',
        actionLabel: 'Place Bid',
        metadata: {
          productId: '6',
          productTitle: 'Samsung 55" 4K Smart TV - Crystal UHD',
          amount: 6500,
          imageUrl: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=800'
        }
      },
      {
        id: 'notif-6',
        type: 'shipping',
        title: 'Order Shipped!',
        message: 'Your order #ORD-001 has been shipped. Tracking: QS-MAC-789123',
        timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
        read: true,
        priority: 'medium',
        actionUrl: '/orders/ORD-001',
        actionLabel: 'Track Package',
        metadata: {
          orderId: 'ORD-001',
          productTitle: 'MacBook Pro M2 13" - 2023 Model'
        }
      },
      {
        id: 'notif-7',
        type: 'lost',
        title: 'Auction Ended',
        message: 'You did not win the Springboks 2023 World Cup Jersey. The winning bid was R6,500.',
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        read: true,
        priority: 'low',
        actionUrl: '/products',
        actionLabel: 'Find Similar',
        metadata: {
          productId: '7',
          productTitle: 'Springboks 2023 World Cup Jersey - Signed',
          amount: 6500
        }
      },
      {
        id: 'notif-8',
        type: 'system',
        title: 'Profile Updated',
        message: 'Your profile information has been successfully updated.',
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        read: true,
        priority: 'low',
        actionUrl: '/profile',
        actionLabel: 'View Profile'
      },
      {
        id: 'notif-9',
        type: 'welcome',
        title: 'Welcome to Quicksell!',
        message: 'Start exploring amazing auctions and place your first bid. Check out our featured items.',
        timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        read: true,
        priority: 'low',
        actionUrl: '/products?featured=true',
        actionLabel: 'Browse Featured'
      },
      {
        id: 'notif-10',
        type: 'payment',
        title: 'Payment Confirmed',
        message: 'Your payment of R19,700 for MacBook Pro M2 has been processed successfully.',
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        read: true,
        priority: 'medium',
        actionUrl: '/orders/ORD-001',
        actionLabel: 'View Order',
        metadata: {
          orderId: 'ORD-001',
          amount: 19700
        }
      }
    ]

    setNotifications(mockNotifications)
  }

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    )
  }

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, read: true }))
    )
    toast.success('All notifications marked as read')
  }

  const deleteNotification = (notificationId: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== notificationId))
    toast.success('Notification deleted')
  }

  const deleteAllRead = () => {
    setNotifications(prev => prev.filter(notif => !notif.read))
    toast.success('All read notifications deleted')
  }

  const getNotificationIcon = (type: string, priority: string) => {
    const baseClasses = "h-5 w-5"
    const colorClasses = priority === 'urgent' ? 'text-red-500' :
                        priority === 'high' ? 'text-orange-500' :
                        priority === 'medium' ? 'text-blue-500' : 'text-gray-500'

    switch (type) {
      case 'bid': return <ShoppingBagIcon className={`${baseClasses} ${colorClasses}`} />
      case 'outbid': return <ExclamationTriangleIcon className={`${baseClasses} text-orange-500`} />
      case 'won': return <TrophyIcon className={`${baseClasses} text-yellow-500`} />
      case 'lost': return <ClockIcon className={`${baseClasses} text-gray-500`} />
      case 'price_alert': return <BellIconSolid className={`${baseClasses} text-green-500`} />
      case 'reminder': return <ClockIcon className={`${baseClasses} text-blue-500`} />
      case 'shipping': return <TruckIcon className={`${baseClasses} text-purple-500`} />
      case 'payment': return <CreditCardIcon className={`${baseClasses} text-green-500`} />
      case 'welcome': return <GiftIcon className={`${baseClasses} text-pink-500`} />
      case 'system': return <InformationCircleIcon className={`${baseClasses} text-blue-500`} />
      default: return <BellIcon className={`${baseClasses} ${colorClasses}`} />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'border-l-red-500 bg-red-50'
      case 'high': return 'border-l-orange-500 bg-orange-50'
      case 'medium': return 'border-l-blue-500 bg-blue-50'
      case 'low': return 'border-l-gray-500 bg-gray-50'
      default: return 'border-l-gray-300 bg-white'
    }
  }

  const filteredNotifications = notifications.filter(notif => {
    if (activeTab === 'unread' && notif.read) return false
    if (activeTab === 'read' && !notif.read) return false
    if (filterType !== 'all' && notif.type !== filterType) return false
    return true
  })

  const unreadCount = notifications.filter(n => !n.read).length
  const tabs = [
    { id: 'all', label: 'All', count: notifications.length },
    { id: 'unread', label: 'Unread', count: unreadCount },
    { id: 'read', label: 'Read', count: notifications.length - unreadCount }
  ]

  const notificationTypes = [
    { value: 'all', label: 'All Types' },
    { value: 'bid', label: 'Bids' },
    { value: 'outbid', label: 'Outbid' },
    { value: 'won', label: 'Won Auctions' },
    { value: 'price_alert', label: 'Price Alerts' },
    { value: 'reminder', label: 'Reminders' },
    { value: 'shipping', label: 'Shipping' },
    { value: 'system', label: 'System' }
  ]

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date().getTime()
    const time = new Date(timestamp).getTime()
    const diff = now - time

    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return `${days}d ago`
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <BellIconSolid className="h-8 w-8 text-blue-500 mr-3" />
              Notifications
            </h1>
            <p className="text-gray-600 mt-2">
              Stay updated with your auction activity and important updates
            </p>
          </div>
          <div className="flex space-x-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="btn-outline text-sm"
              >
                <CheckIcon className="h-4 w-4 mr-1" />
                Mark All Read
              </button>
            )}
            <button
              onClick={deleteAllRead}
              className="btn-outline text-sm text-red-600 border-red-300 hover:bg-red-50"
            >
              <TrashIcon className="h-4 w-4 mr-1" />
              Clear Read
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900">{notifications.length}</p>
            </div>
            <BellIcon className="h-6 w-6 text-gray-500" />
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Unread</p>
              <p className="text-2xl font-bold text-gray-900">{unreadCount}</p>
            </div>
            <div className="h-6 w-6 bg-red-100 rounded-full flex items-center justify-center">
              <span className="text-xs font-bold text-red-600">{unreadCount}</span>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Urgent</p>
              <p className="text-2xl font-bold text-gray-900">
                {notifications.filter(n => n.priority === 'urgent').length}
              </p>
            </div>
            <ExclamationTriangleIcon className="h-6 w-6 text-red-500" />
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Today</p>
              <p className="text-2xl font-bold text-gray-900">
                {notifications.filter(n => {
                  const today = new Date().toDateString()
                  return new Date(n.timestamp).toDateString() === today
                }).length}
              </p>
            </div>
            <ClockIcon className="h-6 w-6 text-blue-500" />
          </div>
        </div>
      </div>

      {/* Tabs and Filters */}
      <div className="flex justify-between items-center">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
                <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600">
                  {tab.count}
                </span>
              </button>
            ))}
          </nav>
        </div>

        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          {notificationTypes.map(type => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {filteredNotifications.length > 0 ? (
          filteredNotifications.map((notification) => (
            <motion.div
              key={notification.id}
              layout
              className={`border-l-4 rounded-lg p-4 hover:shadow-md transition-all ${
                notification.read 
                  ? `${getPriorityColor(notification.priority)} opacity-75` 
                  : `${getPriorityColor(notification.priority)} shadow-sm`
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  <div className="flex-shrink-0 mt-1">
                    {getNotificationIcon(notification.type, notification.priority)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <h3 className={`font-semibold ${notification.read ? 'text-gray-700' : 'text-gray-900'}`}>
                        {notification.title}
                      </h3>
                      {!notification.read && (
                        <span className="h-2 w-2 bg-blue-500 rounded-full"></span>
                      )}
                      {notification.priority === 'urgent' && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          Urgent
                        </span>
                      )}
                    </div>
                    
                    <p className={`mt-1 text-sm ${notification.read ? 'text-gray-600' : 'text-gray-700'}`}>
                      {notification.message}
                    </p>

                    {notification.metadata?.imageUrl && (
                      <div className="mt-3 flex items-center space-x-3">
                        <img
                          src={notification.metadata.imageUrl}
                          alt={notification.metadata.productTitle}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                        <div>
                          <p className="font-medium text-sm text-gray-900">
                            {notification.metadata.productTitle}
                          </p>
                          {notification.metadata.amount && (
                            <p className="text-sm text-primary-600 font-semibold">
                              {formatPrice(notification.metadata.amount)}
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between mt-3">
                      <span className="text-xs text-gray-500">
                        {formatTimeAgo(notification.timestamp)}
                      </span>
                      
                      <div className="flex items-center space-x-2">
                        {notification.actionUrl && notification.actionLabel && (
                          <Link
                            to={notification.actionUrl}
                            className="text-sm font-medium text-primary-600 hover:text-primary-700"
                            onClick={() => markAsRead(notification.id)}
                          >
                            {notification.actionLabel}
                          </Link>
                        )}
                        
                        <div className="relative">
                          <button
                            onClick={() => setShowMenu(showMenu === notification.id ? null : notification.id)}
                            className="p-1 hover:bg-gray-200 rounded transition-colors"
                          >
                            <EllipsisVerticalIcon className="h-4 w-4 text-gray-500" />
                          </button>
                          
                          {showMenu === notification.id && (
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-10">
                              {!notification.read && (
                                <button
                                  onClick={() => {
                                    markAsRead(notification.id)
                                    setShowMenu(null)
                                  }}
                                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                >
                                  Mark as read
                                </button>
                              )}
                              <button
                                onClick={() => {
                                  deleteNotification(notification.id)
                                  setShowMenu(null)
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                              >
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="text-center py-12">
            <BellIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {activeTab === 'all' ? 'No notifications' : `No ${activeTab} notifications`}
            </h3>
            <p className="text-gray-600 mb-4">
              {activeTab === 'all' 
                ? 'You\'re all caught up! New notifications will appear here.'
                : `You don't have any ${activeTab} notifications at the moment.`
              }
            </p>
            {activeTab === 'all' && (
              <Link to="/products" className="btn-primary">
                Browse Auctions
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Settings Link */}
      <div className="card">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <CogIcon className="h-5 w-5 text-gray-500" />
            <div>
              <h3 className="font-medium text-gray-900">Notification Preferences</h3>
              <p className="text-sm text-gray-600">Manage your notification settings and preferences</p>
            </div>
          </div>
          <Link
            to="/profile?tab=notifications"
            className="btn-outline text-sm"
          >
            Manage Settings
          </Link>
        </div>
      </div>
    </motion.div>
  )
}

export default Notifications