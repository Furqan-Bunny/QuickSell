import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import axios from 'axios'
import toast from 'react-hot-toast'
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'
import ProductCard from '../components/ProductCard'
import { formatPrice } from '../utils/formatters'
import { db } from '../config/firebase'
import { collection, getDocs, query, where } from 'firebase/firestore'

// Cache for products to avoid reloading
let productsCache: any[] | null = null
let categoriesCache: any[] | null = null
let cacheTimestamp: number | null = null
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes cache

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [products, setProducts] = useState<any[]>(productsCache || [])
  const [filteredProducts, setFilteredProducts] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>(categoriesCache || [])
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '')
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '')
  const [sortBy, setSortBy] = useState('newest')
  const [priceRange, setPriceRange] = useState({ min: '', max: '' })
  const [selectedCondition, setSelectedCondition] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(!productsCache || productsCache.length === 0)
  const productsPerPage = 12

  const conditions = [
    { value: 'new', label: 'New' },
    { value: 'like-new', label: 'Like New' },
    { value: 'excellent', label: 'Excellent' },
    { value: 'good', label: 'Good' },
    { value: 'fair', label: 'Fair' },
    { value: 'poor', label: 'Poor' }
  ]

  const sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'ending-soon', label: 'Ending Soon' },
    { value: 'price-low', label: 'Price: Low to High' },
    { value: 'price-high', label: 'Price: High to Low' },
    { value: 'most-bids', label: 'Most Bids' }
  ]

  useEffect(() => {
    // Check if cache is valid
    const now = Date.now()
    const cacheIsValid = cacheTimestamp && (now - cacheTimestamp < CACHE_DURATION)
    
    if (cacheIsValid && productsCache && productsCache.length > 0) {
      // Use cached data
      console.log('Using cached products:', productsCache.length)
      setProducts(productsCache)
      setCategories(categoriesCache || [])
      setLoading(false)
    } else {
      // Load fresh data
      console.log('Loading fresh products...')
      loadProducts()
      loadCategories()
    }
  }, [])

  const refreshProducts = () => {
    // Clear cache and reload
    productsCache = null
    categoriesCache = null
    cacheTimestamp = null
    setLoading(true)
    loadProducts()
    loadCategories()
  }

  const loadProducts = async () => {
    try {
      // Fetch directly from Firebase
      const productsCollection = collection(db, 'products')
      const q = query(productsCollection, where('status', '==', 'active'))
      const querySnapshot = await getDocs(q)
      
      const rawProducts: any[] = []
      querySnapshot.forEach((doc) => {
        rawProducts.push({
          id: doc.id,
          ...doc.data()
        })
      })
      
      console.log('Fetched', rawProducts.length, 'products from Firebase')
      
      // Process Firebase timestamp format and validate each product
      const processedProducts = rawProducts
        .filter((p: any) => p && p.id) // Filter out invalid products
        .map((p: any) => {
          try {
            return {
              ...p,
              id: p.id,
              endDate: p.endDate?.toDate ? p.endDate.toDate() : 
                (p.endDate?._seconds ? new Date(p.endDate._seconds * 1000) : 
                (p.endDate ? new Date(p.endDate) : new Date())),
              startDate: p.startDate?.toDate ? p.startDate.toDate() :
                (p.startDate?._seconds ? new Date(p.startDate._seconds * 1000) : 
                (p.startDate ? new Date(p.startDate) : new Date())),
              createdAt: p.createdAt?.toDate ? p.createdAt.toDate() : 
                (p.createdAt ? new Date(p.createdAt) : new Date()),
              bids: p.bids?.length || p.totalBids || p.bidsCount || 0,
              currentPrice: p.currentPrice || p.price || p.startingPrice || 0,
              images: Array.isArray(p.images) ? p.images : [p.images].filter(Boolean),
              seller: {
                name: p.sellerName || 'Unknown',
                verified: p.verified || false,
                rating: p.averageRating || 0
              }
            }
          } catch (processError) {
            console.error('Error processing product:', p.id, processError)
            return null
          }
        })
        .filter(Boolean) // Remove any null products from processing errors
      
      // Update state and cache
      setProducts(processedProducts)
      productsCache = processedProducts
      cacheTimestamp = Date.now()
      console.log('Processed', processedProducts.length, 'products')
      setLoading(false)
    } catch (error: any) {
      console.error('Error loading products from Firebase:', error)
      if (error.code === 'permission-denied') {
        toast.error('Permission denied. Please login to continue.')
      } else {
        toast.error('Failed to load products. Please refresh the page.')
      }
      setLoading(false)
    }
  }

  const loadCategories = async () => {
    try {
      // Use hardcoded categories since backend is down
      const cats = [
        'Electronics',
        'Fashion',
        'Home & Garden',
        'Sports & Outdoors',
        'Art & Collectibles'
      ]
      setCategories(cats)
      categoriesCache = cats
    } catch (error) {
      console.error('Error loading categories:', error)
    }
  }

  useEffect(() => {
    filterAndSortProducts()
  }, [products, searchQuery, selectedCategory, sortBy, priceRange, selectedCondition])

  const filterAndSortProducts = () => {
    let filtered = [...products]

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(product =>
        product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Category filter
    if (selectedCategory) {
      filtered = filtered.filter(product =>
        product.category === selectedCategory || product.categoryId === selectedCategory
      )
    }

    // Condition filter
    if (selectedCondition) {
      filtered = filtered.filter(product =>
        product.condition === selectedCondition
      )
    }

    // Price range filter
    if (priceRange.min) {
      filtered = filtered.filter(product =>
        product.currentPrice >= parseFloat(priceRange.min)
      )
    }
    if (priceRange.max) {
      filtered = filtered.filter(product =>
        product.currentPrice <= parseFloat(priceRange.max)
      )
    }

    // Sorting
    switch (sortBy) {
      case 'newest':
        filtered.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
        break
      case 'ending-soon':
        filtered.sort((a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime())
        break
      case 'price-low':
        filtered.sort((a, b) => a.currentPrice - b.currentPrice)
        break
      case 'price-high':
        filtered.sort((a, b) => b.currentPrice - a.currentPrice)
        break
      case 'most-bids':
        filtered.sort((a, b) => b.bids - a.bids)
        break
    }

    setFilteredProducts(filtered)
    setCurrentPage(1) // Reset to first page when filters change
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSearchParams(searchQuery ? { search: searchQuery } : {})
  }

  const clearFilters = () => {
    setSearchQuery('')
    setSelectedCategory('')
    setSelectedCondition('')
    setPriceRange({ min: '', max: '' })
    setSortBy('newest')
    setSearchParams({})
  }

  // Pagination
  const indexOfLastProduct = currentPage * productsPerPage
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage
  const currentProducts = filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct)
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage)

  const paginate = (pageNumber: number) => {
    setCurrentPage(pageNumber)
    window.scrollTo({ top: 0, behavior: 'smooth' })
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
        <h1 className="text-3xl font-bold text-gray-900">Browse Auctions</h1>
        <p className="text-gray-600 mt-2">
          Discover amazing deals on unique items from Quicksell Official
        </p>
      </div>

      {/* Search and Sort Bar */}
      <div className="card">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <form onSubmit={handleSearch} className="flex-1">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search auctions..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <button
                type="submit"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 btn-primary py-1 px-3 text-sm"
              >
                Search
              </button>
            </div>
          </form>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            {sortOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="btn-outline flex items-center gap-2"
          >
            <FunnelIcon className="h-5 w-5" />
            Filters
            {(selectedCategory || selectedCondition || priceRange.min || priceRange.max) && (
              <span className="bg-primary-100 text-primary-700 text-xs px-2 py-0.5 rounded-full">
                Active
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Filters Sidebar */}
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-64 space-y-6"
          >
            {/* Categories */}
            <div className="card">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-gray-900">Categories</h3>
                {selectedCategory && (
                  <button
                    onClick={() => setSelectedCategory('')}
                    className="text-xs text-primary-600 hover:text-primary-700"
                  >
                    Clear
                  </button>
                )}
              </div>
              <div className="space-y-2">
                {categories.map(category => (
                  <label key={category.id} className="flex items-center">
                    <input
                      type="radio"
                      name="category"
                      value={category.id}
                      checked={selectedCategory === category.id}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">
                      {category.icon} {category.name} ({category.count || 0})
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Price Range */}
            <div className="card">
              <h3 className="font-semibold text-gray-900 mb-4">Price Range</h3>
              <div className="space-y-3">
                <input
                  type="number"
                  placeholder="Min price"
                  value={priceRange.min}
                  onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <input
                  type="number"
                  placeholder="Max price"
                  value={priceRange.max}
                  onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            {/* Condition */}
            <div className="card">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-gray-900">Condition</h3>
                {selectedCondition && (
                  <button
                    onClick={() => setSelectedCondition('')}
                    className="text-xs text-primary-600 hover:text-primary-700"
                  >
                    Clear
                  </button>
                )}
              </div>
              <div className="space-y-2">
                {conditions.map(condition => (
                  <label key={condition.value} className="flex items-center">
                    <input
                      type="radio"
                      name="condition"
                      value={condition.value}
                      checked={selectedCondition === condition.value}
                      onChange={(e) => setSelectedCondition(e.target.value)}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">{condition.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Clear All Filters */}
            <button
              onClick={clearFilters}
              className="w-full btn-outline text-sm"
            >
              Clear All Filters
            </button>
          </motion.div>
        )}

        {/* Products Grid */}
        <div className="flex-1">
          {/* Results Count */}
          <div className="mb-4">
            <p className="text-gray-600">
              Showing {indexOfFirstProduct + 1}-{Math.min(indexOfLastProduct, filteredProducts.length)} of {filteredProducts.length} results
              {searchQuery && ` for "${searchQuery}"`}
            </p>
          </div>

          {/* Products */}
          {currentProducts.length > 0 ? (
            <>
              <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
                {currentProducts.map((product, index) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <ProductCard product={product} showTimer />
                  </motion.div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-8 flex justify-center items-center space-x-2">
                  <button
                    onClick={() => paginate(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeftIcon className="h-5 w-5" />
                  </button>
                  
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum
                    if (totalPages <= 5) {
                      pageNum = i + 1
                    } else if (currentPage <= 3) {
                      pageNum = i + 1
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i
                    } else {
                      pageNum = currentPage - 2 + i
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => paginate(pageNum)}
                        className={`px-4 py-2 rounded-lg ${
                          currentPage === pageNum
                            ? 'bg-primary-600 text-white'
                            : 'border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    )
                  })}
                  
                  <button
                    onClick={() => paginate(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRightIcon className="h-5 w-5" />
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <MagnifyingGlassIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No auctions found</h3>
              <p className="text-gray-600 mb-4">
                Try adjusting your filters or search query
              </p>
              <button
                onClick={clearFilters}
                className="btn-primary"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

export default Products