import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  ClockIcon,
  TrophyIcon,
  XCircleIcon,
  ArrowRightIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline'
import { mockProducts, formatPrice, getTimeRemaining } from '../data/mockData'

const MyBids = () => {
  const [activeTab, setActiveTab] = useState('active')
  const [activeBids, setActiveBids] = useState<any[]>([])
  const [wonBids, setWonBids] = useState<any[]>([])
  const [lostBids, setLostBids] = useState<any[]>([])
  const [sortBy, setSortBy] = useState('ending-soon')

  useEffect(() => {
    loadBidData()
  }, [])

  const loadBidData = () => {
    // Mock data for user's bids
    const mockActiveBids = mockProducts.slice(0, 4).map(product => ({
      ...product,
      userBid: product.currentPrice - 500,
      maxBid: product.currentPrice,
      isWinning: Math.random() > 0.5,
      bidCount: Math.floor(Math.random() * 10) + 1,
      lastBidTime: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString()
    }))
    
    const mockWonBids = mockProducts.slice(4, 6).map(product => ({
      ...product,
      userBid: product.currentPrice,
      wonDate: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      paymentStatus: Math.random() > 0.5 ? 'paid' : 'pending'
    }))
    
    const mockLostBids = mockProducts.slice(6, 8).map(product => ({
      ...product,
      userBid: product.currentPrice - 1000,
      winningBid: product.currentPrice,
      endedDate: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
    }))

    setActiveBids(mockActiveBids)
    setWonBids(mockWonBids)
    setLostBids(mockLostBids)
  }

  const tabs = [
    { id: 'active', label: 'Active Bids', count: activeBids.length },
    { id: 'won', label: 'Won', count: wonBids.length },
    { id: 'lost', label: 'Lost', count: lostBids.length }
  ]

  const sortOptions = [
    { value: 'ending-soon', label: 'Ending Soon' },
    { value: 'price-high', label: 'Price: High to Low' },
    { value: 'price-low', label: 'Price: Low to High' },
    { value: 'recent', label: 'Most Recent' }
  ]

  const handleSort = (value: string) => {
    setSortBy(value)
    // Implement sorting logic here
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-50 to-secondary-50 rounded-xl p-6">
        <h1 className="text-3xl font-bold text-gray-900">My Bids</h1>
        <p className="text-gray-600 mt-2">
          Track all your bidding activity in one place
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Active</p>
              <p className="text-2xl font-bold text-gray-900">{activeBids.length}</p>
            </div>
            <ClockIcon className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Winning</p>
              <p className="text-2xl font-bold text-gray-900">
                {activeBids.filter(b => b.isWinning).length}
              </p>
            </div>
            <TrophyIcon className="h-8 w-8 text-green-500" />
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Outbid</p>
              <p className="text-2xl font-bold text-gray-900">
                {activeBids.filter(b => !b.isWinning).length}
              </p>
            </div>
            <XCircleIcon className="h-8 w-8 text-red-500" />
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Won This Month</p>
              <p className="text-2xl font-bold text-gray-900">{wonBids.length}</p>
            </div>
            <TrophyIcon className="h-8 w-8 text-purple-500" />
          </div>
        </div>
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
          onChange={(e) => handleSort(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          {sortOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Content */}
      <div>
        {activeTab === 'active' && (
          <div className="space-y-4">
            {activeBids.length > 0 ? (
              activeBids.map((bid) => (
                <div key={bid.id} className="card hover:shadow-lg transition-shadow">
                  <div className="flex items-start space-x-4">
                    <img
                      src={bid.images[0]}
                      alt={bid.title}
                      className="w-24 h-24 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <Link
                            to={`/products/${bid.id}`}
                            className="text-lg font-semibold text-gray-900 hover:text-primary-600"
                          >
                            {bid.title}
                          </Link>
                          <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                            <span>Your bid: {formatPrice(bid.userBid)}</span>
                            <span>Current: {formatPrice(bid.maxBid)}</span>
                            <span>{bid.bidCount} bids</span>
                          </div>
                          <div className="flex items-center mt-2">
                            {bid.isWinning ? (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                <TrophyIcon className="h-3 w-3 mr-1" />
                                Winning
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                <XCircleIcon className="h-3 w-3 mr-1" />
                                Outbid
                              </span>
                            )}
                            <span className="ml-3 text-sm text-gray-500">
                              <ClockIcon className="inline h-3 w-3" />
                              {getTimeRemaining(bid.endDate)} remaining
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <Link
                            to={`/products/${bid.id}`}
                            className="btn-primary text-sm"
                          >
                            {bid.isWinning ? 'View' : 'Increase Bid'}
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <ClockIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No active bids</h3>
                <p className="text-gray-600 mb-4">
                  Start bidding on items to see them here
                </p>
                <Link to="/products" className="btn-primary">
                  Browse Auctions
                </Link>
              </div>
            )}
          </div>
        )}

        {activeTab === 'won' && (
          <div className="space-y-4">
            {wonBids.length > 0 ? (
              wonBids.map((bid) => (
                <div key={bid.id} className="card hover:shadow-lg transition-shadow">
                  <div className="flex items-start space-x-4">
                    <img
                      src={bid.images[0]}
                      alt={bid.title}
                      className="w-24 h-24 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {bid.title}
                          </h3>
                          <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                            <span>Won for: {formatPrice(bid.userBid)}</span>
                            <span>Won on: {new Date(bid.wonDate).toLocaleDateString()}</span>
                          </div>
                          <div className="mt-2">
                            {bid.paymentStatus === 'paid' ? (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Payment Complete
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                Payment Pending
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right space-y-2">
                          {bid.paymentStatus === 'pending' && (
                            <button className="btn-primary text-sm">
                              Pay Now
                            </button>
                          )}
                          <Link
                            to={`/orders/${bid.id}`}
                            className="btn-outline text-sm block"
                          >
                            View Order
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <TrophyIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No won auctions</h3>
                <p className="text-gray-600">
                  Auctions you win will appear here
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'lost' && (
          <div className="space-y-4">
            {lostBids.length > 0 ? (
              lostBids.map((bid) => (
                <div key={bid.id} className="card hover:shadow-lg transition-shadow">
                  <div className="flex items-start space-x-4">
                    <img
                      src={bid.images[0]}
                      alt={bid.title}
                      className="w-24 h-24 object-cover rounded-lg grayscale opacity-75"
                    />
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {bid.title}
                          </h3>
                          <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                            <span>Your bid: {formatPrice(bid.userBid)}</span>
                            <span>Winning bid: {formatPrice(bid.winningBid)}</span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            Ended: {new Date(bid.endedDate).toLocaleDateString()}
                          </p>
                        </div>
                        <Link
                          to="/products"
                          className="btn-outline text-sm"
                        >
                          Find Similar
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <XCircleIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No lost auctions</h3>
                <p className="text-gray-600">
                  Auctions you didn't win will appear here
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  )
}

export default MyBids