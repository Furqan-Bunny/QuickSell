import { Link } from 'react-router-dom'
import { HeartIcon, ClockIcon, UserIcon, EyeIcon, CheckBadgeIcon } from '@heroicons/react/24/outline'
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid'
import { useState } from 'react'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'
import { formatPrice, getTimeRemaining } from '../utils/formatters'

interface ProductCardProps {
  product: any
  showTimer?: boolean
}

const ProductCard = ({ product, showTimer = false }: ProductCardProps) => {
  const { isAuthenticated } = useAuthStore()
  const [isWishlisted, setIsWishlisted] = useState(false)
  
  const handleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault()
    
    if (!isAuthenticated) {
      toast.error('Please login to add to wishlist')
      return
    }
    
    setIsWishlisted(!isWishlisted)
    toast.success(isWishlisted ? 'Removed from wishlist' : 'Added to wishlist')
  }

  const timeLeft = getTimeRemaining(product.endDate)
  const isEndingSoon = new Date(product.endDate).getTime() - Date.now() < 24 * 60 * 60 * 1000

  return (
    <Link to={`/products/${product.id}`} className="block h-full">
      <div className="card hover:shadow-2xl transition-all duration-300 group h-full flex flex-col">
        {/* Image */}
        <div className="relative aspect-square mb-4 overflow-hidden rounded-lg bg-gray-100 flex-shrink-0">
          <img
            src={product.images?.[0] || '/placeholder.jpg'}
            alt={product.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
            loading="lazy"
          />
          
          {/* Wishlist Button */}
          <button
            onClick={handleWishlist}
            className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-colors shadow-lg"
          >
            {isWishlisted ? (
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
                {product.views}
              </span>
              <span className="font-bold">
                {product.bids} bid{product.bids !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col">
          <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2 group-hover:text-primary-600 transition-colors min-h-[3rem]">
            {product.title}
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
            📍 {product.location}
          </div>

          {/* Price */}
          <div className="mb-2">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-xs text-gray-500">Current bid</div>
                <div className="text-xl font-bold text-primary-600">
                  {formatPrice(product.currentPrice)}
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
              {product.category}
            </span>
            <span className="badge bg-gray-100 text-gray-700 text-xs">
              {product.condition}
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}

export default ProductCard