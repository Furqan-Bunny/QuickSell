import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
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
import { mockProducts, formatPrice } from '../data/mockData'
import { useAuthStore } from '../store/authStore'

interface Order {
  id: string
  product: any
  quantity: number
  totalAmount: number
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  orderDate: string
  deliveryDate?: string
  estimatedDelivery?: string
  trackingNumber?: string
  shippingAddress: {
    name: string
    address: string
    city: string
    postalCode: string
    country: string
  }
  paymentMethod: string
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded'
  notes?: string
}

const Orders = () => {
  const { user } = useAuthStore()
  const [activeTab, setActiveTab] = useState('all')
  const [orders, setOrders] = useState<Order[]>([])
  const [sortBy, setSortBy] = useState('recent')

  useEffect(() => {
    loadOrders()
  }, [])

  const loadOrders = () => {
    // Mock orders data based on won auctions
    const mockOrders: Order[] = [
      {
        id: 'ORD-001',
        product: mockProducts[2], // MacBook Pro
        quantity: 1,
        totalAmount: 19500 + mockProducts[2].shippingCost,
        status: 'delivered',
        orderDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        deliveryDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        trackingNumber: 'QS-MAC-789123',
        shippingAddress: {
          name: `${user?.firstName || 'John'} ${user?.lastName || 'Doe'}`,
          address: '123 Main Street, Apartment 4B',
          city: 'Cape Town',
          postalCode: '8001',
          country: 'South Africa'
        },
        paymentMethod: 'Credit Card (**** 1234)',
        paymentStatus: 'paid'
      },
      {
        id: 'ORD-002', 
        product: mockProducts[3], // Nike Air Jordan
        quantity: 1,
        totalAmount: 4200 + mockProducts[3].shippingCost,
        status: 'shipped',
        orderDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        estimatedDelivery: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        trackingNumber: 'QS-NIK-456789',
        shippingAddress: {
          name: `${user?.firstName || 'John'} ${user?.lastName || 'Doe'}`,
          address: '123 Main Street, Apartment 4B',
          city: 'Cape Town',
          postalCode: '8001',
          country: 'South Africa'
        },
        paymentMethod: 'EFT Banking',
        paymentStatus: 'paid'
      },
      {
        id: 'ORD-003',
        product: mockProducts[5], // Samsung TV
        quantity: 1,
        totalAmount: 6500 + mockProducts[5].shippingCost,
        status: 'processing',
        orderDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        estimatedDelivery: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        shippingAddress: {
          name: `${user?.firstName || 'John'} ${user?.lastName || 'Doe'}`,
          address: '123 Main Street, Apartment 4B',
          city: 'Cape Town',
          postalCode: '8001',
          country: 'South Africa'
        },
        paymentMethod: 'Credit Card (**** 5678)',
        paymentStatus: 'paid'
      },
      {
        id: 'ORD-004',
        product: mockProducts[8], // Tanzanite Ring
        quantity: 1,
        totalAmount: 38000,
        status: 'pending',
        orderDate: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        shippingAddress: {
          name: `${user?.firstName || 'John'} ${user?.lastName || 'Doe'}`,
          address: '123 Main Street, Apartment 4B',
          city: 'Cape Town',
          postalCode: '8001',
          country: 'South Africa'
        },
        paymentMethod: 'Bank Transfer',
        paymentStatus: 'pending',
        notes: 'Payment confirmation awaited'
      }
    ]
    
    setOrders(mockOrders)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'text-green-800 bg-green-100'
      case 'shipped': return 'text-blue-800 bg-blue-100'
      case 'processing': return 'text-yellow-800 bg-yellow-100'
      case 'pending': return 'text-gray-800 bg-gray-100'
      case 'cancelled': return 'text-red-800 bg-red-100'
      default: return 'text-gray-800 bg-gray-100'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered': return <CheckCircleIcon className="h-4 w-4" />
      case 'shipped': return <TruckIcon className="h-4 w-4" />
      case 'processing': return <ClockIcon className="h-4 w-4" />
      case 'pending': return <ExclamationTriangleIcon className="h-4 w-4" />
      case 'cancelled': return <ExclamationTriangleIcon className="h-4 w-4" />
      default: return <ClockIcon className="h-4 w-4" />
    }
  }

  const filteredOrders = orders.filter(order => {
    if (activeTab === 'all') return true
    return order.status === activeTab
  })

  const tabs = [
    { id: 'all', label: 'All Orders', count: orders.length },
    { id: 'pending', label: 'Pending', count: orders.filter(o => o.status === 'pending').length },
    { id: 'processing', label: 'Processing', count: orders.filter(o => o.status === 'processing').length },
    { id: 'shipped', label: 'Shipped', count: orders.filter(o => o.status === 'shipped').length },
    { id: 'delivered', label: 'Delivered', count: orders.filter(o => o.status === 'delivered').length }
  ]

  const stats = [
    {
      title: 'Total Orders',
      value: orders.length,
      icon: ShoppingBagIcon,
      color: 'bg-blue-500'
    },
    {
      title: 'Total Spent',
      value: formatPrice(orders.reduce((sum, order) => sum + order.totalAmount, 0)),
      icon: CreditCardIcon,
      color: 'bg-green-500'
    },
    {
      title: 'Delivered',
      value: orders.filter(o => o.status === 'delivered').length,
      icon: CheckCircleIcon,
      color: 'bg-purple-500'
    },
    {
      title: 'In Transit',
      value: orders.filter(o => o.status === 'shipped').length,
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
        {filteredOrders.length > 0 ? (
          filteredOrders.map((order) => (
            <div key={order.id} className="card hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-gray-900">Order {order.id}</h3>
                  <p className="text-sm text-gray-600">
                    Placed on {new Date(order.orderDate).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                    {getStatusIcon(order.status)}
                    <span className="ml-1 capitalize">{order.status}</span>
                  </span>
                  <p className="text-sm text-gray-600 mt-1">
                    Total: {formatPrice(order.totalAmount)}
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <img
                  src={order.product.images[0]}
                  alt={order.product.title}
                  className="w-20 h-20 object-cover rounded-lg"
                />
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{order.product.title}</h4>
                  <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                    <span>Quantity: {order.quantity}</span>
                    <span>Won for: {formatPrice(order.totalAmount - (order.product.shippingCost || 0))}</span>
                    {order.product.shippingCost > 0 && (
                      <span>Shipping: {formatPrice(order.product.shippingCost)}</span>
                    )}
                  </div>
                  
                  {/* Shipping Info */}
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center text-sm text-gray-600 mb-1">
                          <MapPinIcon className="h-4 w-4 mr-1" />
                          <span>Shipping to:</span>
                        </div>
                        <p className="text-sm font-medium">{order.shippingAddress.name}</p>
                        <p className="text-sm text-gray-600">
                          {order.shippingAddress.address}, {order.shippingAddress.city} {order.shippingAddress.postalCode}
                        </p>
                        <p className="text-sm text-gray-600">{order.shippingAddress.country}</p>
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

                  {/* Payment Info */}
                  <div className="mt-2 flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-4">
                      <span className="text-gray-600">Payment:</span>
                      <span>{order.paymentMethod}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        order.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' :
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
                        <button className="btn-primary text-sm py-1">
                          Complete Payment
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
              {activeTab === 'all' ? 'No orders yet' : `No ${activeTab} orders`}
            </h3>
            <p className="text-gray-600 mb-4">
              {activeTab === 'all' 
                ? 'Start bidding on auctions to see your orders here'
                : `You don't have any ${activeTab} orders at the moment`
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