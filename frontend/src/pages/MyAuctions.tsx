import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import {
  PlusCircleIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  ArrowRightIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline'
import { mockProducts, formatPrice, getTimeRemaining } from '../data/mockData'
import ProductCard from '../components/ProductCard'

const MyAuctions = () => {
  const { user } = useAuthStore()
  const [activeAuctions, setActiveAuctions] = useState<any[]>([])
  const [endedAuctions, setEndedAuctions] = useState<any[]>([])
  const [draftAuctions, setDraftAuctions] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState('active')

  useEffect(() => {
    loadMyAuctions()
  }, [user])

  const loadMyAuctions = () => {
    if (!user) return

    // Filter products by seller (in real app, this would be an API call)
    const myProducts = mockProducts.filter(p => 
      // For demo, assign some products to the current user
      user.role === 'admin' || (p.seller?.id === user.id)
    )

    // Categorize auctions
    const active = myProducts.filter(p => p.status === 'active')
    const ended = myProducts.filter(p => p.status === 'ended' || p.status === 'sold')
    const drafts: any[] = [] // No draft status in mock data

    // For demo purposes, assign some mock products to admin user
    if (user.role === 'admin' && active.length === 0) {
      const demoActive = mockProducts.slice(0, 3).map(p => ({
        ...p,
        seller: { id: user.id, username: user.username }
      }))
      setActiveAuctions(demoActive)
      
      const demoEnded = mockProducts.slice(3, 5).map(p => ({
        ...p,
        status: 'sold',
        seller: { id: user.id, username: user.username }
      }))
      setEndedAuctions(demoEnded)
    } else {
      setActiveAuctions(active)
      setEndedAuctions(ended)
      setDraftAuctions(drafts)
    }
  }

  const handleDelete = (productId: string) => {
    if (confirm('Are you sure you want to delete this auction?')) {
      // In real app, make API call to delete
      setActiveAuctions(prev => prev.filter(p => p.id !== productId))
    }
  }

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      active: 'bg-green-100 text-green-800',
      ended: 'bg-gray-100 text-gray-800',
      sold: 'bg-blue-100 text-blue-800'
    }
    return badges[status] || 'bg-gray-100 text-gray-800'
  }

  const tabs = [
    { id: 'active', label: 'Active', count: activeAuctions.length },
    { id: 'ended', label: 'Ended', count: endedAuctions.length },
    { id: 'drafts', label: 'Drafts', count: draftAuctions.length }
  ]

  const getCurrentAuctions = () => {
    switch (activeTab) {
      case 'active': return activeAuctions
      case 'ended': return endedAuctions
      case 'drafts': return draftAuctions
      default: return []
    }
  }

  if (user?.role !== 'admin') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-12"
      >
        <div className="card max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Seller Access Required</h2>
          <p className="text-gray-600 mb-6">
            Only approved sellers and administrators can create and manage auctions.
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Note: In this demo, only admin accounts can create auctions. Regular users can only bid on existing items.
          </p>
          <Link to="/products" className="btn-primary">
            Browse Auctions
          </Link>
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Auctions</h1>
          <p className="text-gray-600 mt-2">Manage your auction listings</p>
        </div>
        <Link to="/create-auction" className="btn-primary flex items-center gap-2">
          <PlusCircleIcon className="h-5 w-5" />
          Create New Auction
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Active</p>
              <p className="text-2xl font-bold text-gray-900">{activeAuctions.length}</p>
            </div>
            <ClockIcon className="h-8 w-8 text-primary-600" />
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Sold</p>
              <p className="text-2xl font-bold text-gray-900">
                {endedAuctions.filter(p => p.status === 'sold').length}
              </p>
            </div>
            <CheckCircleIcon className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Views</p>
              <p className="text-2xl font-bold text-gray-900">
                {[...activeAuctions, ...endedAuctions].reduce((sum, p) => sum + (p.views || 0), 0)}
              </p>
            </div>
            <EyeIcon className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Revenue</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatPrice(
                  endedAuctions
                    .filter(p => p.status === 'sold')
                    .reduce((sum, p) => sum + p.currentPrice, 0)
                )}
              </p>
            </div>
            <CurrencyDollarIcon className="h-8 w-8 text-green-600" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                py-2 px-1 border-b-2 font-medium text-sm transition-colors
                ${activeTab === tab.id
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className="ml-2 bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Auction List */}
      <div>
        {getCurrentAuctions().length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              {activeTab === 'active' && <ClockIcon className="h-12 w-12 mx-auto" />}
              {activeTab === 'ended' && <CheckCircleIcon className="h-12 w-12 mx-auto" />}
              {activeTab === 'drafts' && <PencilIcon className="h-12 w-12 mx-auto" />}
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No {activeTab} auctions
            </h3>
            <p className="text-gray-600 mb-4">
              {activeTab === 'active' && "You don't have any active auctions at the moment."}
              {activeTab === 'ended' && "You don't have any ended auctions yet."}
              {activeTab === 'drafts' && "You don't have any draft auctions."}
            </p>
            {activeTab === 'active' && (
              <Link to="/create-auction" className="btn-primary">
                Create Your First Auction
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {getCurrentAuctions().map((auction) => (
              <motion.div
                key={auction.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="card hover:shadow-xl transition-shadow"
              >
                <div className="flex gap-6">
                  {/* Image */}
                  <div className="flex-shrink-0">
                    <img
                      src={auction.images[0]?.url || '/placeholder.jpg'}
                      alt={auction.title}
                      className="w-32 h-32 object-cover rounded-lg"
                    />
                  </div>

                  {/* Details */}
                  <div className="flex-grow">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {auction.title}
                        </h3>
                        <span className={`badge ${getStatusBadge(auction.status)}`}>
                          {auction.status}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <Link
                          to={`/products/${auction.id}`}
                          className="p-2 text-gray-600 hover:text-primary-600 transition-colors"
                          title="View"
                        >
                          <EyeIcon className="h-5 w-5" />
                        </Link>
                        <button
                          className="p-2 text-gray-600 hover:text-primary-600 transition-colors"
                          title="Edit"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                      <div>
                        <p className="text-sm text-gray-600">Current Price</p>
                        <p className="font-semibold">{formatPrice(auction.currentPrice)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Bids</p>
                        <p className="font-semibold">{auction.totalBids || 0}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Views</p>
                        <p className="font-semibold">{auction.views || 0}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">
                          {auction.status === 'active' ? 'Ends In' : 'Ended'}
                        </p>
                        <p className="font-semibold">
                          {auction.status === 'active' 
                            ? getTimeRemaining(auction.endDate)
                            : new Date(auction.endDate).toLocaleDateString()
                          }
                        </p>
                      </div>
                    </div>

                    {auction.status === 'sold' && (
                      <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-sm text-green-800">
                          <CheckCircleIcon className="h-4 w-4 inline mr-1" />
                          Sold to {auction.winner?.username || 'Unknown'} for {formatPrice(auction.currentPrice)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  )
}

export default MyAuctions