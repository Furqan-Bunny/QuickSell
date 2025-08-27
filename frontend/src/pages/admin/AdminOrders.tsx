import { motion } from 'framer-motion'
import { useState } from 'react'
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  PencilIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  TruckIcon,
  CurrencyDollarIcon,
  ShoppingCartIcon,
  ExclamationTriangleIcon,
  CalendarIcon,
  UserIcon
} from '@heroicons/react/24/outline'
import { formatPrice } from '../../data/mockData'
import toast from 'react-hot-toast'

const AdminOrders = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [selectedOrders, setSelectedOrders] = useState<string[]>([])
  const [showOrderModal, setShowOrderModal] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<any>(null)

  // Mock orders data
  const mockOrders = [
    {
      id: 'ORD-001',
      productTitle: 'Vintage Rolex Submariner',
      productImage: 'https://images.unsplash.com/photo-1523170335258-f5c6c6bd6edb?w=300&h=300&fit=crop',
      buyer: 'john_buyer',
      buyerName: 'John Smith',
      buyerEmail: 'john@example.com',
      seller: 'watchcollector123',
      sellerName: 'Mike Wilson',
      sellerEmail: 'mike@example.com',
      amount: 85000,
      commission: 8500,
      netAmount: 76500,
      status: 'processing',
      paymentStatus: 'completed',
      orderDate: '2024-12-20',
      expectedDelivery: '2024-12-27',
      trackingNumber: 'TRK123456789',
      shippingAddress: '123 Main St, Cape Town, South Africa'
    },
    {
      id: 'ORD-002',
      productTitle: 'iPhone 15 Pro Max - Unopened',
      productImage: 'https://images.unsplash.com/photo-1592286634469-9b7429b91b65?w=300&h=300&fit=crop',
      buyer: 'sarah_tech',
      buyerName: 'Sarah Johnson',
      buyerEmail: 'sarah@example.com',
      seller: 'techdealer',
      sellerName: 'Alex Chen',
      sellerEmail: 'alex@example.com',
      amount: 12000,
      commission: 1200,
      netAmount: 10800,
      status: 'shipped',
      paymentStatus: 'completed',
      orderDate: '2024-12-19',
      expectedDelivery: '2024-12-24',
      trackingNumber: 'TRK987654321',
      shippingAddress: '456 Oak Ave, Johannesburg, South Africa'
    },
    {
      id: 'ORD-003',
      productTitle: 'Rare Pokemon Card Collection',
      productImage: 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=300&h=300&fit=crop',
      buyer: 'pokemon_fan',
      buyerName: 'Emma Davis',
      buyerEmail: 'emma@example.com',
      seller: 'pokemonmaster',
      sellerName: 'Chris Brown',
      sellerEmail: 'chris@example.com',
      amount: 25000,
      commission: 2500,
      netAmount: 22500,
      status: 'delivered',
      paymentStatus: 'completed',
      orderDate: '2024-12-15',
      expectedDelivery: '2024-12-22',
      trackingNumber: 'TRK456789123',
      shippingAddress: '789 Pine St, Durban, South Africa'
    },
    {
      id: 'ORD-004',
      productTitle: 'Gaming PC - RTX 4090 Setup',
      productImage: 'https://images.unsplash.com/photo-1587831990711-23ca6441447b?w=300&h=300&fit=crop',
      buyer: 'gamer_pro',
      buyerName: 'Ryan Wilson',
      buyerEmail: 'ryan@example.com',
      seller: 'pcbuilder',
      sellerName: 'Lisa Park',
      sellerEmail: 'lisa@example.com',
      amount: 35000,
      commission: 3500,
      netAmount: 31500,
      status: 'pending',
      paymentStatus: 'pending',
      orderDate: '2024-12-21',
      expectedDelivery: '2024-12-28',
      trackingNumber: null,
      shippingAddress: '321 Elm St, Port Elizabeth, South Africa'
    },
    {
      id: 'ORD-005',
      productTitle: 'Antique Victorian Jewelry Box',
      productImage: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=300&h=300&fit=crop',
      buyer: 'antique_lover',
      buyerName: 'Maria Garcia',
      buyerEmail: 'maria@example.com',
      seller: 'antiquedealer',
      sellerName: 'David Kim',
      sellerEmail: 'david@example.com',
      amount: 3500,
      commission: 350,
      netAmount: 3150,
      status: 'cancelled',
      paymentStatus: 'refunded',
      orderDate: '2024-12-18',
      expectedDelivery: null,
      trackingNumber: null,
      shippingAddress: '654 Maple Ave, Pretoria, South Africa'
    }
  ]

  const filteredOrders = mockOrders.filter(order => {
    const matchesSearch = 
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.productTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.buyerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.sellerName.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesStatus = filterStatus === 'all' || order.status === filterStatus
    
    return matchesSearch && matchesStatus
  })

  const handleSelectAll = () => {
    if (selectedOrders.length === filteredOrders.length) {
      setSelectedOrders([])
    } else {
      setSelectedOrders(filteredOrders.map(o => o.id))
    }
  }

  const handleSelectOrder = (orderId: string) => {
    if (selectedOrders.includes(orderId)) {
      setSelectedOrders(selectedOrders.filter(id => id !== orderId))
    } else {
      setSelectedOrders([...selectedOrders, orderId])
    }
  }

  const handleViewOrder = (order: any) => {
    setSelectedOrder(order)
    setShowOrderModal(true)
  }

  const handleUpdateStatus = (orderId: string, newStatus: string) => {
    toast.success(`Order ${orderId} status updated to ${newStatus}`)
  }

  const handleBulkAction = (action: string) => {
    if (selectedOrders.length === 0) {
      toast.error('Please select orders first')
      return
    }
    
    switch (action) {
      case 'export':
        toast.success(`${selectedOrders.length} orders exported`)
        break
      case 'mark-shipped':
        toast.success(`${selectedOrders.length} orders marked as shipped`)
        setSelectedOrders([])
        break
      case 'mark-delivered':
        toast.success(`${selectedOrders.length} orders marked as delivered`)
        setSelectedOrders([])
        break
    }
  }

  const getStatusBadge = (status: string) => {
    const badges: any = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: ClockIcon },
      processing: { bg: 'bg-blue-100', text: 'text-blue-700', icon: CheckCircleIcon },
      shipped: { bg: 'bg-purple-100', text: 'text-purple-700', icon: TruckIcon },
      delivered: { bg: 'bg-green-100', text: 'text-green-700', icon: CheckCircleIcon },
      cancelled: { bg: 'bg-red-100', text: 'text-red-700', icon: XCircleIcon }
    }
    return badges[status] || badges.pending
  }

  const getPaymentStatusBadge = (status: string) => {
    const badges: any = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
      completed: { bg: 'bg-green-100', text: 'text-green-700' },
      refunded: { bg: 'bg-red-100', text: 'text-red-700' },
      failed: { bg: 'bg-red-100', text: 'text-red-700' }
    }
    return badges[status] || badges.pending
  }

  const stats = {
    totalOrders: mockOrders.length,
    totalRevenue: mockOrders.reduce((sum, order) => sum + (order.status !== 'cancelled' ? order.commission : 0), 0),
    pendingOrders: mockOrders.filter(o => o.status === 'pending').length,
    completedOrders: mockOrders.filter(o => o.status === 'delivered').length
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card bg-gradient-to-br from-blue-50 to-blue-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 font-medium">Total Orders</p>
              <p className="text-2xl font-bold text-blue-900">{stats.totalOrders}</p>
              <p className="text-xs text-blue-600 mt-1">All time orders</p>
            </div>
            <ShoppingCartIcon className="h-10 w-10 text-blue-500" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-green-50 to-green-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 font-medium">Total Revenue</p>
              <p className="text-2xl font-bold text-green-900">{formatPrice(stats.totalRevenue)}</p>
              <p className="text-xs text-green-600 mt-1">Commission earned</p>
            </div>
            <CurrencyDollarIcon className="h-10 w-10 text-green-500" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-yellow-50 to-yellow-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-yellow-600 font-medium">Pending Orders</p>
              <p className="text-2xl font-bold text-yellow-900">{stats.pendingOrders}</p>
              <p className="text-xs text-yellow-600 mt-1">Awaiting processing</p>
            </div>
            <ClockIcon className="h-10 w-10 text-yellow-500" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-purple-50 to-purple-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-600 font-medium">Completed Orders</p>
              <p className="text-2xl font-bold text-purple-900">{stats.completedOrders}</p>
              <p className="text-xs text-purple-600 mt-1">Successfully delivered</p>
            </div>
            <CheckCircleIcon className="h-10 w-10 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Filters and Actions */}
      <div className="card">
        <div className="flex flex-wrap gap-4 justify-between items-center">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search orders..."
                className="input-field pl-10"
              />
            </div>
            
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="input-field w-auto"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div className="flex gap-2">
            <button className="btn-outline flex items-center gap-2">
              <ArrowDownTrayIcon className="h-4 w-4" />
              Export
            </button>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedOrders.length > 0 && (
          <div className="mt-4 p-3 bg-primary-50 rounded-lg flex justify-between items-center">
            <span className="text-sm text-primary-700">
              {selectedOrders.length} order(s) selected
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => handleBulkAction('export')}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                Export
              </button>
              <button
                onClick={() => handleBulkAction('mark-shipped')}
                className="text-sm text-purple-600 hover:text-purple-700"
              >
                Mark Shipped
              </button>
              <button
                onClick={() => handleBulkAction('mark-delivered')}
                className="text-sm text-green-600 hover:text-green-700"
              >
                Mark Delivered
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Orders Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedOrders.length === filteredOrders.length && filteredOrders.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Buyer</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Seller</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredOrders.map((order) => {
                const statusStyle = getStatusBadge(order.status)
                const paymentStyle = getPaymentStatusBadge(order.paymentStatus)
                const StatusIcon = statusStyle.icon
                
                return (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedOrders.includes(order.id)}
                        onChange={() => handleSelectOrder(order.id)}
                        className="rounded border-gray-300"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{order.id}</div>
                      <div className={`text-xs px-2 py-1 rounded-full inline-block mt-1 ${paymentStyle.bg} ${paymentStyle.text}`}>
                        {order.paymentStatus}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={order.productImage}
                          alt={order.productTitle}
                          className="h-10 w-10 rounded-lg object-cover"
                        />
                        <div>
                          <p className="font-medium text-gray-900 line-clamp-1">{order.productTitle}</p>
                          {order.trackingNumber && (
                            <p className="text-xs text-gray-500">Tracking: {order.trackingNumber}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm">
                        <p className="font-medium text-gray-900">{order.buyerName}</p>
                        <p className="text-gray-600">@{order.buyer}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm">
                        <p className="font-medium text-gray-900">{order.sellerName}</p>
                        <p className="text-gray-600">@{order.seller}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm">
                        <p className="font-medium text-gray-900">{formatPrice(order.amount)}</p>
                        <p className="text-xs text-green-600">Fee: {formatPrice(order.commission)}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusStyle.bg} ${statusStyle.text}`}>
                        <StatusIcon className="h-3 w-3" />
                        {order.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <CalendarIcon className="h-3 w-3" />
                          {order.orderDate}
                        </div>
                        {order.expectedDelivery && (
                          <p className="text-xs mt-1">Est: {order.expectedDelivery}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleViewOrder(order)}
                          className="p-1 text-gray-600 hover:text-primary-600"
                          title="View Details"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </button>
                        {order.status === 'pending' && (
                          <button
                            onClick={() => handleUpdateStatus(order.id, 'processing')}
                            className="p-1 text-gray-600 hover:text-blue-600"
                            title="Mark Processing"
                          >
                            <CheckCircleIcon className="h-4 w-4" />
                          </button>
                        )}
                        {order.status === 'processing' && (
                          <button
                            onClick={() => handleUpdateStatus(order.id, 'shipped')}
                            className="p-1 text-gray-600 hover:text-purple-600"
                            title="Mark Shipped"
                          >
                            <TruckIcon className="h-4 w-4" />
                          </button>
                        )}
                        {order.status === 'shipped' && (
                          <button
                            onClick={() => handleUpdateStatus(order.id, 'delivered')}
                            className="p-1 text-gray-600 hover:text-green-600"
                            title="Mark Delivered"
                          >
                            <CheckCircleIcon className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Details Modal */}
      {showOrderModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
          >
            <h3 className="text-xl font-bold text-gray-900 mb-4">Order Details - {selectedOrder.id}</h3>
            
            <div className="space-y-6">
              {/* Product Info */}
              <div className="border rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">Product Information</h4>
                <div className="flex items-center gap-4">
                  <img
                    src={selectedOrder.productImage}
                    alt={selectedOrder.productTitle}
                    className="h-16 w-16 rounded-lg object-cover"
                  />
                  <div>
                    <p className="font-medium text-gray-900">{selectedOrder.productTitle}</p>
                    <p className="text-2xl font-bold text-primary-600">{formatPrice(selectedOrder.amount)}</p>
                  </div>
                </div>
              </div>

              {/* Customer Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">Buyer Information</h4>
                  <div className="space-y-2">
                    <p><span className="text-gray-600">Name:</span> {selectedOrder.buyerName}</p>
                    <p><span className="text-gray-600">Username:</span> @{selectedOrder.buyer}</p>
                    <p><span className="text-gray-600">Email:</span> {selectedOrder.buyerEmail}</p>
                  </div>
                </div>
                
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">Seller Information</h4>
                  <div className="space-y-2">
                    <p><span className="text-gray-600">Name:</span> {selectedOrder.sellerName}</p>
                    <p><span className="text-gray-600">Username:</span> @{selectedOrder.seller}</p>
                    <p><span className="text-gray-600">Email:</span> {selectedOrder.sellerEmail}</p>
                  </div>
                </div>
              </div>

              {/* Order Status & Payment */}
              <div className="grid grid-cols-2 gap-4">
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">Order Status</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600">Current Status:</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(selectedOrder.status).bg} ${getStatusBadge(selectedOrder.status).text}`}>
                        {selectedOrder.status}
                      </span>
                    </div>
                    <p><span className="text-gray-600">Order Date:</span> {selectedOrder.orderDate}</p>
                    {selectedOrder.expectedDelivery && (
                      <p><span className="text-gray-600">Expected Delivery:</span> {selectedOrder.expectedDelivery}</p>
                    )}
                    {selectedOrder.trackingNumber && (
                      <p><span className="text-gray-600">Tracking:</span> {selectedOrder.trackingNumber}</p>
                    )}
                  </div>
                </div>
                
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">Payment Details</h4>
                  <div className="space-y-2">
                    <p><span className="text-gray-600">Order Amount:</span> {formatPrice(selectedOrder.amount)}</p>
                    <p><span className="text-gray-600">Commission:</span> {formatPrice(selectedOrder.commission)}</p>
                    <p><span className="text-gray-600">Net to Seller:</span> {formatPrice(selectedOrder.netAmount)}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600">Payment Status:</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPaymentStatusBadge(selectedOrder.paymentStatus).bg} ${getPaymentStatusBadge(selectedOrder.paymentStatus).text}`}>
                        {selectedOrder.paymentStatus}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Shipping Address */}
              <div className="border rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">Shipping Address</h4>
                <p className="text-gray-700">{selectedOrder.shippingAddress}</p>
              </div>

              {/* Update Status */}
              <div className="border rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">Update Order Status</h4>
                <div className="flex gap-2">
                  {selectedOrder.status === 'pending' && (
                    <button
                      onClick={() => {
                        handleUpdateStatus(selectedOrder.id, 'processing')
                        setShowOrderModal(false)
                      }}
                      className="btn-primary"
                    >
                      Mark as Processing
                    </button>
                  )}
                  {selectedOrder.status === 'processing' && (
                    <button
                      onClick={() => {
                        handleUpdateStatus(selectedOrder.id, 'shipped')
                        setShowOrderModal(false)
                      }}
                      className="btn-primary"
                    >
                      Mark as Shipped
                    </button>
                  )}
                  {selectedOrder.status === 'shipped' && (
                    <button
                      onClick={() => {
                        handleUpdateStatus(selectedOrder.id, 'delivered')
                        setShowOrderModal(false)
                      }}
                      className="btn-primary"
                    >
                      Mark as Delivered
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowOrderModal(false)}
                className="btn-outline flex-1"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  )
}

export default AdminOrders
