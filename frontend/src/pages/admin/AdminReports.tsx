import { motion } from 'framer-motion'
import { useState } from 'react'
import {
  DocumentArrowDownIcon,
  CalendarIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  ShoppingBagIcon,
  ArrowTrendingUpIcon,
  PrinterIcon
} from '@heroicons/react/24/outline'
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { formatPrice } from '../../data/mockData'

const AdminReports = () => {
  const [dateRange, setDateRange] = useState('month')
  const [reportType, setReportType] = useState('sales')

  // Mock data for charts
  const salesData = [
    { month: 'Jan', sales: 45000, orders: 120 },
    { month: 'Feb', sales: 52000, orders: 145 },
    { month: 'Mar', sales: 48000, orders: 132 },
    { month: 'Apr', sales: 61000, orders: 168 },
    { month: 'May', sales: 55000, orders: 152 },
    { month: 'Jun', sales: 67000, orders: 185 }
  ]

  const categoryData = [
    { name: 'Electronics', value: 35, color: '#f97316' },
    { name: 'Fashion', value: 25, color: '#0ea5e9' },
    { name: 'Home & Garden', value: 20, color: '#10b981' },
    { name: 'Sports', value: 12, color: '#8b5cf6' },
    { name: 'Others', value: 8, color: '#6b7280' }
  ]

  const topProducts = [
    { name: 'iPhone 14 Pro Max', sales: 45, revenue: 675000 },
    { name: 'MacBook Pro M2', sales: 32, revenue: 896000 },
    { name: 'Samsung TV 55"', sales: 28, revenue: 252000 },
    { name: 'Nike Air Jordan', sales: 67, revenue: 234500 },
    { name: 'Leather Jacket', sales: 41, revenue: 102500 }
  ]

  const reports = [
    {
      title: 'Sales Report',
      type: 'sales',
      icon: CurrencyDollarIcon,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      title: 'User Report',
      type: 'users',
      icon: UserGroupIcon,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      title: 'Product Report',
      type: 'products',
      icon: ShoppingBagIcon,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    },
    {
      title: 'Revenue Report',
      type: 'revenue',
      icon: ArrowTrendingUpIcon,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100'
    }
  ]

  const handleExport = (format: string) => {
    // In real app, generate and download report
    alert(`Exporting ${reportType} report as ${format}...`)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Report Type Selection */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {reports.map((report) => {
          const Icon = report.icon
          return (
            <motion.button
              key={report.type}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setReportType(report.type)}
              className={`
                card text-left transition-all
                ${reportType === report.type 
                  ? 'ring-2 ring-primary-500 shadow-lg' 
                  : 'hover:shadow-md'
                }
              `}
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`p-3 rounded-lg ${report.bgColor}`}>
                  <Icon className={`h-6 w-6 ${report.color}`} />
                </div>
                {reportType === report.type && (
                  <span className="text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded-full">
                    Selected
                  </span>
                )}
              </div>
              <h3 className="font-semibold text-gray-900">{report.title}</h3>
              <p className="text-sm text-gray-600 mt-1">
                Generate {report.type} analytics
              </p>
            </motion.button>
          )
        })}
      </div>

      {/* Date Range and Actions */}
      <div className="card">
        <div className="flex flex-wrap gap-4 justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-gray-500" />
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="input-field w-auto"
              >
                <option value="week">Last Week</option>
                <option value="month">Last Month</option>
                <option value="quarter">Last Quarter</option>
                <option value="year">Last Year</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => window.print()}
              className="btn-outline flex items-center gap-2"
            >
              <PrinterIcon className="h-4 w-4" />
              Print
            </button>
            <button
              onClick={() => handleExport('pdf')}
              className="btn-outline flex items-center gap-2"
            >
              <DocumentArrowDownIcon className="h-4 w-4" />
              Export PDF
            </button>
            <button
              onClick={() => handleExport('excel')}
              className="btn-primary flex items-center gap-2"
            >
              <DocumentArrowDownIcon className="h-4 w-4" />
              Export Excel
            </button>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => formatPrice(Number(value))} />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="sales" 
                stroke="#f97316" 
                strokeWidth={2}
                name="Revenue"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Orders Chart */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Orders Overview</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="orders" fill="#0ea5e9" name="Total Orders" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Category Distribution */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Sales by Category</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}%`}
                outerRadius={100}
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

        {/* Top Products Table */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Products</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 text-sm font-medium text-gray-700">Product</th>
                  <th className="text-center py-2 text-sm font-medium text-gray-700">Sales</th>
                  <th className="text-right py-2 text-sm font-medium text-gray-700">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {topProducts.map((product, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="py-3 text-sm text-gray-900">{product.name}</td>
                    <td className="py-3 text-sm text-gray-600 text-center">{product.sales}</td>
                    <td className="py-3 text-sm font-medium text-gray-900 text-right">
                      {formatPrice(product.revenue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card bg-gradient-to-br from-green-50 to-green-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 font-medium">Total Revenue</p>
              <p className="text-2xl font-bold text-green-900">{formatPrice(2354500)}</p>
              <p className="text-xs text-green-600 mt-1">+12.5% from last period</p>
            </div>
            <ChartBarIcon className="h-10 w-10 text-green-500" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-blue-50 to-blue-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 font-medium">Total Orders</p>
              <p className="text-2xl font-bold text-blue-900">852</p>
              <p className="text-xs text-blue-600 mt-1">+8.3% from last period</p>
            </div>
            <ShoppingBagIcon className="h-10 w-10 text-blue-500" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-purple-50 to-purple-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-600 font-medium">New Users</p>
              <p className="text-2xl font-bold text-purple-900">324</p>
              <p className="text-xs text-purple-600 mt-1">+15.2% from last period</p>
            </div>
            <UserGroupIcon className="h-10 w-10 text-purple-500" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-orange-50 to-orange-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-orange-600 font-medium">Avg Order Value</p>
              <p className="text-2xl font-bold text-orange-900">{formatPrice(2765)}</p>
              <p className="text-xs text-orange-600 mt-1">+3.8% from last period</p>
            </div>
            <CurrencyDollarIcon className="h-10 w-10 text-orange-500" />
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default AdminReports