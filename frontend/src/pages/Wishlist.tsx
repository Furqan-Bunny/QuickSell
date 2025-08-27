import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  HeartIcon as HeartIconOutline,
  ClockIcon,
  EyeIcon,
  ShoppingBagIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  TrashIcon,
  ShareIcon,
  BellIcon
} from '@heroicons/react/24/outline'
import {
  HeartIcon as HeartIconSolid
} from '@heroicons/react/24/solid'
import { mockProducts, formatPrice, getTimeRemaining, categories } from '../data/mockData'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'

interface WishlistItem {
  id: string
  product: any
  addedDate: string
  priceAlert?: {
    enabled: boolean
    targetPrice: number
  }
  notes?: string
}

const Wishlist = () => {
  const { user } = useAuthStore()
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([])
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [sortBy, setSortBy] = useState('recent')
  const [filterCategory, setFilterCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [priceRange, setPriceRange] = useState({ min: '', max: '' })

  useEffect(() => {
    loadWishlist()
  }, [])

  const loadWishlist = () => {
    // Mock wishlist data
    const mockWishlist: WishlistItem[] = [
      {
        id: 'wish-1',
        product: mockProducts[0], // iPhone 14 Pro Max
        addedDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        priceAlert: {
          enabled: true,
          targetPrice: 16000
        },
        notes: 'Need 256GB version in Deep Purple'
      },
      {
        id: 'wish-2',
        product: mockProducts[1], // Volkswagen Polo GTI
        addedDate: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
        priceAlert: {
          enabled: false,
          targetPrice: 300000
        }
      },
      {
        id: 'wish-3',
        product: mockProducts[4], // Gold Coins
        addedDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        priceAlert: {
          enabled: true,
          targetPrice: 130000
        },
        notes: 'Investment piece - waiting for good price'
      },
      {
        id: 'wish-4', 
        product: mockProducts[6], // Springboks Jersey
        addedDate: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
        priceAlert: {
          enabled: true,
          targetPrice: 5500
        }
      },
      {
        id: 'wish-5',
        product: mockProducts[7], // Weber Braai
        addedDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        priceAlert: {
          enabled: false,
          targetPrice: 10000
        },
        notes: 'Perfect for summer braais!'
      },
      {
        id: 'wish-6',
        product: mockProducts[9], // Leather Jacket
        addedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        priceAlert: {
          enabled: true,
          targetPrice: 3000
        }
      }
    ]

    setWishlistItems(mockWishlist)
  }

  const removeFromWishlist = (itemId: string) => {
    setWishlistItems(prev => prev.filter(item => item.id !== itemId))
    toast.success('Item removed from wishlist')
  }

  const togglePriceAlert = (itemId: string) => {
    setWishlistItems(prev => prev.map(item => 
      item.id === itemId 
        ? { ...item, priceAlert: { ...item.priceAlert!, enabled: !item.priceAlert!.enabled } }
        : item
    ))
    toast.success('Price alert updated')
  }

  const updatePriceAlert = (itemId: string, targetPrice: number) => {
    setWishlistItems(prev => prev.map(item => 
      item.id === itemId 
        ? { ...item, priceAlert: { ...item.priceAlert!, targetPrice } }
        : item
    ))
    toast.success('Price alert updated')
  }

  const filteredItems = wishlistItems.filter(item => {
    if (filterCategory !== 'all' && item.product.categoryId !== filterCategory) return false
    if (searchQuery && !item.product.title.toLowerCase().includes(searchQuery.toLowerCase())) return false
    if (priceRange.min && item.product.currentPrice < parseInt(priceRange.min)) return false
    if (priceRange.max && item.product.currentPrice > parseInt(priceRange.max)) return false
    return true
  })

  const sortedItems = [...filteredItems].sort((a, b) => {
    switch (sortBy) {
      case 'price-low': return a.product.currentPrice - b.product.currentPrice
      case 'price-high': return b.product.currentPrice - a.product.currentPrice
      case 'ending-soon': return new Date(a.product.endDate).getTime() - new Date(b.product.endDate).getTime()
      case 'recent': return new Date(b.addedDate).getTime() - new Date(a.addedDate).getTime()
      case 'oldest': return new Date(a.addedDate).getTime() - new Date(b.addedDate).getTime()
      default: return 0
    }
  })

  const stats = [
    {
      title: 'Total Items',
      value: wishlistItems.length,
      icon: HeartIconOutline,
      color: 'bg-red-500'
    },
    {
      title: 'Price Alerts',
      value: wishlistItems.filter(item => item.priceAlert?.enabled).length,
      icon: BellIcon,
      color: 'bg-blue-500'
    },
    {
      title: 'Ending Soon',
      value: wishlistItems.filter(item => {
        const timeLeft = new Date(item.product.endDate).getTime() - new Date().getTime()
        return timeLeft < 24 * 60 * 60 * 1000 // Less than 24 hours
      }).length,
      icon: ClockIcon,
      color: 'bg-orange-500'
    },
    {
      title: 'Avg. Price',
      value: wishlistItems.length > 0 
        ? formatPrice(wishlistItems.reduce((sum, item) => sum + item.product.currentPrice, 0) / wishlistItems.length)
        : formatPrice(0),
      icon: ShoppingBagIcon,
      color: 'bg-green-500'
    }
  ]

  const WishlistCard = ({ item, isGrid = true }: { item: WishlistItem; isGrid?: boolean }) => {
    const timeRemaining = getTimeRemaining(item.product.endDate)
    const isEndingSoon = new Date(item.product.endDate).getTime() - new Date().getTime() < 24 * 60 * 60 * 1000

    if (isGrid) {
      return (
        <motion.div
          layout
          className="card hover:shadow-lg transition-all group"
        >
          <div className="relative">
            <img
              src={item.product.images[0]}
              alt={item.product.title}
              className="w-full h-48 object-cover rounded-t-lg group-hover:scale-105 transition-transform"
            />
            {isEndingSoon && (
              <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                Ending Soon!
              </div>
            )}
            <div className="absolute top-2 right-2 flex space-x-1">
              <button
                onClick={() => removeFromWishlist(item.id)}
                className="p-1.5 bg-white/80 hover:bg-white rounded-full transition-colors"
                title="Remove from wishlist"
              >
                <TrashIcon className="h-4 w-4 text-red-500" />
              </button>
              <button className="p-1.5 bg-white/80 hover:bg-white rounded-full transition-colors">
                <ShareIcon className="h-4 w-4 text-gray-600" />
              </button>
            </div>
          </div>

          <div className="p-4">
            <Link to={`/products/${item.product.id}`} className="block group-hover:text-primary-600">
              <h3 className="font-semibold text-gray-900 line-clamp-2">{item.product.title}</h3>
            </Link>
            
            <div className="flex items-center justify-between mt-2">
              <div>
                <p className="text-lg font-bold text-primary-600">{formatPrice(item.product.currentPrice)}</p>
                {item.priceAlert?.enabled && item.product.currentPrice <= item.priceAlert.targetPrice && (
                  <p className="text-sm text-green-600 font-medium">Price Alert Hit!</p>
                )}
              </div>
              <div className="text-right text-sm text-gray-600">
                <ClockIcon className="inline h-3 w-3" />
                <span className="ml-1">{timeRemaining}</span>
              </div>
            </div>

            <div className="flex items-center justify-between mt-3 text-sm text-gray-600">
              <span>{item.product.bids} bids</span>
              <span>{item.product.views} views</span>
            </div>

            {item.priceAlert && (
              <div className="mt-3 p-2 bg-blue-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <BellIcon className={`h-4 w-4 ${item.priceAlert.enabled ? 'text-blue-500' : 'text-gray-400'}`} />
                    <span className="ml-1 text-sm">Price Alert: {formatPrice(item.priceAlert.targetPrice)}</span>
                  </div>
                  <button
                    onClick={() => togglePriceAlert(item.id)}
                    className={`text-xs px-2 py-1 rounded ${
                      item.priceAlert.enabled 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {item.priceAlert.enabled ? 'On' : 'Off'}
                  </button>
                </div>
              </div>
            )}

            {item.notes && (
              <div className="mt-2 p-2 bg-gray-50 rounded text-sm text-gray-600">
                {item.notes}
              </div>
            )}

            <div className="flex space-x-2 mt-4">
              <Link
                to={`/products/${item.product.id}`}
                className="flex-1 btn-primary text-center text-sm"
              >
                <EyeIcon className="inline h-4 w-4 mr-1" />
                View Auction
              </Link>
              <button className="flex-1 btn-outline text-sm">
                Place Bid
              </button>
            </div>
          </div>
        </motion.div>
      )
    }

    // List view
    return (
      <motion.div
        layout
        className="card hover:shadow-lg transition-all"
      >
        <div className="flex items-start space-x-4">
          <img
            src={item.product.images[0]}
            alt={item.product.title}
            className="w-24 h-24 object-cover rounded-lg flex-shrink-0"
          />
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <Link to={`/products/${item.product.id}`} className="text-lg font-semibold text-gray-900 hover:text-primary-600">
                  {item.product.title}
                </Link>
                <p className="text-sm text-gray-600 mt-1">{item.product.category}</p>
                <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                  <span>{item.product.bids} bids</span>
                  <span>{item.product.views} views</span>
                  <span>Added {new Date(item.addedDate).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-primary-600">{formatPrice(item.product.currentPrice)}</p>
                <p className="text-sm text-gray-600 mt-1">
                  <ClockIcon className="inline h-3 w-3" />
                  <span className="ml-1">{timeRemaining}</span>
                </p>
                {isEndingSoon && (
                  <span className="inline-block mt-1 bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium">
                    Ending Soon!
                  </span>
                )}
              </div>
            </div>

            {item.priceAlert && (
              <div className="mt-3 p-2 bg-blue-50 rounded-lg flex items-center justify-between">
                <div className="flex items-center">
                  <BellIcon className={`h-4 w-4 ${item.priceAlert.enabled ? 'text-blue-500' : 'text-gray-400'}`} />
                  <span className="ml-1 text-sm">Price Alert: {formatPrice(item.priceAlert.targetPrice)}</span>
                  {item.priceAlert.enabled && item.product.currentPrice <= item.priceAlert.targetPrice && (
                    <span className="ml-2 text-sm text-green-600 font-medium">✓ Hit!</span>
                  )}
                </div>
                <button
                  onClick={() => togglePriceAlert(item.id)}
                  className={`text-xs px-2 py-1 rounded ${
                    item.priceAlert.enabled 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {item.priceAlert.enabled ? 'On' : 'Off'}
                </button>
              </div>
            )}

            {item.notes && (
              <div className="mt-2 p-2 bg-gray-50 rounded text-sm text-gray-600">
                {item.notes}
              </div>
            )}

            <div className="flex items-center justify-between mt-4">
              <div className="flex space-x-2">
                <Link
                  to={`/products/${item.product.id}`}
                  className="btn-primary text-sm"
                >
                  <EyeIcon className="inline h-4 w-4 mr-1" />
                  View
                </Link>
                <button className="btn-outline text-sm">
                  Bid Now
                </button>
              </div>
              <div className="flex space-x-1">
                <button className="p-1.5 hover:bg-gray-100 rounded transition-colors">
                  <ShareIcon className="h-4 w-4 text-gray-500" />
                </button>
                <button
                  onClick={() => removeFromWishlist(item.id)}
                  className="p-1.5 hover:bg-red-100 rounded transition-colors"
                  title="Remove from wishlist"
                >
                  <TrashIcon className="h-4 w-4 text-red-500" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <HeartIconSolid className="h-8 w-8 text-red-500 mr-3" />
              My Wishlist
            </h1>
            <p className="text-gray-600 mt-2">
              Keep track of auctions you're interested in and get notified when prices drop
            </p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded ${viewMode === 'grid' ? 'bg-primary-100 text-primary-600' : 'text-gray-500 hover:bg-gray-100'}`}
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm2 2v8h10V6H5z" clipRule="evenodd" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded ${viewMode === 'list' ? 'bg-primary-100 text-primary-600' : 'text-gray-500 hover:bg-gray-100'}`}
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 4a1 1 0 000 2h14a1 1 0 100-2H3zm0 4a1 1 0 000 2h14a1 1 0 100-2H3zm0 4a1 1 0 000 2h14a1 1 0 100-2H3z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
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

      {/* Filters */}
      <div className="card">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center space-x-2">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search wishlist..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">All Categories</option>
            {categories.map(category => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>

          <div className="flex items-center space-x-2">
            <input
              type="number"
              placeholder="Min Price"
              value={priceRange.min}
              onChange={(e) => setPriceRange(prev => ({ ...prev, min: e.target.value }))}
              className="w-24 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <span>-</span>
            <input
              type="number"
              placeholder="Max Price"
              value={priceRange.max}
              onChange={(e) => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
              className="w-24 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="recent">Recently Added</option>
            <option value="oldest">Oldest First</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="ending-soon">Ending Soon</option>
          </select>
        </div>
      </div>

      {/* Wishlist Items */}
      {sortedItems.length > 0 ? (
        <div className={viewMode === 'grid' 
          ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          : "space-y-4"
        }>
          {sortedItems.map((item) => (
            <WishlistCard key={item.id} item={item} isGrid={viewMode === 'grid'} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <HeartIconOutline className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {wishlistItems.length === 0 ? 'Your wishlist is empty' : 'No items match your filters'}
          </h3>
          <p className="text-gray-600 mb-4">
            {wishlistItems.length === 0 
              ? 'Start adding items you love to keep track of them'
              : 'Try adjusting your search or filter criteria'
            }
          </p>
          {wishlistItems.length === 0 && (
            <Link to="/products" className="btn-primary">
              Browse Auctions
            </Link>
          )}
        </div>
      )}
    </motion.div>
  )
}

export default Wishlist