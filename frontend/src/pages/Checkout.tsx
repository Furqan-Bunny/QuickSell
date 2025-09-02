import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuthStore } from '../store/authStore'
import axios from 'axios'
import toast from 'react-hot-toast'
import {
  CreditCardIcon,
  WalletIcon,
  TruckIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  UserIcon,
  CheckCircleIcon,
  ShieldCheckIcon,
  InformationCircleIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline'

interface ShippingInfo {
  fullName: string
  email: string
  phone: string
  address: string
  city: string
  province: string
  postalCode: string
  country: string
}

interface CheckoutItem {
  productId: string
  title: string
  image: string
  price: number
  quantity?: number
  sellerId: string
  type: 'auction_win' | 'buy_now'
}

const Checkout = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, isAuthenticated } = useAuthStore()
  
  const [loading, setLoading] = useState(false)
  const [processingPayment, setProcessingPayment] = useState(false)
  const [checkoutItem, setCheckoutItem] = useState<CheckoutItem | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<'payfast' | 'flutterwave' | 'wallet'>('payfast')
  const [userBalance, setUserBalance] = useState(0)
  const [shippingInfo, setShippingInfo] = useState<ShippingInfo>({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    province: 'Gauteng',
    postalCode: '',
    country: 'South Africa'
  })

  useEffect(() => {
    if (!isAuthenticated) {
      toast.error('Please login to continue')
      navigate('/login', { state: { from: '/checkout' } })
      return
    }

    // Get checkout data from location state
    if (!location.state?.item) {
      // Try to get product ID from URL params if available
      const urlParams = new URLSearchParams(window.location.search)
      const productId = urlParams.get('productId')
      
      if (productId) {
        // Redirect to product page to restart checkout process
        toast.error('Session expired. Please try again.')
        navigate(`/products/${productId}`)
      } else {
        toast.error('No item to checkout. Please select a product.')
        navigate('/products')
      }
      return
    }

    setCheckoutItem(location.state.item)
    loadUserData()
  }, [isAuthenticated, location.state])

  const loadUserData = async () => {
    try {
      const response = await axios.get('/api/users/profile')
      if (response.data.success) {
        const userData = response.data.data
        
        // Pre-fill shipping info from user profile
        setShippingInfo(prev => ({
          ...prev,
          fullName: userData.name || `${userData.firstName || ''} ${userData.lastName || ''}`.trim(),
          email: userData.email || '',
          phone: userData.phone || '',
          address: userData.address || '',
          city: userData.city || '',
          province: userData.province || 'Gauteng',
          postalCode: userData.postalCode || '',
          country: userData.country || 'South Africa'
        }))
        
        // Set user balance
        setUserBalance(userData.balance || 0)
      }
    } catch (error) {
      console.error('Error loading user data:', error)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setShippingInfo(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const validateShippingInfo = () => {
    const required = ['fullName', 'email', 'phone', 'address', 'city', 'province', 'postalCode']
    for (const field of required) {
      if (!shippingInfo[field as keyof ShippingInfo]) {
        toast.error(`Please fill in ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`)
        return false
      }
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(shippingInfo.email)) {
      toast.error('Please enter a valid email address')
      return false
    }
    
    // Phone validation (South African format)
    const phoneRegex = /^(\+27|0)[1-9][0-9]{8}$/
    if (!phoneRegex.test(shippingInfo.phone.replace(/\s/g, ''))) {
      toast.error('Please enter a valid South African phone number')
      return false
    }
    
    return true
  }

  const processPayment = async () => {
    if (!checkoutItem) return
    
    if (!validateShippingInfo()) {
      return
    }

    setProcessingPayment(true)

    try {
      // First create the order
      const orderResponse = await axios.post('/api/orders', {
        productId: checkoutItem.productId,
        type: checkoutItem.type,
        amount: checkoutItem.price,
        shippingInfo,
        paymentMethod
      })

      if (!orderResponse.data.success) {
        throw new Error('Failed to create order')
      }

      const orderId = orderResponse.data.data.id

      // Process payment based on selected method
      if (paymentMethod === 'wallet') {
        // Check wallet balance
        if (userBalance < checkoutItem.price) {
          toast.error('Insufficient wallet balance')
          return
        }

        // Process wallet payment
        const walletResponse = await axios.post('/api/payments/wallet', {
          orderId,
          amount: checkoutItem.price
        })

        if (walletResponse.data.success) {
          toast.success('Payment successful!')
          navigate('/payment/success', { 
            state: { 
              orderId, 
              paymentMethod: 'wallet' 
            } 
          })
        } else {
          throw new Error('Wallet payment failed')
        }

      } else if (paymentMethod === 'payfast') {
        // Initialize PayFast payment
        const response = await axios.post('/api/payments/payfast/initialize', {
          orderId,
          amount: checkoutItem.price,
          itemName: checkoutItem.title,
          itemDescription: `Payment for ${checkoutItem.title}`
        })

        if (response.data.success && response.data.data) {
          // Create and submit PayFast form
          const form = document.createElement('form')
          form.method = 'POST'
          form.action = response.data.data.paymentUrl
          form.target = '_self' // Submit in same window
          
          // Log the data for debugging
          console.log('PayFast submission URL:', response.data.data.paymentUrl)
          console.log('PayFast data:', response.data.data.paymentData)
          
          Object.keys(response.data.data.paymentData).forEach(key => {
            const input = document.createElement('input')
            input.type = 'hidden'
            input.name = key
            // Convert to string explicitly
            input.value = String(response.data.data.paymentData[key] || '')
            form.appendChild(input)
          })
          
          document.body.appendChild(form)
          form.submit()
        } else {
          toast.error('Failed to initialize PayFast payment')
        }

      } else if (paymentMethod === 'flutterwave') {
        // Initialize Flutterwave payment
        const response = await axios.post('/api/payments/flutterwave/initialize', {
          productId: checkoutItem.productId,
          amount: checkoutItem.price,
          currency: 'ZAR',
          redirectUrl: `${window.location.origin}/payment/success?order_id=${orderId}&method=flutterwave`,
          cancelUrl: `${window.location.origin}/payment/cancel?order_id=${orderId}`,
          customerDetails: {
            email: shippingInfo.email,
            name: shippingInfo.fullName,
            phoneNumber: shippingInfo.phone
          },
          metadata: {
            orderId,
            productTitle: checkoutItem.title
          }
        })
        
        if (response.data.status === 'success' && response.data.data?.link) {
          window.location.href = response.data.data.link
        }
      }

    } catch (error: any) {
      console.error('Payment error:', error)
      toast.error(error.response?.data?.message || 'Payment processing failed')
    } finally {
      setProcessingPayment(false)
    }
  }

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR'
    }).format(amount)
  }

  if (!checkoutItem) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  const provinces = [
    'Eastern Cape', 'Free State', 'Gauteng', 'KwaZulu-Natal',
    'Limpopo', 'Mpumalanga', 'North West', 'Northern Cape', 'Western Cape'
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
    >
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center">
          <button
            onClick={() => {
              if (checkoutItem?.productId) {
                navigate(`/products/${checkoutItem.productId}`)
              } else {
                navigate('/products')
              }
            }}
            className="mr-4 p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
        {/* Left Column - Shipping & Payment */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          {/* Shipping Information */}
          <div className="card">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6 flex items-center">
              <TruckIcon className="h-6 w-6 mr-2 text-primary-600" />
              Shipping Information
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <UserIcon className="inline h-4 w-4 mr-1" />
                  Full Name *
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={shippingInfo.fullName}
                  onChange={handleInputChange}
                  className="input"
                  placeholder="John Doe"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <EnvelopeIcon className="inline h-4 w-4 mr-1" />
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  value={shippingInfo.email}
                  onChange={handleInputChange}
                  className="input"
                  placeholder="john@example.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <PhoneIcon className="inline h-4 w-4 mr-1" />
                  Phone Number *
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={shippingInfo.phone}
                  onChange={handleInputChange}
                  className="input"
                  placeholder="+27 82 123 4567"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <MapPinIcon className="inline h-4 w-4 mr-1" />
                  Postal Code *
                </label>
                <input
                  type="text"
                  name="postalCode"
                  value={shippingInfo.postalCode}
                  onChange={handleInputChange}
                  className="input"
                  placeholder="2000"
                  required
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Street Address *
                </label>
                <input
                  type="text"
                  name="address"
                  value={shippingInfo.address}
                  onChange={handleInputChange}
                  className="input"
                  placeholder="123 Main Street, Apartment 4B"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  City *
                </label>
                <input
                  type="text"
                  name="city"
                  value={shippingInfo.city}
                  onChange={handleInputChange}
                  className="input"
                  placeholder="Johannesburg"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Province *
                </label>
                <select
                  name="province"
                  value={shippingInfo.province}
                  onChange={handleInputChange}
                  className="input"
                  required
                >
                  {provinces.map(province => (
                    <option key={province} value={province}>{province}</option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Country
                </label>
                <input
                  type="text"
                  name="country"
                  value={shippingInfo.country}
                  className="input bg-gray-100"
                  disabled
                />
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div className="card">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6 flex items-center">
              <CreditCardIcon className="h-6 w-6 mr-2 text-primary-600" />
              Payment Method
            </h2>

            <div className="space-y-3">
              {/* Wallet Option */}
              <label className="relative flex flex-col sm:flex-row items-start p-3 sm:p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="wallet"
                  checked={paymentMethod === 'wallet'}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="mt-1"
                />
                <div className="ml-0 sm:ml-3 mt-2 sm:mt-0 flex-1 w-full">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <div>
                      <div className="font-medium text-gray-900 flex items-center gap-2">
                        <WalletIcon className="h-5 w-5 mr-2 text-green-600" />
                        Wallet Balance
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        Pay instantly from your account balance
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Available:</p>
                      <p className={`font-semibold ${userBalance >= (checkoutItem?.price || 0) ? 'text-green-600' : 'text-red-600'}`}>
                        {formatPrice(userBalance)}
                      </p>
                    </div>
                  </div>
                  {paymentMethod === 'wallet' && userBalance < (checkoutItem?.price || 0) && (
                    <div className="mt-2 p-2 bg-red-50 text-red-700 text-xs sm:text-sm rounded-md flex items-center">
                      <InformationCircleIcon className="h-4 w-4 mr-1" />
                      Insufficient balance. Please choose another payment method.
                    </div>
                  )}
                </div>
              </label>

              {/* PayFast Option */}
              <label className="relative flex flex-col sm:flex-row items-start p-3 sm:p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="payfast"
                  checked={paymentMethod === 'payfast'}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="mt-1"
                />
                <div className="ml-0 sm:ml-3 mt-2 sm:mt-0 flex-1 w-full">
                  <div className="font-medium text-gray-900 flex items-center">
                    <img src="/payfast-logo.svg" alt="PayFast" className="h-5 mr-2" />
                    PayFast
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Credit/Debit Cards, Instant EFT, QR Payments (South Africa)
                  </p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded">Visa</span>
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded">Mastercard</span>
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded">Instant EFT</span>
                  </div>
                </div>
              </label>

              {/* Flutterwave Option */}
              <label className="relative flex flex-col sm:flex-row items-start p-3 sm:p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="flutterwave"
                  checked={paymentMethod === 'flutterwave'}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="mt-1"
                />
                <div className="ml-0 sm:ml-3 mt-2 sm:mt-0 flex-1 w-full">
                  <div className="font-medium text-gray-900">
                    Flutterwave
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    International Cards, Mobile Money, Bank Transfer
                  </p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded">International</span>
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded">Mobile Money</span>
                  </div>
                </div>
              </label>
            </div>

            <div className="mt-4 p-3 bg-blue-50 rounded-lg flex items-start">
              <ShieldCheckIcon className="h-5 w-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-semibold">Secure Payment</p>
                <p>Your payment information is encrypted and secure. We never store your card details.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Order Summary */}
        <div>
          <div className="card sticky top-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Order Summary
            </h2>

            {/* Item */}
            <div className="flex space-x-2 sm:space-x-4 pb-4 border-b">
              <img
                src={checkoutItem.image}
                alt={checkoutItem.title}
                className="w-20 h-20 object-cover rounded-lg"
              />
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-gray-900">{checkoutItem.title}</h3>
                <p className="text-sm text-gray-500 mt-1">
                  {checkoutItem.type === 'auction_win' ? 'Auction Win' : 'Buy Now'}
                </p>
                <p className="text-sm font-semibold text-primary-600 mt-2">
                  {formatPrice(checkoutItem.price)}
                </p>
              </div>
            </div>

            {/* Price Breakdown */}
            <div className="space-y-3 py-4 border-b">
              <div className="flex justify-between text-xs sm:text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">{formatPrice(checkoutItem.price)}</span>
              </div>
              <div className="flex justify-between text-xs sm:text-sm">
                <span className="text-gray-600">Shipping</span>
                <span className="font-medium">Free</span>
              </div>
              <div className="flex justify-between text-xs sm:text-sm">
                <span className="text-gray-600">Tax (15% VAT)</span>
                <span className="font-medium">{formatPrice(checkoutItem.price * 0.15)}</span>
              </div>
            </div>

            {/* Total */}
            <div className="py-4">
              <div className="flex justify-between text-base sm:text-lg font-semibold">
                <span>Total</span>
                <span className="text-primary-600">
                  {formatPrice(checkoutItem.price * 1.15)}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                * VAT inclusive price shown
              </p>
            </div>

            {/* Checkout Button */}
            <button
              onClick={processPayment}
              disabled={processingPayment || (paymentMethod === 'wallet' && userBalance < checkoutItem.price)}
              className={`w-full btn-primary flex items-center justify-center ${
                processingPayment || (paymentMethod === 'wallet' && userBalance < checkoutItem.price)
                  ? 'opacity-50 cursor-not-allowed'
                  : ''
              }`}
            >
              {processingPayment ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircleIcon className="h-5 w-5 mr-2" />
                  Complete Purchase
                </>
              )}
            </button>

            {/* Security Badge */}
            <div className="mt-4 text-center">
              <div className="flex items-center justify-center text-xs text-gray-500">
                <ShieldCheckIcon className="h-4 w-4 mr-1" />
                Secured by SSL Encryption
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default Checkout