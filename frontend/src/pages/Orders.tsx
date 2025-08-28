import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import {
  ShoppingBagIcon,
  TruckIcon,
  CheckCircleIcon,
  ClockIcon,
  MapPinIcon,
  CreditCardIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  ChatBubbleLeftEllipsisIcon
} from '@heroicons/react/24/outline'
import { formatPrice } from '../utils/formatters'
import { useAuthStore } from '../store/authStore'

interface Order {
  id: string
  productId: string
  productTitle: string
  productImage: string
  buyerId: string
  buyerName: string
  buyerEmail: string
  sellerId: string
  sellerName: string
  type: 'buy_now' | 'auction_win'
  amount: number
  status: 'pending_payment' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded'
  shippingAddress: {
    name?: string
    address?: string
    city?: string
    postalCode?: string
    country?: string
  }
  trackingNumber?: string
  createdAt: any
  updatedAt?: any
  paymentCompletedAt?: any
  deliveryDate?: string
  estimatedDelivery?: string
  notes?: string
}

const Orders = () => {
  const { user } = useAuthStore()
  const [activeTab, setActiveTab] = useState('all')
  const [orders, setOrders] = useState<Order[]>([])
  const [sortBy, setSortBy] = useState('recent')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadOrders()
  }, [activeTab, sortBy])

  const loadOrders = async () => {
    setLoading(true)
    try {
      let endpoint = '/api/orders/my-orders'
      
      // Add status filter if not 'all'
      if (activeTab !== 'all') {
        endpoint += `?status=${activeTab}`
      }
      
      const response = await axios.get(endpoint)
      if (response.data.success) {
        let data = response.data.data || []
        
        // Sort orders
        switch (sortBy) {
          case 'recent':
            data.sort((a: any, b: any) => {
              const aDate = a.createdAt?._seconds || 0
              const bDate = b.createdAt?._seconds || 0
              return bDate - aDate
            })
            break
          case 'oldest':
            data.sort((a: any, b: any) => {
              const aDate = a.createdAt?._seconds || 0
              const bDate = b.createdAt?._seconds || 0
              return aDate - bDate
            })
            break
          case 'amount-high':
            data.sort((a: any, b: any) => b.amount - a.amount)
            break
          case 'amount-low':
            data.sort((a: any, b: any) => a.amount - b.amount)
            break
        }
        
        setOrders(data)
      }
    } catch (error) {
      console.error('Error loading orders:', error)
      setOrders([])
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'text-green-800 bg-green-100'
      case 'shipped': return 'text-blue-800 bg-blue-100'
      case 'processing': return 'text-yellow-800 bg-yellow-100'
      case 'pending_payment': return 'text-gray-800 bg-gray-100'
      case 'cancelled': return 'text-red-800 bg-red-100'
      default: return 'text-gray-800 bg-gray-100'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered': return <CheckCircleIcon className="h-4 w-4" />
      case 'shipped': return <TruckIcon className="h-4 w-4" />
      case 'processing': return <ClockIcon className="h-4 w-4" />
      case 'pending_payment': return <ExclamationTriangleIcon className="h-4 w-4" />
      case 'cancelled': return <ExclamationTriangleIcon className="h-4 w-4" />
      default: return <ClockIcon className="h-4 w-4" />
    }
  }

  const getStatusLabel = (status: string) => {
    return status.replace(/_/g, ' ').split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ')
  }

  const handlePayment = async (orderId: string) => {
    try {
      const response = await axios.post(`/api/orders/${orderId}/pay`)
      if (response.data.success) {
        // Redirect to payment URL
        window.location.href = response.data.data.paymentUrl
      }
    } catch (error) {
      console.error('Error initiating payment:', error)
      alert('Failed to initiate payment. Please try again.')
    }
  }

  const handleCancelOrder = async (orderId: string) => {
    if (!confirm('Are you sure you want to cancel this order?')) return
    
    try {
      const response = await axios.delete(`/api/orders/${orderId}`)
      if (response.data.success) {
        loadOrders() // Reload orders
      }
    } catch (error: any) {
      console.error('Error cancelling order:', error)
      alert(error.response?.data?.error || 'Failed to cancel order')
    }
  }

  const tabs = [
    { id: 'all', label: 'All Orders', count: orders.length },
    { id: 'pending_payment', label: 'Pending', count: 0 },
    { id: 'processing', label: 'Processing', count: 0 },
    { id: 'shipped', label: 'Shipped', count: 0 },
    { id: 'delivered', label: 'Delivered', count: 0 }
  ]

  // Update tab counts if orders are loaded and activeTab is 'all'
  if (!loading && activeTab === 'all') {
    tabs[1].count = orders.filter(o => o.status === 'pending_payment').length
    tabs[2].count = orders.filter(o => o.status === 'processing').length
    tabs[3].count = orders.filter(o => o.status === 'shipped').length
    tabs[4].count = orders.filter(o => o.status === 'delivered').length
  } else if (!loading) {
    const tabIndex = tabs.findIndex(t => t.id === activeTab)
    if (tabIndex > 0) tabs[tabIndex].count = orders.length
  }

  const stats = [
    {
      title: 'Total Orders',
      value: activeTab === 'all' ? orders.length : 0,
      icon: ShoppingBagIcon,
      color: 'bg-blue-500'
    },
    {
      title: 'Total Spent',
      value: formatPrice(orders.reduce((sum, order) => sum + order.amount, 0)),
      icon: CreditCardIcon,
      color: 'bg-green-500'
    },
    {
      title: 'Delivered',
      value: activeTab === 'all' ? orders.filter(o => o.status === 'delivered').length : 
             activeTab === 'delivered' ? orders.length : 0,
      icon: CheckCircleIcon,
      color: 'bg-purple-500'
    },
    {
      title: 'In Transit',
      value: activeTab === 'all' ? orders.filter(o => o.status === 'shipped').length :
             activeTab === 'shipped' ? orders.length : 0,
      icon: TruckIcon,
      color: 'bg-orange-500'
    }
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-50 to-secondary-50 rounded-xl p-6">
        <h1 className="text-3xl font-bold text-gray-900">Order History</h1>
        <p className="text-gray-600 mt-2">
          Track all your auction winnings and order status
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="card"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
              </div>
              <div className={`${stat.color} p-3 rounded-lg bg-opacity-10`}>
                <stat.icon className={`h-6 w-6 ${stat.color.replace('bg-', 'text-')}`} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Tabs and Sort */}
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
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="recent">Most Recent</option>
          <option value="oldest">Oldest First</option>
          <option value="amount-high">Amount: High to Low</option>
          <option value="amount-low">Amount: Low to High</option>
        </select>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : orders.length > 0 ? (
          orders.map((order) => (
            <div key={order.id} className="card hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-gray-900">Order #{order.id.slice(-8)}</h3>
                  <p className="text-sm text-gray-600">
                    Placed on {order.createdAt ? 
                      new Date(order.createdAt._seconds ? order.createdAt._seconds * 1000 : order.createdAt).toLocaleDateString() :
                      'Unknown'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Type: {order.type === 'buy_now' ? 'Buy Now' : 'Auction Win'}
                  </p>
                </div>
                <div className="text-right">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                    {getStatusIcon(order.status)}
                    <span className="ml-1">{getStatusLabel(order.status)}</span>
                  </span>
                  <p className="text-sm text-gray-600 mt-1">
                    Total: {formatPrice(order.amount)}
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <img
                  src={order.productImage || 'https://via.placeholder.com/80'}
                  alt={order.productTitle}
                  className="w-20 h-20 object-cover rounded-lg"
                />
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{order.productTitle}</h4>
                  <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                    <span>Amount: {formatPrice(order.amount)}</span>
                    <span>Seller: {order.sellerName}</span>
                  </div>
                  
                  {/* Shipping Info */}
                  {order.shippingAddress && Object.keys(order.shippingAddress).length > 0 && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center text-sm text-gray-600 mb-1">
                            <MapPinIcon className="h-4 w-4 mr-1" />
                            <span>Shipping to:</span>
                          </div>
                          <p className="text-sm font-medium">
                            {order.shippingAddress.name || order.buyerName}
                          </p>
                          {order.shippingAddress.address && (
                            <p className="text-sm text-gray-600">
                              {order.shippingAddress.address}
                              {order.shippingAddress.city && `, ${order.shippingAddress.city}`}
                              {order.shippingAddress.postalCode && ` ${order.shippingAddress.postalCode}`}
                            </p>
                          )}
                          {order.shippingAddress.country && (
                            <p className="text-sm text-gray-600">{order.shippingAddress.country}</p>
                          )}
                        </div>
                        <div className="text-right text-sm">
                          {order.trackingNumber && (
                            <div className="mb-2">
                              <span className="text-gray-600">Tracking:</span>
                              <p className="font-mono font-medium">{order.trackingNumber}</p>
                            </div>
                          )}
                          {order.deliveryDate ? (
                            <div>
                              <span className="text-gray-600">Delivered:</span>
                              <p className="font-medium">{new Date(order.deliveryDate).toLocaleDateString()}</p>
                            </div>
                          ) : order.estimatedDelivery && (
                            <div>
                              <span className="text-gray-600">Expected:</span>
                              <p className="font-medium">{new Date(order.estimatedDelivery).toLocaleDateString()}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Payment Info */}
                  <div className="mt-2 flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-4">
                      <span className="text-gray-600">Payment:</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        order.paymentStatus === 'completed' ? 'bg-green-100 text-green-800' :
                        order.paymentStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {order.paymentStatus}
                      </span>
                    </div>
                    <div className="flex space-x-2">
                      <Link
                        to={`/orders/${order.id}`}
                        className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                      >
                        <EyeIcon className="h-4 w-4 mr-1" />
                        View Details
                      </Link>
                      {order.status === 'delivered' && (
                        <button className="inline-flex items-center px-3 py-1 border border-primary-300 text-primary-600 rounded-md text-sm font-medium hover:bg-primary-50">
                          <ChatBubbleLeftEllipsisIcon className="h-4 w-4 mr-1" />
                          Leave Review
                        </button>
                      )}
                      {order.paymentStatus === 'pending' && (
                        <button 
                          onClick={() => handlePayment(order.id)}
                          className="btn-primary text-sm py-1"
                        >
                          Complete Payment
                        </button>
                      )}
                      {(order.status === 'pending_payment' || order.status === 'processing') && 
                       order.paymentStatus !== 'completed' && (
                        <button 
                          onClick={() => handleCancelOrder(order.id)}
                          className="inline-flex items-center px-3 py-1 border border-red-300 text-red-600 rounded-md text-sm font-medium hover:bg-red-50"
                        >
                          Cancel Order
                        </button>
                      )}
                    </div>
                  </div>

                  {order.notes && (
                    <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                      <p className="text-sm text-yellow-800">
                        <ExclamationTriangleIcon className="h-4 w-4 inline mr-1" />
                        {order.notes}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12">
            <ShoppingBagIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {activeTab === 'all' ? 'No orders yet' : `No ${getStatusLabel(activeTab).toLowerCase()} orders`}
            </h3>
            <p className="text-gray-600 mb-4">
              {activeTab === 'all' 
                ? 'Start bidding on auctions to see your orders here'
                : `You don't have any ${getStatusLabel(activeTab).toLowerCase()} orders at the moment`
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
    </motion.div>
  )
}

export default Orders