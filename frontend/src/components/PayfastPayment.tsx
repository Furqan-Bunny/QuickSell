import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { ShieldCheckIcon } from '@heroicons/react/24/outline'

interface PayfastPaymentProps {
  orderId: string
  amount: number
  itemName: string
  itemDescription?: string
  onSuccess?: () => void
  onCancel?: () => void
}

const PayfastPayment = ({
  orderId,
  amount,
  itemName,
  itemDescription,
  onSuccess,
  onCancel
}: PayfastPaymentProps) => {
  const [loading, setLoading] = useState(false)
  const [paymentData, setPaymentData] = useState<any>(null)
  const formRef = useRef<HTMLFormElement>(null)

  const initializePayment = async () => {
    setLoading(true)
    try {
      const response = await axios.post('/api/payments/payfast/initialize', {
        orderId,
        amount,
        itemName,
        itemDescription: itemDescription || `Payment for ${itemName}`
      })

      if (response.data.success) {
        setPaymentData(response.data.data)
        
        // Auto-submit form after data is loaded
        setTimeout(() => {
          if (formRef.current) {
            formRef.current.submit()
          }
        }, 100)
      } else {
        throw new Error(response.data.message || 'Failed to initialize payment')
      }
    } catch (error: any) {
      console.error('Payment initialization error:', error)
      toast.error(error.response?.data?.message || 'Failed to initialize payment')
      setLoading(false)
    }
  }

  useEffect(() => {
    // Check if we're returning from PayFast
    const urlParams = new URLSearchParams(window.location.search)
    const status = urlParams.get('status')
    
    if (status === 'success' && onSuccess) {
      onSuccess()
    } else if (status === 'cancel' && onCancel) {
      onCancel()
    }
  }, [onSuccess, onCancel])

  const formatAmount = (value: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR'
    }).format(value)
  }

  return (
    <div className="bg-white rounded-lg p-6 border border-gray-200">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Secure Payment with PayFast
        </h3>
        <p className="text-sm text-gray-600">
          You will be redirected to PayFast to complete your payment securely.
        </p>
      </div>

      <div className="bg-gray-50 rounded-lg p-4 mb-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Item:</span>
            <span className="font-medium text-gray-900">{itemName}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Order ID:</span>
            <span className="font-medium text-gray-900">#{orderId}</span>
          </div>
          <div className="border-t pt-2 mt-2">
            <div className="flex justify-between">
              <span className="text-gray-900 font-medium">Total Amount:</span>
              <span className="text-lg font-bold text-primary-600">
                {formatAmount(amount)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* PayFast Form (hidden, auto-submitted) */}
      {paymentData && (
        <form
          ref={formRef}
          action={paymentData.paymentUrl}
          method="POST"
          style={{ display: 'none' }}
        >
          {Object.keys(paymentData.paymentData).map((key) => (
            <input
              key={key}
              type="hidden"
              name={key}
              value={paymentData.paymentData[key]}
            />
          ))}
        </form>
      )}

      <button
        onClick={initializePayment}
        disabled={loading}
        className={`w-full btn-primary flex items-center justify-center gap-2 ${
          loading ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      >
        {loading ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            Redirecting to PayFast...
          </>
        ) : (
          <>
            <ShieldCheckIcon className="h-5 w-5" />
            Pay with PayFast
          </>
        )}
      </button>

      <div className="mt-4 flex items-center justify-center gap-4">
        <img
          src="https://www.payfast.co.za/images/logo-light.svg"
          alt="PayFast"
          className="h-8"
        />
        <div className="flex gap-2">
          <img
            src="https://www.payfast.co.za/images/visa.svg"
            alt="Visa"
            className="h-6"
          />
          <img
            src="https://www.payfast.co.za/images/mastercard.svg"
            alt="Mastercard"
            className="h-6"
          />
          <img
            src="https://www.payfast.co.za/images/instant-eft.svg"
            alt="Instant EFT"
            className="h-6"
          />
        </div>
      </div>

      <p className="text-xs text-gray-500 text-center mt-3">
        Your payment is secured by PayFast's PCI DSS compliant infrastructure
      </p>
    </div>
  )
}

export default PayfastPayment