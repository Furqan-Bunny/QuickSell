import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts'
import {
  CurrencyDollarIcon,
  UserGroupIcon,
  ShoppingBagIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon
} from '@heroicons/react/24/outline'
import { mockProducts, formatPrice } from '../../data/mockData'

interface StatCard {
  title: string
  value: string | number
  change: number
  icon: any
  color: string
}

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalRevenue: 1250000,
    totalUsers: 10234,
    totalProducts: 156,
    totalOrders: 892,
    pendingOrders: 23,
    activeAuctions: 45
  })

  const [revenueData] = useState([
    { month: 'Jan', revenue: 85000 },
    { month: 'Feb', revenue: 95000 },
    { month: 'Mar', revenue: 110000 },
    { month: 'Apr', revenue: 105000 },
    { month: 'May', revenue: 125000 },
    { month: 'Jun', revenue: 140000 }
  ])

  const [categoryData] = useState([
    { name: 'Electronics', value: 35, color: '#3B82F6' },
    { name: 'Fashion', value: 25, color: '#10B981' },
    { name: 'Vehicles', value: 20, color: '#F59E0B' },
    { name: 'Home & Garden', value: 12, color: '#EF4444' },
    { name: 'Others', value: 8, color: '#8B5CF6' }
  ])

  const [userActivityData] = useState([
    { day: 'Mon', logins: 234, registrations: 12 },
    { day: 'Tue', logins: 256, registrations: 18 },
    { day: 'Wed', logins: 289, registrations: 23 },
    { day: 'Thu', logins: 312, registrations: 15 },
    { day: 'Fri', logins: 345, registrations: 28 },
    { day: 'Sat', logins: 378, registrations: 34 },
    { day: 'Sun', logins: 290, registrations: 20 }
  ])

  const [recentOrders] = useState([
    { id: 'ORD001', buyer: 'John Doe', product: 'iPhone 14 Pro', amount: 16500, status: 'completed', date: '2024-01-20' },
    { id: 'ORD002', buyer: 'Jane Smith', product: 'MacBook Pro M2', amount: 28000, status: 'pending', date: '2024-01-20' },
    { id: 'ORD003', buyer: 'Mike Johnson', product: 'Nike Air Jordan', amount: 4200, status: 'completed', date: '2024-01-19' },
    { id: 'ORD004', buyer: 'Sarah Williams', product: 'Samsung TV', amount: 6500, status: 'processing', date: '2024-01-19' },
    { id: 'ORD005', buyer: 'Chris Brown', product: 'Weber Braai', amount: 8000, status: 'completed', date: '2024-01-18' }
  ])

  const [topProducts] = useState([
    { name: 'iPhone 14 Pro Max', bids: 234, views: 1567, revenue: 125000 },
    { name: '2019 VW Polo GTI', bids: 89, views: 3456, revenue: 285000 },
    { name: 'Krugerrand Collection', bids: 45, views: 2890, revenue: 125000 },
    { name: 'Springboks Jersey', bids: 156, views: 4567, revenue: 62000 }
  ])

  const statCards: StatCard[] = [
    {
      title: 'Total Revenue',
      value: formatPrice(stats.totalRevenue),
      change: 12.5,
      icon: CurrencyDollarIcon,
      color: 'bg-green-500'
    },
    {
      title: 'Total Users',
      value: stats.totalUsers.toLocaleString(),
      change: 8.2,
      icon: UserGroupIcon,
      color: 'bg-blue-500'
    },
    {
      title: 'Active Auctions',
      value: stats.activeAuctions,
      change: -3.1,
      icon: ClockIcon,
      color: 'bg-purple-500'
    },
    {
      title: 'Total Orders',
      value: stats.totalOrders,
      change: 15.7,
      icon: ShoppingBagIcon,
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
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome back! Here's what's happening with your platform today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
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
                <div className="flex items-center mt-2">
                  {stat.change > 0 ? (
                    <ArrowTrendingUpIcon className="h-4 w-4 text-green-500 mr-1" />
                  ) : (
                    <ArrowTrendingDownIcon className="h-4 w-4 text-red-500 mr-1" />
                  )}
                  <span className={`text-sm ${stat.change > 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {Math.abs(stat.change)}%
                  </span>
                  <span className="text-xs text-gray-500 ml-1">vs last month</span>
                </div>
              </div>
              <div className={`${stat.color} p-3 rounded-lg bg-opacity-10`}>
                <stat.icon className={`h-6 w-6 ${stat.color.replace('bg-', 'text-')}`} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Revenue Overview</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => formatPrice(Number(value))} />
              <Legend />
              <Line type="monotone" dataKey="revenue" stroke="#3B82F6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Category Distribution */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Sales by Category</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => `${entry.name}: ${entry.value}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* User Activity Chart */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">User Activity This Week</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={userActivityData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="logins" fill="#3B82F6" />
            <Bar dataKey="registrations" fill="#10B981" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Tables Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Orders</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Order ID</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Buyer</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {recentOrders.map((order) => (
                  <tr key={order.id}>
                    <td className="px-4 py-2 text-sm font-medium text-gray-900">{order.id}</td>
                    <td className="px-4 py-2 text-sm text-gray-600">{order.buyer}</td>
                    <td className="px-4 py-2 text-sm text-gray-900">{formatPrice(order.amount)}</td>
                    <td className="px-4 py-2">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        order.status === 'completed' ? 'bg-green-100 text-green-800' :
                        order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {order.status === 'completed' && <CheckCircleIcon className="h-3 w-3 mr-1" />}
                        {order.status === 'pending' && <ClockIcon className="h-3 w-3 mr-1" />}
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Products */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Products</h2>
          <div className="space-y-3">
            {topProducts.map((product, index) => (
              <div key={product.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-semibold text-primary-600">#{index + 1}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{product.name}</p>
                    <div className="flex items-center space-x-3 mt-1">
                      <span className="text-xs text-gray-500 flex items-center">
                        <EyeIcon className="h-3 w-3 mr-1" />
                        {product.views} views
                      </span>
                      <span className="text-xs text-gray-500">
                        {product.bids} bids
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">{formatPrice(product.revenue)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="btn-primary">
            Add Product
          </button>
          <button className="btn-outline">
            View All Orders
          </button>
          <button className="btn-outline">
            Manage Users
          </button>
          <button className="btn-outline">
            Generate Report
          </button>
        </div>
      </div>
    </motion.div>
  )
}

export default AdminDashboard