import { Link, Outlet, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useState } from 'react'
import {
  HomeIcon,
  UserGroupIcon,
  ShoppingBagIcon,
  ClipboardDocumentListIcon,
  TagIcon,
  ChartBarIcon,
  CogIcon,
  ArrowLeftIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  BellIcon,
  ShieldCheckIcon,
  Bars3Icon,
  XMarkIcon,
  BanknotesIcon,
  TruckIcon
} from '@heroicons/react/24/outline'

const AdminLayout = () => {
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const menuItems = [
    {
      path: '/admin/dashboard',
      name: 'Dashboard',
      icon: HomeIcon,
      description: 'Overview & Analytics'
    },
    {
      path: '/admin/users',
      name: 'Manage Users',
      icon: UserGroupIcon,
      description: 'User Management'
    },
    {
      path: '/admin/products',
      name: 'Manage Products',
      icon: ShoppingBagIcon,
      description: 'Product Listings'
    },
    {
      path: '/admin/orders',
      name: 'All Orders',
      icon: ClipboardDocumentListIcon,
      description: 'Order Management'
    },
    {
      path: '/admin/categories',
      name: 'Categories',
      icon: TagIcon,
      description: 'Category Management'
    },
    {
      path: '/admin/reports',
      name: 'Generate Reports',
      icon: DocumentTextIcon,
      description: 'Analytics & Reports'
    },
    {
      path: '/admin/payments',
      name: 'Payments',
      icon: CurrencyDollarIcon,
      description: 'Payment Management'
    },
    {
      path: '/admin/withdrawals',
      name: 'Withdrawals',
      icon: BanknotesIcon,
      description: 'Withdrawal Requests'
    },
    {
      path: '/admin/shipping',
      name: 'Shipping',
      icon: TruckIcon,
      description: 'Shipping Management'
    },
    {
      path: '/admin/notifications',
      name: 'Notifications',
      icon: BellIcon,
      description: 'System Notifications'
    },
    {
      path: '/admin/settings',
      name: 'Settings',
      icon: CogIcon,
      description: 'System Settings'
    }
  ]

  const isActive = (path: string) => location.pathname === path

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <motion.aside
        initial={{ x: -300 }}
        animate={{ x: 0 }}
        transition={{ duration: 0.3 }}
        className={`
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 fixed lg:relative w-72 bg-white shadow-xl border-r 
          border-gray-200 flex flex-col h-full z-50 transition-transform duration-300
        `}
      >
        {/* Admin Header */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <ShieldCheckIcon className="h-8 w-8 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Admin Panel</h2>
                <p className="text-primary-100 text-sm">Quicksell Management</p>
              </div>
            </div>
            {/* Mobile close button */}
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
          <Link
            to="/"
            className="flex items-center gap-2 text-white/80 hover:text-white transition-colors text-sm"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Back to Main Site
          </Link>
        </div>

        {/* Navigation Menu - Scrollable */}
        <div className="flex-1 overflow-y-auto">
          <nav className="p-4">
            <div className="space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon
                const active = isActive(item.path)
                
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className={`
                      group flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200
                      ${active 
                        ? 'bg-primary-50 text-primary-700 shadow-sm' 
                        : 'text-gray-700 hover:bg-gray-50 hover:text-primary-600'
                      }
                    `}
                  >
                    <div className={`
                      p-2 rounded-lg transition-colors
                      ${active 
                        ? 'bg-primary-100' 
                        : 'bg-gray-100 group-hover:bg-primary-50'
                      }
                    `}>
                      <Icon className={`
                        h-5 w-5 transition-colors
                        ${active ? 'text-primary-700' : 'text-gray-600 group-hover:text-primary-600'}
                      `} />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{item.name}</p>
                      <p className={`
                        text-xs transition-colors
                        ${active ? 'text-primary-600' : 'text-gray-500'}
                      `}>
                        {item.description}
                      </p>
                    </div>
                    {active && (
                      <motion.div
                        layoutId="activeIndicator"
                        className="w-1 h-8 bg-primary-600 rounded-full"
                        initial={false}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      />
                    )}
                  </Link>
                )
              })}
            </div>
          </nav>

          {/* Admin Stats Card */}
          <div className="p-4">
            <div className="bg-gradient-to-br from-primary-50 to-secondary-50 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Quick Stats</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Active Users</span>
                  <span className="font-semibold text-gray-900">1,234</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Pending Orders</span>
                  <span className="font-semibold text-orange-600">23</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Today's Revenue</span>
                  <span className="font-semibold text-green-600">R45,678</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Admin Profile - Fixed at bottom */}
        <div className="p-4 border-t border-gray-200 bg-white">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center">
              <UserGroupIcon className="h-6 w-6 text-primary-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900">Administrator</p>
              <p className="text-xs text-gray-500">admin@quicksell.com</p>
            </div>
          </div>
        </div>
      </motion.aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Bar - Fixed */}
        <div className="bg-white border-b border-gray-200 px-4 lg:px-8 py-4 flex-shrink-0">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              {/* Mobile menu button */}
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 text-gray-600 hover:text-primary-600 transition-colors"
              >
                <Bars3Icon className="h-6 w-6" />
              </button>
              <div>
                <h1 className="text-xl lg:text-2xl font-bold text-gray-900">
                  {menuItems.find(item => item.path === location.pathname)?.name || 'Admin Panel'}
                </h1>
                <p className="text-xs lg:text-sm text-gray-600 mt-1">
                  {menuItems.find(item => item.path === location.pathname)?.description || 'Manage your platform'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {/* Notification Bell */}
              <button className="relative p-2 text-gray-600 hover:text-primary-600 transition-colors">
                <BellIcon className="h-6 w-6" />
                <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
              </button>
              
              {/* Quick Actions */}
              <button className="btn-primary text-sm">
                Quick Action
              </button>
            </div>
          </div>
        </div>

        {/* Page Content - Scrollable */}
        <div className="flex-1 overflow-y-auto bg-gray-50">
          <div className="p-4 lg:p-8">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminLayout