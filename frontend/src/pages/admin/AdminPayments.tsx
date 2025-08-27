import { motion } from 'framer-motion'
import { useState } from 'react'
import {
  CreditCardIcon,
  BanknotesIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  FunnelIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline'
import { formatPrice } from '../../data/mockData'

const AdminPayments = () => {
  const [activeTab, setActiveTab] = useState('transactions')
  const [filterStatus, setFilterStatus] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Mock payment data
  const transactions = [
    {
      id: 'TXN001',
      orderId: 'ORD123',
      user: 'John Doe',
      amount: 15000,
      fee: 450,
      net: 14550,
      method: 'card',
      status: 'completed',
      date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      gateway: 'Flutterwave'
    },
    {
      id: 'TXN002',
      orderId: 'ORD124',
      user: 'Sarah Smith',
      amount: 8500,
      fee: 255,
      net: 8245,
      method: 'bank',
      status: 'pending',
      date: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      gateway: 'PayFast'
    },
    {
      id: 'TXN003',
      orderId: 'ORD125',
      user: 'Mike Wilson',
      amount: 32000,
      fee: 960,
      net: 31040,
      method: 'card',
      status: 'completed',
      date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      gateway: 'Flutterwave'
    },
    {
      id: 'TXN004',
      orderId: 'ORD126',
      user: 'Emma Davis',
      amount: 5500,
      fee: 165,
      net: 5335,
      method: 'mobile',
      status: 'failed',
      date: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
      gateway: 'PayFast'
    },
    {
      id: 'TXN005',
      orderId: 'ORD127',
      user: 'Tom Brown',
      amount: 18900,
      fee: 567,
      net: 18333,
      method: 'card',
      status: 'refunded',
      date: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
      gateway: 'Flutterwave'
    }
  ]

  const payouts = [
    {
      id: 'PAY001',
      seller: 'TechStore',
      amount: 125000,
      status: 'completed',
      date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      bankAccount: '****1234',
      method: 'Bank Transfer'
    },
    {
      id: 'PAY002',
      seller: 'FashionHub',
      amount: 87500,
      status: 'processing',
      date: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
      bankAccount: '****5678',
      method: 'Bank Transfer'
    },
    {
      id: 'PAY003',
      seller: 'SportsGear',
      amount: 43200,
      status: 'scheduled',
      date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      bankAccount: '****9012',
      method: 'Bank Transfer'
    }
  ]

  const getStatusBadge = (status: string) => {
    const badges: any = {
      completed: { bg: 'bg-green-100', text: 'text-green-700', icon: CheckCircleIcon },
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: ClockIcon },
      failed: { bg: 'bg-red-100', text: 'text-red-700', icon: XCircleIcon },
      refunded: { bg: 'bg-gray-100', text: 'text-gray-700', icon: ArrowDownTrayIcon },
      processing: { bg: 'bg-blue-100', text: 'text-blue-700', icon: ClockIcon },
      scheduled: { bg: 'bg-purple-100', text: 'text-purple-700', icon: ClockIcon }
    }
    return badges[status] || badges.pending
  }

  const getMethodIcon = (method: string) => {
    const icons: any = {
      card: '💳',
      bank: '🏦',
      mobile: '📱',
      wallet: '👛'
    }
    return icons[method] || '💰'
  }

  const filteredTransactions = transactions.filter(t => {
    const matchesStatus = filterStatus === 'all' || t.status === filterStatus
    const matchesSearch = t.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          t.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          t.orderId.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesStatus && matchesSearch
  })

  const stats = {
    totalRevenue: transactions.filter(t => t.status === 'completed').reduce((sum, t) => sum + t.amount, 0),
    totalFees: transactions.filter(t => t.status === 'completed').reduce((sum, t) => sum + t.fee, 0),
    pendingAmount: transactions.filter(t => t.status === 'pending').reduce((sum, t) => sum + t.amount, 0),
    failedTransactions: transactions.filter(t => t.status === 'failed').length
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card bg-gradient-to-br from-green-50 to-green-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 font-medium">Total Revenue</p>
              <p className="text-2xl font-bold text-green-900">{formatPrice(stats.totalRevenue)}</p>
              <p className="text-xs text-green-600 mt-1">This month</p>
            </div>
            <BanknotesIcon className="h-10 w-10 text-green-500" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-blue-50 to-blue-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 font-medium">Platform Fees</p>
              <p className="text-2xl font-bold text-blue-900">{formatPrice(stats.totalFees)}</p>
              <p className="text-xs text-blue-600 mt-1">3% average</p>
            </div>
            <CreditCardIcon className="h-10 w-10 text-blue-500" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-yellow-50 to-yellow-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-yellow-600 font-medium">Pending</p>
              <p className="text-2xl font-bold text-yellow-900">{formatPrice(stats.pendingAmount)}</p>
              <p className="text-xs text-yellow-600 mt-1">Awaiting confirmation</p>
            </div>
            <ClockIcon className="h-10 w-10 text-yellow-500" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-red-50 to-red-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-600 font-medium">Failed</p>
              <p className="text-2xl font-bold text-red-900">{stats.failedTransactions}</p>
              <p className="text-xs text-red-600 mt-1">Transactions</p>
            </div>
            <ExclamationTriangleIcon className="h-10 w-10 text-red-500" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('transactions')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'transactions'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Transactions
          </button>
          <button
            onClick={() => setActiveTab('payouts')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'payouts'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Seller Payouts
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'settings'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Payment Settings
          </button>
        </nav>
      </div>

      {/* Content based on active tab */}
      {activeTab === 'transactions' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="card">
            <div className="flex flex-wrap gap-4 justify-between items-center">
              <div className="flex items-center gap-4 flex-1">
                <div className="relative flex-1 max-w-md">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search transactions..."
                    className="input-field pl-10"
                  />
                </div>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="input-field w-auto"
                >
                  <option value="all">All Status</option>
                  <option value="completed">Completed</option>
                  <option value="pending">Pending</option>
                  <option value="failed">Failed</option>
                  <option value="refunded">Refunded</option>
                </select>
              </div>
              <button className="btn-primary flex items-center gap-2">
                <ArrowDownTrayIcon className="h-4 w-4" />
                Export
              </button>
            </div>
          </div>

          {/* Transactions Table */}
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fee</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Net</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Gateway</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredTransactions.map((transaction) => {
                    const statusStyle = getStatusBadge(transaction.status)
                    const StatusIcon = statusStyle.icon
                    
                    return (
                      <tr key={transaction.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-mono">{transaction.id}</td>
                        <td className="px-4 py-3 text-sm">{transaction.user}</td>
                        <td className="px-4 py-3 text-sm font-medium">{formatPrice(transaction.amount)}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{formatPrice(transaction.fee)}</td>
                        <td className="px-4 py-3 text-sm font-medium">{formatPrice(transaction.net)}</td>
                        <td className="px-4 py-3 text-sm">
                          <span className="text-lg">{getMethodIcon(transaction.method)}</span>
                        </td>
                        <td className="px-4 py-3 text-sm">{transaction.gateway}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusStyle.bg} ${statusStyle.text}`}>
                            <StatusIcon className="h-3 w-3" />
                            {transaction.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {new Date(transaction.date).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <button className="text-primary-600 hover:text-primary-700">
                            View
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'payouts' && (
        <div className="space-y-4">
          {/* Payout Actions */}
          <div className="card">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Scheduled Payouts</h3>
              <div className="flex gap-2">
                <button className="btn-outline">Schedule Payout</button>
                <button className="btn-primary flex items-center gap-2">
                  <ArrowUpTrayIcon className="h-4 w-4" />
                  Process Payouts
                </button>
              </div>
            </div>
          </div>

          {/* Payouts Table */}
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Seller</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bank Account</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {payouts.map((payout) => {
                    const statusStyle = getStatusBadge(payout.status)
                    const StatusIcon = statusStyle.icon
                    
                    return (
                      <tr key={payout.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-mono">{payout.id}</td>
                        <td className="px-4 py-3 text-sm font-medium">{payout.seller}</td>
                        <td className="px-4 py-3 text-sm font-medium">{formatPrice(payout.amount)}</td>
                        <td className="px-4 py-3 text-sm font-mono">{payout.bankAccount}</td>
                        <td className="px-4 py-3 text-sm">{payout.method}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusStyle.bg} ${statusStyle.text}`}>
                            <StatusIcon className="h-3 w-3" />
                            {payout.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {new Date(payout.date).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <button className="text-primary-600 hover:text-primary-700">
                            Details
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Payment Gateways */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Gateways</h3>
            <div className="space-y-4">
              <div className="p-4 border border-gray-200 rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-medium text-gray-900">Flutterwave</h4>
                    <p className="text-sm text-gray-600">African payment gateway</p>
                  </div>
                  <span className="badge bg-green-100 text-green-700">Active</span>
                </div>
                <div className="text-sm text-gray-500 mt-2">
                  Fee: 2.9% + R2.00
                </div>
                <button className="text-primary-600 text-sm mt-2">Configure →</button>
              </div>

              <div className="p-4 border border-gray-200 rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-medium text-gray-900">PayFast</h4>
                    <p className="text-sm text-gray-600">South African gateway</p>
                  </div>
                  <span className="badge bg-green-100 text-green-700">Active</span>
                </div>
                <div className="text-sm text-gray-500 mt-2">
                  Fee: 3.0% + R3.00
                </div>
                <button className="text-primary-600 text-sm mt-2">Configure →</button>
              </div>
            </div>
          </div>

          {/* Fee Settings */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Platform Fees</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Transaction Fee (%)
                </label>
                <input type="number" defaultValue="3" className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Minimum Fee (ZAR)
                </label>
                <input type="number" defaultValue="5" className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Maximum Fee (ZAR)
                </label>
                <input type="number" defaultValue="500" className="input-field" />
              </div>
              <button className="btn-primary w-full">Save Settings</button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  )
}

export default AdminPayments