import { Link } from 'react-router-dom'
import { HeartIcon, ClockIcon, UserIcon, EyeIcon, CheckBadgeIcon } from '@heroicons/react/24/outline'
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid'
import { useState, useEffect } from 'react'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'
import { formatPrice, getTimeRemaining } from '../utils/formatters'
import { addToWatchlist, removeFromWatchlist } from '../services/userService'

interface ProductCardProps {
  product: any
  showTimer?: boolean
  initialWishlisted?: boolean
}

const ProductCard = ({ product, showTimer = false, initialWishlisted = false }: ProductCardProps) => {
  const { isAuthenticated, user } = useAuthStore()
  const [isWishlisted, setIsWishlisted] = useState(initialWishlisted)
  const [isLoading, setIsLoading] = useState(false)
  
  // Validate product data
  if (!product || !product.id) {
    console.error('Invalid product data:', product)
    return null
  }
  
  // Check if product is in user's wishlist
  useEffect(() => {
    if (user?.watchlist && product?.id) {
      setIsWishlisted(user.watchlist.includes(product.id))
    }
  }, [user?.watchlist, product?.id])
  
  const handleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!isAuthenticated) {
      toast.error('Please login to add to wishlist')
      return
    }
    
    if (isLoading) return
    
    setIsLoading(true)
    try {
      if (isWishlisted) {
        await removeFromWatchlist(product.id)
        setIsWishlisted(false)
        toast.success('Removed from wishlist')
      } else {
        await addToWatchlist(product.id)
        setIsWishlisted(true)
        toast.success('Added to wishlist')
      }
    } catch (error) {
      toast.error('Failed to update wishlist')
      // Revert the state on error
      setIsWishlisted(isWishlisted)
    } finally {
      setIsLoading(false)
    }
  }

  // Safe date handling
  const endDate = product.endDate ? new Date(product.endDate) : new Date()
  const timeLeft = getTimeRemaining(endDate)
  const isEndingSoon = endDate.getTime() - Date.now() < 24 * 60 * 60 * 1000
  
  // Safe default values
  const productTitle = product.title || 'Untitled Product'
  const productImages = product.images || []
  const productPrice = product.currentPrice || 0
  const productViews = product.views || 0
  const productBids = product.bids || product.totalBids || product.bidsCount || 0
  const productLocation = product.location || product.shipping?.location || 'South Africa'
  const productCategory = product.category || 'Uncategorized'
  const productCondition = product.condition || 'Used'
  
  // Default placeholder image as base64
  const placeholderImage = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0iI2U1ZTdlYiIvPgogIDx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMjQiIGZpbGw9IiM5Y2EzYWYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5ObyBJbWFnZTwvdGV4dD4KPC9zdmc+'

  return (
    <Link to={`/products/${product.id}`} className="block h-full">
      <div className="card hover:shadow-2xl transition-all duration-300 group h-full flex flex-col">
        {/* Image */}
        <div className="relative aspect-square mb-4 overflow-hidden rounded-lg bg-gray-100 flex-shrink-0">
          <img
            src={productImages[0] || placeholderImage}
            alt={productTitle}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
            loading="lazy"
            onError={(e) => {
              e.currentTarget.src = placeholderImage
            }}
          />
          
          {/* Wishlist Button */}
          <button
            onClick={handleWishlist}
            disabled={isLoading}
            className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-colors shadow-lg disabled:opacity-50"
          >
            {isLoading ? (
              <div className="animate-spin h-5 w-5 border-2 border-gray-400 border-t-transparent rounded-full" />
            ) : isWishlisted ? (
              <HeartSolidIcon className="h-5 w-5 text-red-500" />
            ) : (
              <HeartIcon className="h-5 w-5 text-gray-600" />
            )}
          </button>

          {/* Status Badges */}
          {product.featured && (
            <div className="absolute top-3 left-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
              ⭐ Featured
            </div>
          )}
          
          {!product.featured && product.status === 'active' && isEndingSoon && (
            <div className="absolute top-3 left-3 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold animate-pulse">
              🔥 Ending Soon
            </div>
          )}

          {/* Stats Overlay */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
            <div className="flex justify-between text-white text-sm">
              <span className="flex items-center gap-1">
                <EyeIcon className="h-4 w-4" />
                {productViews}
              </span>
              <span className="font-bold">
                {productBids} bid{productBids !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col">
          <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2 group-hover:text-primary-600 transition-colors min-h-[3rem]">
            {productTitle}
          </h3>

          {/* Seller */}
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <UserIcon className="h-4 w-4" />
            <span>{product.seller?.name}</span>
            {product.seller?.verified && (
              <CheckBadgeIcon className="h-4 w-4 text-blue-500" title="Verified Seller" />
            )}
            {product.seller?.rating && (
              <span className="text-yellow-500">★ {product.seller.rating}</span>
            )}
          </div>

          {/* Location */}
          <div className="text-xs text-gray-500 mb-2">
            📍 {productLocation}
          </div>

          {/* Price */}
          <div className="mb-2">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-xs text-gray-500">Current bid</div>
                <div className="text-xl font-bold text-primary-600">
                  {formatPrice(productPrice)}
                </div>
              </div>
              {product.buyNowPrice && (
                <div className="text-right">
                  <div className="text-xs text-gray-500">Buy now</div>
                  <div className="text-lg font-semibold text-gray-900">
                    {formatPrice(product.buyNowPrice)}
                  </div>
                </div>
              )}
            </div>
            
            {/* Shipping */}
            <div className="text-xs text-gray-500 mt-1">
              {product.freeShipping ? (
                <span className="text-green-600 font-semibold">✓ Free Shipping</span>
              ) : (
                <span>+ {formatPrice(product.shippingCost)} shipping</span>
              )}
            </div>
          </div>

          {/* Timer */}
          {showTimer && (
            <div className="flex items-center gap-1 text-sm">
              <ClockIcon className="h-4 w-4" />
              <span className={isEndingSoon ? 'text-red-500 font-bold' : 'text-gray-600'}>
                {product.status === 'active' ? timeLeft : 'Auction ended'}
              </span>
            </div>
          )}

          {/* Category & Condition */}
          <div className="flex gap-2 mt-auto pt-2">
            <span className="badge bg-primary-100 text-primary-700 text-xs">
              {productCategory}
            </span>
            <span className="badge bg-gray-100 text-gray-700 text-xs">
              {productCondition}
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}

export default ProductCard