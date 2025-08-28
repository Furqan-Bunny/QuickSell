import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import axios from 'axios'
import {
  ArrowLeftIcon,
  TruckIcon,
  CreditCardIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  ChatBubbleLeftIcon,
  StarIcon,
  DocumentTextIcon,
  PrinterIcon
} from '@heroicons/react/24/outline'
import { formatPrice } from '../utils/formatters'
import toast from 'react-hot-toast'

// Mock order data (kept for reference)
const mockOrder = {
  id: 'ORD001',
  orderNumber: 'QS202412001',
  status: 'shipped',
  createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  
  product: {
    id: 'prod1',
    title: 'iPhone 14 Pro Max 256GB',
    image: 'https://images.unsplash.com/photo-1678685888221-cda773a3dcdb?w=500',
    description: 'Excellent condition smartphone'
  },
  
  buyer: {
    id: 'user1',
    username: 'john_doe',
    email: 'john@example.com',
    phone: '+27 82 123 4567'
  },
  
  seller: {
    id: 'seller1',
    username: 'techstore',
    email: 'seller@example.com',
    phone: '+27 83 234 5678',
    rating: 4.8,
    totalSales: 156
  },
  
  amount: {
    subtotal: 15000,
    shipping: 150,
    tax: 1200,
    fees: 450,
    total: 16800
  },
  
  payment: {
    method: 'card',
    status: 'completed',
    transactionId: 'TXN123456789',
    paidAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
  },
  
  shipping: {
    address: {
      street: '123 Main Street',
      city: 'Cape Town',
      state: 'Western Cape',
      country: 'South Africa',
      zipCode: '8001'
    },
    method: 'Express Delivery',
    carrier: 'DHL',
    trackingNumber: 'DHL123456789',
    estimatedDelivery: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'in-transit'
  },
  
  timeline: [
    {
      status: 'Order Placed',
      description: 'Order was successfully placed',
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      icon: CheckCircleIcon,
      completed: true
    },
    {
      status: 'Payment Confirmed',
      description: 'Payment was successfully processed',
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      icon: CreditCardIcon,
      completed: true
    },
    {
      status: 'Order Processed',
      description: 'Seller has confirmed the order',
      timestamp: new Date(Date.now() - 1.5 * 24 * 60 * 60 * 1000).toISOString(),
      icon: CheckCircleIcon,
      completed: true
    },
    {
      status: 'Shipped',
      description: 'Package has been shipped',
      timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      icon: TruckIcon,
      completed: true
    },
    {
      status: 'Out for Delivery',
      description: 'Package is out for delivery',
      timestamp: null,
      icon: TruckIcon,
      completed: false
    },
    {
      status: 'Delivered',
      description: 'Package delivered successfully',
      timestamp: null,
      icon: CheckCircleIcon,
      completed: false
    }
  ]
}

const OrderDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [product, setProduct] = useState<any>(null)
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [rating, setRating] = useState(5)
  const [reviewText, setReviewText] = useState('')

  useEffect(() => {
    if (!user) {
      toast.error('Please login to view order details')
      navigate('/login')
      return
    }
    loadOrder()
  }, [id, user])

  const loadOrder = async () => {
    try {
      setLoading(true)
      // Fetch order from API
      const response = await axios.get(`/api/orders/${id}`)
      if (response.data.success) {
        const orderData = response.data.data
        setOrder(orderData)
        
        // Fetch product details if available
        if (orderData.productId) {
          try {
            const productResponse = await axios.get(`/api/products/${orderData.productId}`)
            if (productResponse.data.success) {
              setProduct(productResponse.data.data)
            }
          } catch (error) {
            console.error('Error fetching product details:', error)
          }
        }
      } else {
        toast.error('Order not found')
        navigate('/orders')
      }
    } catch (error: any) {
      console.error('Error fetching order:', error)
      if (error.response?.status === 404) {
        toast.error('Order not found')
      } else if (error.response?.status === 403) {
        toast.error('You do not have permission to view this order')
      } else {
        toast.error('Failed to fetch order details')
      }
      navigate('/orders')
    } finally {
      setLoading(false)
    }
  }

  const handleCancelOrder = async () => {
    if (confirm('Are you sure you want to cancel this order?')) {
      try {
        const response = await axios.put(`/api/orders/${id}/cancel`)
        if (response.data.success) {
          toast.success('Order cancelled successfully')
          navigate('/orders')
        }
      } catch (error: any) {
        console.error('Error cancelling order:', error)
        toast.error(error.response?.data?.error || 'Failed to cancel order')
      }
    }
  }

  const handleSubmitReview = () => {
    toast.success('Review submitted successfully')
    setShowReviewModal(false)
  }

  const handlePrint = () => {
    window.print()
  }

  const getStatusColor = (status: string) => {
    const colors: any = {
      pending: 'text-yellow-600 bg-yellow-100',
      confirmed: 'text-blue-600 bg-blue-100',
      processing: 'text-indigo-600 bg-indigo-100',
      shipped: 'text-purple-600 bg-purple-100',
      delivered: 'text-green-600 bg-green-100',
      completed: 'text-green-600 bg-green-100',
      cancelled: 'text-red-600 bg-red-100'
    }
    return colors[status] || 'text-gray-600 bg-gray-100'
  }

  const getPaymentStatusColor = (status: string) => {
    const colors: any = {
      pending: 'text-yellow-600',
      completed: 'text-green-600',
      failed: 'text-red-600'
    }
    return colors[status] || 'text-gray-600'
  }

  if (loading || !order) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  // Build timeline based on order status
  const buildTimeline = () => {
    const timeline = [
      {
        status: 'Order Placed',
        description: 'Order was successfully placed',
        timestamp: order.createdAt,
        icon: CheckCircleIcon,
        completed: true
      },
      {
        status: 'Payment Confirmed',
        description: 'Payment was successfully processed',
        timestamp: order.paymentStatus === 'completed' ? order.createdAt : null,
        icon: CreditCardIcon,
        completed: order.paymentStatus === 'completed'
      }
    ]

    if (order.status !== 'cancelled') {
      timeline.push(
        {
          status: 'Order Processing',
          description: 'Order is being prepared',
          timestamp: order.status === 'processing' || order.status === 'shipped' || order.status === 'delivered' ? order.updatedAt : null,
          icon: ClockIcon,
          completed: order.status === 'processing' || order.status === 'shipped' || order.status === 'delivered'
        },
        {
          status: 'Shipped',
          description: order.trackingNumber ? `Tracking: ${order.trackingNumber}` : 'Package has been shipped',
          timestamp: order.status === 'shipped' || order.status === 'delivered' ? order.shippedAt : null,
          icon: TruckIcon,
          completed: order.status === 'shipped' || order.status === 'delivered'
        },
        {
          status: 'Delivered',
          description: 'Package delivered successfully',
          timestamp: order.status === 'delivered' ? order.deliveredAt : null,
          icon: CheckCircleIcon,
          completed: order.status === 'delivered'
        }
      )
    } else {
      timeline.push({
        status: 'Order Cancelled',
        description: order.cancellationReason || 'Order was cancelled',
        timestamp: order.cancelledAt || order.updatedAt,
        icon: XCircleIcon,
        completed: true
      })
    }

    return timeline
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <button
            onClick={() => navigate('/orders')}
            className="flex items-center gap-2 text-gray-600 hover:text-primary-600 mb-4"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Back to Orders
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Order #{order.orderId}</h1>
          <div className="flex items-center gap-4 mt-2">
            <span className={`badge ${getStatusColor(order.status)}`}>
              {order.status.toUpperCase()}
            </span>
            <span className="text-gray-600">
              Placed on {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A'}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handlePrint}
            className="btn-outline flex items-center gap-2"
          >
            <PrinterIcon className="h-5 w-5" />
            Print
          </button>
          {(order.status === 'pending' || order.status === 'processing') && (
            <button
              onClick={handleCancelOrder}
              className="btn-outline border-red-600 text-red-600 hover:bg-red-50"
            >
              Cancel Order
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Timeline */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Order Timeline</h2>
            <div className="relative">
              {buildTimeline().map((event: any, index: number) => (
                <div key={index} className="flex gap-4 mb-6 last:mb-0">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        event.completed
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-200 text-gray-400'
                      }`}
                    >
                      <event.icon className="h-5 w-5" />
                    </div>
                    {index < buildTimeline().length - 1 && (
                      <div
                        className={`w-0.5 h-16 mt-2 ${
                          event.completed ? 'bg-primary-600' : 'bg-gray-200'
                        }`}
                      />
                    )}
                  </div>
                  <div className="flex-grow">
                    <h3 className={`font-medium ${event.completed ? 'text-gray-900' : 'text-gray-400'}`}>
                      {event.status}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                    {event.timestamp && (
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(event.timestamp).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Product Details */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Product Details</h2>
            <div className="flex gap-4">
              {product?.images?.[0] ? (
                <img
                  src={product.images[0]}
                  alt={order.productTitle}
                  className="w-24 h-24 object-cover rounded-lg"
                />
              ) : order.productImage ? (
                <img
                  src={order.productImage}
                  alt={order.productTitle}
                  className="w-24 h-24 object-cover rounded-lg"
                />
              ) : (
                <div className="w-24 h-24 bg-gray-200 rounded-lg flex items-center justify-center">
                  <DocumentTextIcon className="h-8 w-8 text-gray-400" />
                </div>
              )}
              <div className="flex-grow">
                <h3 className="font-medium text-gray-900">{order.productTitle || 'Product'}</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Quantity: {order.quantity || 1}<br />
                  Price: {formatPrice(order.productPrice || 0)}
                </p>
                {order.productId && (
                  <Link
                    to={`/products/${order.productId}`}
                    className="text-primary-600 hover:text-primary-700 text-sm mt-2 inline-block"
                  >
                    View Product →
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* Shipping Information */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Shipping Information</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                  <MapPinIcon className="h-5 w-5 text-gray-400" />
                  Delivery Address
                </h3>
                {order.shippingAddress ? (
                  <p className="text-gray-600">
                    {order.shippingAddress.fullName}<br />
                    {order.shippingAddress.addressLine1}<br />
                    {order.shippingAddress.addressLine2 && (
                      <>{order.shippingAddress.addressLine2}<br /></>
                    )}
                    {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}<br />
                    {order.shippingAddress.country}
                  </p>
                ) : (
                  <p className="text-gray-500">No shipping address provided</p>
                )}
              </div>
              
              {order.trackingNumber && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                    <TruckIcon className="h-5 w-5 text-gray-400" />
                    Tracking Information
                  </h3>
                  <p className="text-gray-600">
                    Carrier: {order.shippingCarrier || 'Standard Shipping'}<br />
                    Tracking Number: <span className="font-mono">{order.trackingNumber}</span><br />
                    {order.estimatedDelivery && (
                      <>Estimated Delivery: {new Date(order.estimatedDelivery).toLocaleDateString()}</>
                    )}
                  </p>
                  <button className="text-primary-600 hover:text-primary-700 text-sm mt-2">
                    Track Package →
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Seller Information - Phase 1: Admin is the seller */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Seller Information</h2>
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium text-gray-900">QuickSell Platform</h3>
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <EnvelopeIcon className="h-4 w-4" />
                    support@quicksell.com
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  All products are sold directly by QuickSell
                </p>
              </div>
              <button className="btn-outline flex items-center gap-2">
                <ChatBubbleLeftIcon className="h-4 w-4" />
                Contact Support
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Payment Summary */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment Summary</h2>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Product Price</span>
                <span className="font-medium">{formatPrice(order.productPrice || 0)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Quantity</span>
                <span className="font-medium">{order.quantity || 1}</span>
              </div>
              {order.shippingCost && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Shipping</span>
                  <span className="font-medium">{formatPrice(order.shippingCost)}</span>
                </div>
              )}
              <div className="border-t pt-3">
                <div className="flex justify-between">
                  <span className="font-semibold">Total</span>
                  <span className="font-bold text-lg">{formatPrice(order.totalAmount || 0)}</span>
                </div>
              </div>
            </div>
            
            <div className="mt-6 p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Payment Status</span>
                <span className={`text-sm font-medium ${getPaymentStatusColor(order.paymentStatus || 'pending')}`}>
                  {(order.paymentStatus || 'pending').toUpperCase()}
                </span>
              </div>
              <div className="text-xs text-gray-500">
                Method: {(order.paymentMethod || 'N/A').toUpperCase()}<br />
                {order.transactionId && `Transaction ID: ${order.transactionId}`}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Actions</h2>
            <div className="space-y-3">
              {order.status === 'delivered' && (
                <button
                  onClick={() => setShowReviewModal(true)}
                  className="btn-primary w-full flex items-center justify-center gap-2"
                >
                  <StarIcon className="h-5 w-5" />
                  Leave a Review
                </button>
              )}
              <button className="btn-outline w-full flex items-center justify-center gap-2">
                <DocumentTextIcon className="h-5 w-5" />
                Download Invoice
              </button>
              <button className="btn-outline w-full">
                Report an Issue
              </button>
            </div>
          </div>

          {/* Help */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Need Help?</h2>
            <p className="text-sm text-gray-600 mb-4">
              If you have any questions about your order, please don't hesitate to contact us.
            </p>
            <button className="btn-outline w-full">
              Contact Support
            </button>
          </div>
        </div>
      </div>

      {/* Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl p-6 max-w-md w-full mx-4"
          >
            <h3 className="text-xl font-bold text-gray-900 mb-4">Leave a Review</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    className="text-2xl"
                  >
                    <StarIcon
                      className={`h-8 w-8 ${
                        star <= rating
                          ? 'text-yellow-400 fill-current'
                          : 'text-gray-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Review
              </label>
              <textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                className="input-field h-32 resize-none"
                placeholder="Share your experience with this purchase..."
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleSubmitReview}
                className="btn-primary flex-1"
              >
                Submit Review
              </button>
              <button
                onClick={() => setShowReviewModal(false)}
                className="btn-outline flex-1"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  )
}

export default OrderDetail