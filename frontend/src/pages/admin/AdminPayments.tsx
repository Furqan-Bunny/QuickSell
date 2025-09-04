import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import axios from '../../config/axios'
import toast from 'react-hot-toast'
import {
  CreditCardIcon,
  BanknotesIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline'
import { formatPrice } from '../../utils/formatters'
import Pagination from '../../components/Pagination'

interface Transaction {
  id: string
  orderId: string
  userId: string
  amount: number
  fee: number
  gateway: string
  status: string
  reference: string
  createdAt: any
  user?: {
    id: string
    name: string
    email: string
  }
  order?: {
    id: string
    productTitle: string
    status: string
  }
}

interface Payout {
  id: string
  sellerId: string
  amount: number
  method: string
  status: string
  reference?: string
  notes?: string
  createdAt: any
  completedAt?: any
  seller?: {
    id: string
    name: string
    email: string
    bankDetails?: any
  }
}

interface PaymentStats {
  totalRevenue: number
  totalOrders: number
  averageOrderValue: number
  platformFees: number
  successRate: number
}

const AdminPayments = () => {
  const [activeTab, setActiveTab] = useState('transactions')
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [payouts, setPayouts] = useState<Payout[]>([])
  const [stats, setStats] = useState<PaymentStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState({
    status: 'all',
    gateway: 'all',
    period: '30d'
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [transactionPage, setTransactionPage] = useState(1)
  const [payoutPage, setPayoutPage] = useState(1)
  const itemsPerPage = 15
  const [showPayoutModal, setShowPayoutModal] = useState(false)
  const [selectedSeller, setSelectedSeller] = useState<any>(null)
  const [payoutForm, setPayoutForm] = useState({
    amount: '',
    method: 'bank_transfer',
    reference: '',
    notes: ''
  })

  useEffect(() => {
    loadPaymentData()
    // Reset page when tab or filter changes
    setTransactionPage(1)
    setPayoutPage(1)
  }, [activeTab, filter])

  const loadPaymentData = async () => {
    setLoading(true)
    try {
      if (activeTab === 'transactions') {
        await loadTransactions()
      } else if (activeTab === 'payouts') {
        await loadPayouts()
      } else if (activeTab === 'analytics') {
        await loadAnalytics()
      }
    } catch (error) {
      console.error('Error loading payment data:', error)
      toast.error('Failed to load payment data')
    } finally {
      setLoading(false)
    }
  }

  const loadTransactions = async () => {
    try {
      const params: any = {}
      if (filter.status !== 'all') params.status = filter.status
      if (filter.gateway !== 'all') params.gateway = filter.gateway
      
      const response = await axios.get('/api/admin-ext/payments/transactions', { params })
      if (response.data.success) {
        setTransactions(response.data.data)
        setStats(response.data.stats)
      }
    } catch (error) {
      console.error('Error loading transactions:', error)
    }
  }

  const loadPayouts = async () => {
    try {
      const params: any = {}
      if (filter.status !== 'all') params.status = filter.status
      
      const response = await axios.get('/api/admin-ext/payments/payouts', { params })
      if (response.data.success) {
        setPayouts(response.data.data)
        setStats(response.data.stats)
      }
    } catch (error) {
      console.error('Error loading payouts:', error)
    }
  }

  const loadAnalytics = async () => {
    try {
      const response = await axios.get('/api/admin-ext/payments/analytics', {
        params: { period: filter.period }
      })
      if (response.data.success) {
        setStats(response.data.data.stats)
      }
    } catch (error) {
      console.error('Error loading analytics:', error)
    }
  }

  const handleProcessPayout = async () => {
    if (!selectedSeller || !payoutForm.amount) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      const response = await axios.post('/api/admin-ext/payments/process-payout', {
        sellerId: selectedSeller.id,
        amount: parseFloat(payoutForm.amount),
        method: payoutForm.method,
        reference: payoutForm.reference,
        notes: payoutForm.notes
      })

      if (response.data.success) {
        toast.success('Payout processed successfully')
        setShowPayoutModal(false)
        setPayoutForm({ amount: '', method: 'bank_transfer', reference: '', notes: '' })
        setSelectedSeller(null)
        loadPayouts()
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to process payout')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'success':
        return 'text-green-600 bg-green-50'
      case 'pending':
      case 'processing':
        return 'text-yellow-600 bg-yellow-50'
      case 'failed':
      case 'rejected':
        return 'text-red-600 bg-red-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
      case 'success':
        return <CheckCircleIcon className="h-4 w-4" />
      case 'pending':
      case 'processing':
        return <ClockIcon className="h-4 w-4" />
      case 'failed':
      case 'rejected':
        return <XCircleIcon className="h-4 w-4" />
      default:
        return null
    }
  }

  const filteredTransactions = transactions.filter(transaction => {
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      return (
        transaction.reference?.toLowerCase().includes(search) ||
        transaction.user?.email?.toLowerCase().includes(search) ||
        transaction.order?.productTitle?.toLowerCase().includes(search)
      )
    }
    return true
  })

  const filteredPayouts = payouts.filter(payout => {
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      return (
        payout.reference?.toLowerCase().includes(search) ||
        payout.seller?.email?.toLowerCase().includes(search) ||
        payout.seller?.name?.toLowerCase().includes(search)
      )
    }
    return true
  })

  // Pagination calculations
  const transactionTotalPages = Math.ceil(filteredTransactions.length / itemsPerPage)
  const paginatedTransactions = filteredTransactions.slice(
    (transactionPage - 1) * itemsPerPage,
    transactionPage * itemsPerPage
  )

  const payoutTotalPages = Math.ceil(filteredPayouts.length / itemsPerPage)
  const paginatedPayouts = filteredPayouts.slice(
    (payoutPage - 1) * itemsPerPage,
    payoutPage * itemsPerPage
  )

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Payment Management</h1>
        <p className="text-gray-600">Manage transactions, payouts, and payment analytics</p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatPrice(stats.totalRevenue || 0)}
                </p>
              </div>
              <BanknotesIcon className="h-8 w-8 text-green-600" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-lg shadow p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Orders</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.totalOrders || 0}
                </p>
              </div>
              <CreditCardIcon className="h-8 w-8 text-blue-600" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-lg shadow p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Order Value</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatPrice(stats.averageOrderValue || 0)}
                </p>
              </div>
              <ArrowTrendingUpIcon className="h-8 w-8 text-purple-600" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-lg shadow p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Platform Fees</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatPrice(stats.platformFees || 0)}
                </p>
              </div>
              <ArrowTrendingDownIcon className="h-8 w-8 text-orange-600" />
            </div>
          </motion.div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
            {['transactions', 'payouts', 'analytics'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`
                  py-4 px-1 border-b-2 font-medium text-sm capitalize
                  ${activeTab === tab
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                `}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search transactions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              </div>
            </div>

            <select
              value={filter.status}
              onChange={(e) => setFilter({ ...filter, status: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>

            {activeTab === 'transactions' && (
              <select
                value={filter.gateway}
                onChange={(e) => setFilter({ ...filter, gateway: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">All Gateways</option>
                <option value="flutterwave">Flutterwave</option>
                <option value="payfast">PayFast</option>
                <option value="wallet">Wallet</option>
              </select>
            )}

            {activeTab === 'analytics' && (
              <select
                value={filter.period}
                onChange={(e) => setFilter({ ...filter, period: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="90d">Last 90 Days</option>
                <option value="1y">Last Year</option>
              </select>
            )}

            {activeTab === 'payouts' && (
              <button
                onClick={() => setShowPayoutModal(true)}
                className="btn-primary flex items-center gap-2"
              >
                <BanknotesIcon className="h-5 w-5" />
                Process Payout
              </button>
            )}
          </div>

          {/* Content */}
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
          ) : (
            <>
              {activeTab === 'transactions' && (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Transaction ID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          User
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Product
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Fee
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Gateway
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {paginatedTransactions.map((transaction) => (
                        <tr key={transaction.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {transaction.reference || transaction.id.slice(0, 8)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <div>
                              <p className="font-medium">{transaction.user?.name || 'Unknown'}</p>
                              <p className="text-xs text-gray-400">{transaction.user?.email}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {transaction.order?.productTitle || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {formatPrice(transaction.amount)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatPrice(transaction.fee || 0)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {transaction.gateway}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(transaction.status)}`}>
                              {getStatusIcon(transaction.status)}
                              {transaction.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {transaction.createdAt ? new Date(transaction.createdAt._seconds * 1000).toLocaleDateString() : 'N/A'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredTransactions.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No transactions found
                    </div>
                  )}
                </div>
              )}
              
              {/* Pagination for Transactions */}
              {activeTab === 'transactions' && transactionTotalPages > 1 && (
                <Pagination
                  currentPage={transactionPage}
                  totalPages={transactionTotalPages}
                  onPageChange={setTransactionPage}
                  className="mt-4"
                />
              )}

              {activeTab === 'payouts' && (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Payout ID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Seller
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Method
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Reference
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {paginatedPayouts.map((payout) => (
                        <tr key={payout.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {payout.id.slice(0, 8)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <div>
                              <p className="font-medium">{payout.seller?.name || 'Unknown'}</p>
                              <p className="text-xs text-gray-400">{payout.seller?.email}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {formatPrice(payout.amount)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {payout.method}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {payout.reference || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(payout.status)}`}>
                              {getStatusIcon(payout.status)}
                              {payout.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {payout.createdAt ? new Date(payout.createdAt._seconds * 1000).toLocaleDateString() : 'N/A'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredPayouts.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No payouts found
                    </div>
                  )}
                </div>
              )}
              
              {/* Pagination for Payouts */}
              {activeTab === 'payouts' && payoutTotalPages > 1 && (
                <Pagination
                  currentPage={payoutPage}
                  totalPages={payoutTotalPages}
                  onPageChange={setPayoutPage}
                  className="mt-4"
                />
              )}

              {activeTab === 'analytics' && stats && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gray-50 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Overview</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Total Revenue</span>
                          <span className="font-semibold">{formatPrice(stats.totalRevenue)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Platform Fees</span>
                          <span className="font-semibold">{formatPrice(stats.platformFees)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Net Revenue</span>
                          <span className="font-semibold">{formatPrice(stats.totalRevenue - stats.platformFees)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Transaction Metrics</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Total Transactions</span>
                          <span className="font-semibold">{stats.totalOrders}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Average Order Value</span>
                          <span className="font-semibold">{formatPrice(stats.averageOrderValue)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Success Rate</span>
                          <span className="font-semibold">{stats.successRate?.toFixed(1)}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Process Payout Modal */}
      {showPayoutModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Process Payout</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Amount</label>
                <input
                  type="number"
                  value={payoutForm.amount}
                  onChange={(e) => setPayoutForm({ ...payoutForm, amount: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Method</label>
                <select
                  value={payoutForm.method}
                  onChange={(e) => setPayoutForm({ ...payoutForm, method: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                >
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="paypal">PayPal</option>
                  <option value="crypto">Cryptocurrency</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Reference</label>
                <input
                  type="text"
                  value={payoutForm.reference}
                  onChange={(e) => setPayoutForm({ ...payoutForm, reference: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  placeholder="Transaction reference"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Notes</label>
                <textarea
                  value={payoutForm.notes}
                  onChange={(e) => setPayoutForm({ ...payoutForm, notes: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  rows={3}
                  placeholder="Optional notes"
                />
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => {
                  setShowPayoutModal(false)
                  setPayoutForm({ amount: '', method: 'bank_transfer', reference: '', notes: '' })
                }}
                className="flex-1 btn-outline"
              >
                Cancel
              </button>
              <button
                onClick={handleProcessPayout}
                className="flex-1 btn-primary"
              >
                Process Payout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminPayments