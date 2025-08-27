import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { CheckCircleIcon } from '@heroicons/react/24/outline'
import { motion } from 'framer-motion'
import axios from 'axios'
import toast from 'react-hot-toast'

const PaymentSuccess = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  
  useEffect(() => {
    const verifyPayment = async () => {
      const transactionId = searchParams.get('transaction_id')
      const txRef = searchParams.get('tx_ref')
      
      if (transactionId || txRef) {
        try {
          const response = await axios.post('/api/payments/flutterwave/verify', {
            transactionId: transactionId || txRef
          })
          
          if (response.data.status === 'success') {
            toast.success('Payment successful! Your order has been confirmed.')
          } else {
            toast.error('Payment verification failed. Please contact support.')
          }
        } catch (error) {
          console.error('Payment verification error:', error)
          toast.error('Failed to verify payment. Please contact support.')
        }
      }
    }
    
    verifyPayment()
  }, [searchParams])
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8"
    >
      <div className="max-w-md w-full space-y-8 text-center">
        <div>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-green-100"
          >
            <CheckCircleIcon className="h-16 w-16 text-green-600" />
          </motion.div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Payment Successful!
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Your payment has been processed successfully.
          </p>
        </div>
        
        <div className="space-y-4">
          <div className="bg-gray-50 rounded-lg p-6">
            <p className="text-sm text-gray-700">
              You will receive a confirmation email shortly with your order details.
            </p>
          </div>
          
          <div className="flex flex-col space-y-2">
            <button
              onClick={() => navigate('/orders')}
              className="btn-primary"
            >
              View Orders
            </button>
            <button
              onClick={() => navigate('/products')}
              className="btn-outline"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default PaymentSuccess