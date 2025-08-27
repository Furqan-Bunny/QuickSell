import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { useAuthStore } from '../store/authStore'
import axios from 'axios'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import ImageGallery from 'react-image-gallery'
import Countdown from 'react-countdown'
import createSocket from '../config/socket'
import {
  HeartIcon,
  ShareIcon,
  ShieldCheckIcon,
  TruckIcon,
  ArrowPathIcon,
  UserIcon,
  StarIcon,
  ClockIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid'
import 'react-image-gallery/styles/css/image-gallery.css'

interface BidForm {
  amount: number
}

const ProductDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuthStore()
  const [product, setProduct] = useState<any>(null)
  const [bids, setBids] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isWishlisted, setIsWishlisted] = useState(false)
  const [activeTab, setActiveTab] = useState('description')
  const [socket, setSocket] = useState<any>(null)

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors }
  } = useForm<BidForm>()

  useEffect(() => {
    fetchProduct()
    
    // Connect to socket for real-time updates
    const newSocket = createSocket()
    setSocket(newSocket)
    
    if (id) {
      newSocket.emit('join-auction', id)
      
      newSocket.on('new-bid', (bidData: any) => {
        setProduct((prev: any) => ({
          ...prev,
          currentPrice: bidData.amount,
          totalBids: prev.totalBids + 1
        }))
        setBids((prev) => [bidData, ...prev])
        toast.success(`New bid placed: $${bidData.amount}`)
      })
    }
    
    return () => {
      newSocket.close()
    }
  }, [id])

  const fetchProduct = async () => {
    try {
      const response = await axios.get(`/api/products/${id}`)
      const productData = response.data.data || response.data.product || response.data
      
      // Process Firebase timestamp format
      const processedProduct = {
        ...productData,
        endDate: productData.endDate?._seconds 
          ? new Date(productData.endDate._seconds * 1000) 
          : new Date(productData.endDate),
        startDate: productData.startDate?._seconds 
          ? new Date(productData.startDate._seconds * 1000) 
          : new Date(productData.startDate),
        seller: productData.seller || {
          username: productData.sellerName || 'Unknown',
          verified: productData.verified || false,
          ratings: {
            average: productData.averageRating || 0,
            count: productData.reviewCount || 0
          }
        },
        images: Array.isArray(productData.images) 
          ? productData.images.map((img: any) => typeof img === 'string' ? img : img.url)
          : [productData.images].filter(Boolean),
        category: productData.category ? { name: productData.category } : null,
        totalBids: productData.totalBids || 0,
        uniqueBidders: productData.uniqueBidders || 0,
        views: productData.views || 0,
        incrementAmount: productData.incrementAmount || 100,
        shipping: {
          cost: productData.shippingCost || 0,
          location: productData.location || 'South Africa'
        }
      }
      
      setProduct(processedProduct)
      setBids(response.data.bids || [])
      setLoading(false)
      
      // Set minimum bid amount
      const minBid = processedProduct.currentPrice + processedProduct.incrementAmount
      setValue('amount', minBid)
    } catch (error: any) {
      console.error('Error fetching product:', error)
      if (error.response?.status === 404) {
        toast.error('Product not found')
      } else {
        toast.error('Failed to load product')
      }
      setLoading(false)
    }
  }

  const onSubmit = async (data: BidForm) => {
    if (!isAuthenticated) {
      toast.error('Please login to place a bid')
      navigate('/login')
      return
    }

    try {
      await axios.post('/api/bids', {
        productId: id,
        amount: data.amount
      })
      
      toast.success('Bid placed successfully!')
      fetchProduct()
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to place bid')
    }
  }

  const handleBuyNow = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to buy now')
      navigate('/login')
      return
    }

    try {
      const response = await axios.post('/api/payments/flutterwave/initialize', {
        productId: product.id,
        amount: product.buyNowPrice || product.currentPrice,
        currency: 'ZAR',
        redirectUrl: `${window.location.origin}/payment/success`,
        cancelUrl: `${window.location.origin}/payment/cancel`,
        customerDetails: {
          email: user?.email,
          name: `${user?.firstName} ${user?.lastName}`,
          phoneNumber: ''
        },
        metadata: {
          productTitle: product.title,
          sellerId: product.seller?._id,
          buyerId: user?.id
        }
      })
      
      if (response.data.status === 'success' && response.data.data?.link) {
        toast.success('Redirecting to payment...')
        window.location.href = response.data.data.link
      } else {
        toast.error('Failed to initialize payment')
      }
    } catch (error) {
      console.error('Payment initialization error:', error)
      toast.error('Failed to process payment. Please try again.')
    }
  }

  const handleWishlist = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to add to wishlist')
      return
    }

    try {
      await axios.post(`/api/users/wishlist/${id}`)
      setIsWishlisted(!isWishlisted)
      toast.success(isWishlisted ? 'Removed from wishlist' : 'Added to wishlist')
    } catch (error) {
      toast.error('Failed to update wishlist')
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="loading-spinner"></div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900">Product not found</h2>
      </div>
    )
  }

  const images = product.images?.map((img: string) => ({
    original: img,
    thumbnail: img,
    description: product.title
  })) || []

  const isAuctionEnded = new Date(product.endDate) < new Date()
  const minimumBid = product.currentPrice + product.incrementAmount

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="max-w-7xl mx-auto"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Image Gallery */}
        <div>
          {images.length > 0 ? (
            <ImageGallery 
              items={images}
              showPlayButton={false}
              showFullscreenButton={true}
            />
          ) : (
            <div className="aspect-square bg-gray-200 rounded-lg flex items-center justify-center">
              <span className="text-gray-400">No images available</span>
            </div>
          )}

          {/* Seller Info */}
          <div className="card mt-6">
            <h3 className="font-semibold text-gray-900 mb-4">Seller Information</h3>
            <div className="flex items-center space-x-4">
              <div className="h-12 w-12 bg-primary-100 rounded-full flex items-center justify-center">
                {product.seller?.avatar ? (
                  <img src={product.seller.avatar} alt={product.seller.username} className="h-12 w-12 rounded-full" />
                ) : (
                  <UserIcon className="h-6 w-6 text-primary-600" />
                )}
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">{product.seller?.username}</p>
                <div className="flex items-center mt-1">
                  {[...Array(5)].map((_, i) => (
                    <StarIcon
                      key={i}
                      className={`h-4 w-4 ${
                        i < Math.floor(product.seller?.ratings?.average || 0)
                          ? 'text-yellow-400 fill-current'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                  <span className="ml-2 text-sm text-gray-500">
                    ({product.seller?.ratings?.count || 0} reviews)
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Product Info & Bidding */}
        <div className="space-y-6">
          {/* Title and Actions */}
          <div>
            <div className="flex justify-between items-start mb-2">
              <h1 className="text-3xl font-bold text-gray-900">{product.title}</h1>
              <div className="flex space-x-2">
                <button
                  onClick={handleWishlist}
                  className="p-2 rounded-full hover:bg-gray-100"
                >
                  {isWishlisted ? (
                    <HeartSolidIcon className="h-6 w-6 text-red-500" />
                  ) : (
                    <HeartIcon className="h-6 w-6 text-gray-400" />
                  )}
                </button>
                <button className="p-2 rounded-full hover:bg-gray-100">
                  <ShareIcon className="h-6 w-6 text-gray-400" />
                </button>
              </div>
            </div>
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <span className="badge bg-gray-100 text-gray-700">
                {product.category?.name}
              </span>
              <span>Condition: {product.condition}</span>
              <span>{product.views} views</span>
            </div>
          </div>

          {/* Auction Timer */}
          {!isAuctionEnded && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <ClockIcon className="h-5 w-5 text-red-600" />
                  <span className="font-semibold text-red-900">Time Remaining:</span>
                </div>
                <Countdown
                  date={new Date(product.endDate)}
                  renderer={({ days, hours, minutes, seconds }) => (
                    <span className="text-2xl font-bold text-red-600">
                      {days}d {hours}h {minutes}m {seconds}s
                    </span>
                  )}
                />
              </div>
            </div>
          )}

          {/* Bidding Section */}
          <div className="card">
            <div className="space-y-4">
              {/* Current Price */}
              <div>
                <div className="text-sm text-gray-500">Current Bid</div>
                <div className="text-4xl font-bold text-primary-600">
                  R{product.currentPrice.toLocaleString()}
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  {product.totalBids} bids • {product.uniqueBidders} bidders
                </div>
              </div>

              {/* Buy Now Price */}
              {product.buyNowPrice && (
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="text-sm text-gray-500">Buy Now Price</div>
                    <div className="text-2xl font-semibold text-gray-900">
                      R{product.buyNowPrice.toLocaleString()}
                    </div>
                  </div>
                  <button
                    onClick={handleBuyNow}
                    className="btn-secondary"
                    disabled={isAuctionEnded}
                  >
                    Buy Now
                  </button>
                </div>
              )}

              {/* Bid Form */}
              {!isAuctionEnded && user?.id !== product.seller?._id && (
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Your Bid (minimum: R{minimumBid.toLocaleString()})
                    </label>
                    <div className="flex space-x-2">
                      <input
                        {...register('amount', {
                          required: 'Bid amount is required',
                          min: {
                            value: minimumBid,
                            message: `Minimum bid is R${minimumBid.toLocaleString()}`
                          }
                        })}
                        type="number"
                        step="0.01"
                        className="input-field flex-1"
                        placeholder={`Enter bid amount`}
                      />
                      <button type="submit" className="btn-primary px-8">
                        Place Bid
                      </button>
                    </div>
                    {errors.amount && (
                      <p className="mt-1 text-sm text-red-600">{errors.amount.message}</p>
                    )}
                  </div>
                </form>
              )}

              {isAuctionEnded && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <p className="text-center text-gray-600 font-semibold">
                    This auction has ended
                  </p>
                  {product.winner && (
                    <p className="text-center text-sm text-gray-500 mt-2">
                      Won by: {product.winner.username}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Features */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <ShieldCheckIcon className="h-8 w-8 text-primary-600 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Buyer Protection</p>
            </div>
            <div className="text-center">
              <TruckIcon className="h-8 w-8 text-primary-600 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Fast Shipping</p>
            </div>
            <div className="text-center">
              <ArrowPathIcon className="h-8 w-8 text-primary-600 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Easy Returns</p>
            </div>
          </div>

          {/* Tabs */}
          <div>
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                {['description', 'shipping', 'bids', 'questions'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`py-2 px-1 border-b-2 font-medium text-sm capitalize ${
                      activeTab === tab
                        ? 'border-primary-500 text-primary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </nav>
            </div>

            <div className="py-4">
              {activeTab === 'description' && (
                <div className="prose max-w-none">
                  <p className="text-gray-600">{product.description}</p>
                  {product.specifications && Object.keys(product.specifications).length > 0 && (
                    <div className="mt-6">
                      <h3 className="font-semibold text-gray-900 mb-4">Specifications</h3>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <dl className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {Object.entries(product.specifications).map(([key, value]: [string, any]) => (
                            <div key={key}>
                              <dt className="font-medium text-gray-600 capitalize text-sm">{key.replace(/([A-Z])/g, ' $1').trim()}:</dt>
                              <dd className="text-gray-900 font-medium">{value}</dd>
                            </div>
                          ))}
                        </dl>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'shipping' && (
                <div className="space-y-6">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h3 className="font-semibold text-blue-900 mb-3 flex items-center">
                      <TruckIcon className="h-5 w-5 mr-2" />
                      Shipping Information
                    </h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-blue-700">Shipping Cost:</span>
                        <span className="font-medium text-blue-900">
                          {product.shipping?.cost ? `R${product.shipping.cost}` : 'Free'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-700">Location:</span>
                        <span className="font-medium text-blue-900">{product.shipping?.location || 'South Africa'}</span>
                      </div>
                      {product.shipping?.methods && (
                        <div>
                          <span className="text-blue-700">Available Methods:</span>
                          <div className="mt-1 flex flex-wrap gap-2">
                            {product.shipping.methods.map((method: string, index: number) => (
                              <span key={index} className="px-2 py-1 bg-blue-200 text-blue-800 rounded-full text-xs">
                                {method}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-green-50 rounded-lg p-4">
                    <h3 className="font-semibold text-green-900 mb-3 flex items-center">
                      <ShieldCheckIcon className="h-5 w-5 mr-2" />
                      Buyer Protection
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center text-green-700">
                        <div className="h-2 w-2 bg-green-500 rounded-full mr-2"></div>
                        Money back guarantee if item not as described
                      </div>
                      <div className="flex items-center text-green-700">
                        <div className="h-2 w-2 bg-green-500 rounded-full mr-2"></div>
                        Secure payment processing
                      </div>
                      <div className="flex items-center text-green-700">
                        <div className="h-2 w-2 bg-green-500 rounded-full mr-2"></div>
                        Dispute resolution support
                      </div>
                    </div>
                  </div>

                  {product.returnPolicy?.accepted && (
                    <div className="bg-orange-50 rounded-lg p-4">
                      <h3 className="font-semibold text-orange-900 mb-2 flex items-center">
                        <ArrowPathIcon className="h-5 w-5 mr-2" />
                        Return Policy
                      </h3>
                      <p className="text-orange-700">
                        {product.returnPolicy.days} day returns accepted
                      </p>
                      <p className="text-orange-600 text-sm mt-1">
                        {product.returnPolicy.description}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'bids' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold text-gray-900">Bid History</h3>
                    <span className="text-sm text-gray-500">
                      {bids.length} bid{bids.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  
                  {bids.length > 0 ? (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {bids.map((bid: any, index: number) => (
                        <motion.div 
                          key={bid._id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className={`flex items-center justify-between p-4 rounded-lg border-2 ${
                            index === 0 
                              ? 'bg-primary-50 border-primary-200' 
                              : 'bg-gray-50 border-gray-200'
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            {bid.bidder?.avatar ? (
                              <img 
                                src={bid.bidder.avatar} 
                                alt={bid.bidder.username}
                                className="h-10 w-10 rounded-full"
                              />
                            ) : (
                              <div className="h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center">
                                <UserIcon className="h-5 w-5 text-primary-600" />
                              </div>
                            )}
                            <div>
                              <div className="flex items-center space-x-2">
                                <p className="font-medium text-gray-900">{bid.bidder?.username}</p>
                                {index === 0 && (
                                  <span className="px-2 py-1 bg-primary-100 text-primary-700 rounded-full text-xs font-medium">
                                    Leading
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-500">
                                {format(new Date(bid.timestamp), 'MMM dd, yyyy • HH:mm')}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`text-xl font-bold ${
                              index === 0 ? 'text-primary-600' : 'text-gray-900'
                            }`}>
                              R{bid.amount.toLocaleString()}
                            </div>
                            {index > 0 && (
                              <p className="text-sm text-gray-500">
                                +R{(bids[index-1].amount - bid.amount).toLocaleString()}
                              </p>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <ExclamationTriangleIcon className="h-8 w-8 text-gray-400" />
                      </div>
                      <p className="text-gray-500">No bids placed yet</p>
                      <p className="text-sm text-gray-400 mt-1">Be the first to place a bid!</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'questions' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-4">Ask a Question</h3>
                    {isAuthenticated ? (
                      <div className="space-y-3">
                        <textarea
                          placeholder="Ask the seller a question about this item..."
                          className="input-field h-24 resize-none"
                        />
                        <button className="btn-primary">Ask Question</button>
                      </div>
                    ) : (
                      <div className="bg-gray-50 rounded-lg p-4 text-center">
                        <p className="text-gray-600 mb-3">Sign in to ask questions</p>
                        <button 
                          onClick={() => navigate('/login')}
                          className="btn-primary"
                        >
                          Sign In
                        </button>
                      </div>
                    )}
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 mb-4">
                      Questions & Answers ({product.questions?.length || 0})
                    </h3>
                    
                    {product.questions && product.questions.length > 0 ? (
                      <div className="space-y-4">
                        {product.questions.map((qa: any, index: number) => (
                          <div key={index} className="border border-gray-200 rounded-lg p-4">
                            <div className="mb-3">
                              <div className="flex items-center space-x-2 mb-2">
                                <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                                  <UserIcon className="h-4 w-4 text-blue-600" />
                                </div>
                                <span className="font-medium text-gray-900">{qa.user?.username}</span>
                                <span className="text-sm text-gray-500">
                                  {format(new Date(qa.date), 'MMM dd, yyyy')}
                                </span>
                              </div>
                              <p className="text-gray-800 pl-10">{qa.question}</p>
                            </div>
                            
                            {qa.answer && (
                              <div className="pl-10 pt-3 border-t border-gray-100">
                                <div className="flex items-center space-x-2 mb-2">
                                  <div className="h-6 w-6 bg-primary-100 rounded-full flex items-center justify-center">
                                    <span className="text-xs font-medium text-primary-600">S</span>
                                  </div>
                                  <span className="text-sm font-medium text-primary-600">Seller</span>
                                </div>
                                <p className="text-gray-700 pl-8">{qa.answer}</p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <ExclamationTriangleIcon className="h-8 w-8 text-gray-400" />
                        </div>
                        <p className="text-gray-500">No questions asked yet</p>
                        <p className="text-sm text-gray-400 mt-1">Be the first to ask a question!</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Related Products Section */}
      <div className="mt-16">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Related Products</h2>
        <div className="text-center py-8 text-gray-500">
          <p>Related products will be displayed here</p>
        </div>
      </div>
    </motion.div>
  )
}

export default ProductDetail
