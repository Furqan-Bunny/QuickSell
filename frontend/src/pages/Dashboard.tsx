import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import {
  ShoppingBagIcon,
  HeartIcon,
  ClockIcon,
  TrophyIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  ArrowRightIcon,
  BellIcon
} from '@heroicons/react/24/outline'
import { mockProducts, formatPrice, getTimeRemaining } from '../data/mockData'

const Dashboard = () => {
  const { user } = useAuthStore()
  const [activeBids, setActiveBids] = useState<any[]>([])
  const [wonAuctions, setWonAuctions] = useState<any[]>([])
  const [watchedItems, setWatchedItems] = useState<any[]>([])
  const [recentActivity, setRecentActivity] = useState<any[]>([])

  useEffect(() => {
    // Load mock data for user dashboard
    loadUserData()
  }, [])

  const loadUserData = () => {
    // Mock active bids
    const userBids = mockProducts.slice(0, 3).map(product => ({
      ...product,
      userBid: product.currentPrice - 500,
      isWinning: Math.random() > 0.5
    }))
    setActiveBids(userBids)

    // Mock won auctions
    const won = mockProducts.slice(3, 5).map(product => ({
      ...product,
      wonPrice: product.currentPrice,
      wonDate: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
    }))
    setWonAuctions(won)

    // Mock watched items
    setWatchedItems(mockProducts.slice(5, 8))

    // Mock recent activity
    const activities = [
      { id: 1, type: 'bid', message: 'You placed a bid on iPhone 14 Pro Max', amount: 16000, time: '2 hours ago' },
      { id: 2, type: 'outbid', message: 'You were outbid on MacBook Pro M2', amount: 20000, time: '5 hours ago' },
      { id: 3, type: 'won', message: 'You won the auction for Nike Air Jordan', amount: 4200, time: '1 day ago' },
      { id: 4, type: 'watching', message: 'Samsung TV auction ends soon', amount: null, time: '2 days ago' }
    ]
    setRecentActivity(activities)
  }

  const stats = [
    {
      title: 'Active Bids',
      value: activeBids.length,
      icon: ShoppingBagIcon,
      color: 'bg-blue-500',
      link: '/my-bids'
    },
    {
      title: 'Won Auctions',
      value: wonAuctions.length,
      icon: TrophyIcon,
      color: 'bg-green-500',
      link: '/orders'
    },
    {
      title: 'Watching',
      value: watchedItems.length,
      icon: HeartIcon,
      color: 'bg-red-500',
      link: '/wishlist'
    },
    {
      title: 'Balance',
      value: formatPrice(user?.balance || 0),
      icon: CurrencyDollarIcon,
      color: 'bg-purple-500',
      link: '/profile'
    }
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-primary-50 to-secondary-50 rounded-xl p-6">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {user?.firstName || user?.username}!
        </h1>
        <p className="text-gray-600 mt-2">
          Here's what's happening with your auctions today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="card hover:shadow-lg transition-shadow"
          >
            <Link to={stat.link} className="block">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                </div>
                <div className={`${stat.color} p-3 rounded-lg bg-opacity-10`}>
                  <stat.icon className={`h-6 w-6 ${stat.color.replace('bg-', 'text-')}`} />
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Active Bids */}
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Your Active Bids</h2>
          <Link to="/my-bids" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
            View All <ArrowRightIcon className="inline h-4 w-4" />
          </Link>
        </div>
        {activeBids.length > 0 ? (
          <div className="space-y-4">
            {activeBids.map((bid) => (
              <div key={bid.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <img
                      src={bid.images[0]}
                      alt={bid.title}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                    <div>
                      <h3 className="font-medium text-gray-900">{bid.title}</h3>
                      <p className="text-sm text-gray-600">
                        Your bid: {formatPrice(bid.userBid)}
                        {bid.isWinning ? (
                          <span className="ml-2 text-green-600 font-medium">Winning</span>
                        ) : (
                          <span className="ml-2 text-red-600 font-medium">Outbid</span>
                        )}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        <ClockIcon className="inline h-3 w-3" /> {getTimeRemaining(bid.endDate)} remaining
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Current Price</p>
                    <p className="text-lg font-semibold text-gray-900">{formatPrice(bid.currentPrice)}</p>
                    <Link to={`/products/${bid.id}`} className="text-primary-600 hover:text-primary-700 text-sm">
                      View Auction
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">
            You haven't placed any bids yet.
            <Link to="/products" className="block mt-2 text-primary-600 hover:text-primary-700">
              Browse Auctions
            </Link>
          </p>
        )}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity Feed */}
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Recent Activity</h2>
            <Link to="/notifications" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
              View All <BellIcon className="inline h-4 w-4" />
            </Link>
          </div>
          <div className="space-y-3">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3 py-2 border-b border-gray-100 last:border-0">
                <div className={`p-2 rounded-full ${
                  activity.type === 'won' ? 'bg-green-100' :
                  activity.type === 'outbid' ? 'bg-red-100' :
                  activity.type === 'bid' ? 'bg-blue-100' :
                  'bg-gray-100'
                }`}>
                  {activity.type === 'won' ? <TrophyIcon className="h-4 w-4 text-green-600" /> :
                   activity.type === 'bid' ? <ShoppingBagIcon className="h-4 w-4 text-blue-600" /> :
                   activity.type === 'outbid' ? <ClockIcon className="h-4 w-4 text-red-600" /> :
                   <HeartIcon className="h-4 w-4 text-gray-600" />}
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900">{activity.message}</p>
                  {activity.amount && (
                    <p className="text-sm font-semibold text-gray-700">{formatPrice(activity.amount)}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Won Auctions */}
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Recently Won</h2>
            <Link to="/orders" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
              View Orders <ArrowRightIcon className="inline h-4 w-4" />
            </Link>
          </div>
          {wonAuctions.length > 0 ? (
            <div className="space-y-4">
              {wonAuctions.map((item) => (
                <div key={item.id} className="flex items-center space-x-4">
                  <img
                    src={item.images[0]}
                    alt={item.title}
                    className="w-16 h-16 object-cover rounded-lg"
                  />
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 text-sm">{item.title}</h3>
                    <p className="text-sm text-gray-600">Won for {formatPrice(item.wonPrice)}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(item.wonDate).toLocaleDateString()}
                    </p>
                  </div>
                  <Link
                    to={`/orders/${item.id}`}
                    className="btn-outline text-sm py-1 px-3"
                  >
                    View Order
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">
              You haven't won any auctions yet.
            </p>
          )}
        </div>
      </div>

      {/* Watched Items */}
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Watched Items</h2>
          <Link to="/wishlist" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
            View Wishlist <HeartIcon className="inline h-4 w-4" />
          </Link>
        </div>
        {watchedItems.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {watchedItems.map((item) => (
              <Link key={item.id} to={`/products/${item.id}`} className="block group">
                <div className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                  <img
                    src={item.images[0]}
                    alt={item.title}
                    className="w-full h-32 object-cover group-hover:scale-105 transition-transform"
                  />
                  <div className="p-3">
                    <h3 className="font-medium text-gray-900 text-sm truncate">{item.title}</h3>
                    <p className="text-sm text-gray-600">Current: {formatPrice(item.currentPrice)}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      <ClockIcon className="inline h-3 w-3" /> {getTimeRemaining(item.endDate)}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">
            Your wishlist is empty.
            <Link to="/products" className="block mt-2 text-primary-600 hover:text-primary-700">
              Browse Auctions
            </Link>
          </p>
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-gradient-to-r from-primary-50 to-secondary-50 rounded-xl p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link to="/products" className="btn-primary text-center">
            Browse Auctions
          </Link>
          <Link to="/my-bids" className="btn-outline text-center">
            My Bids
          </Link>
          <Link to="/wishlist" className="btn-outline text-center">
            Wishlist
          </Link>
          <Link to="/profile" className="btn-outline text-center">
            Profile
          </Link>
        </div>
      </div>
    </motion.div>
  )
}

export default Dashboard