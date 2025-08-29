import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import axios from 'axios'
import toast from 'react-hot-toast'
import { useAuthStore } from '../store/authStore'
import {
  PhotoIcon,
  TrashIcon,
  ArrowLeftIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'

interface Category {
  id: string
  name: string
}

interface ShippingOption {
  method: string
  cost: number
  estimatedDays: string
}

const EditProduct = () => {
  const { productId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    categoryId: '',
    condition: 'new',
    startingPrice: '',
    buyNowPrice: '',
    reservePrice: '',
    endDate: '',
    location: '',
    images: [] as string[],
    shippingOptions: [] as ShippingOption[],
    tags: [] as string[]
  })

  const [newTag, setNewTag] = useState('')
  const [newShipping, setNewShipping] = useState<ShippingOption>({
    method: '',
    cost: 0,
    estimatedDays: ''
  })

  useEffect(() => {
    // Check if user is admin
    if (!user || user.role !== 'admin') {
      toast.error('Only admin can edit products')
      navigate('/admin/products')
      return
    }

    fetchProduct()
    fetchCategories()
  }, [productId, user])

  const fetchProduct = async () => {
    try {
      const response = await axios.get(`/api/products/${productId}`)
      if (response.data.success) {
        const product = response.data.data
        
        // Check if admin owns this product
        if (product.sellerId !== user?.uid) {
          toast.error('You can only edit your own products')
          navigate('/admin/products')
          return
        }

        setFormData({
          title: product.title || '',
          description: product.description || '',
          categoryId: product.categoryId || '',
          condition: product.condition || 'new',
          startingPrice: product.startingPrice?.toString() || '',
          buyNowPrice: product.buyNowPrice?.toString() || '',
          reservePrice: product.reservePrice?.toString() || '',
          endDate: product.endDate ? new Date(product.endDate._seconds * 1000).toISOString().split('T')[0] : '',
          location: product.location || '',
          images: product.images || [],
          shippingOptions: product.shippingOptions || [],
          tags: product.tags || []
        })
      }
    } catch (error) {
      console.error('Error fetching product:', error)
      toast.error('Failed to load product')
      navigate('/admin/products')
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await axios.get('/api/categories')
      if (response.data.success) {
        setCategories(response.data.data)
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
      toast.error('Failed to load categories')
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleImageAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // In a real app, upload to storage and get URL
      // For now, using local URL
      const imageUrl = URL.createObjectURL(file)
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, imageUrl]
      }))
    }
  }

  const handleImageRemove = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }))
  }

  const handleTagAdd = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }))
      setNewTag('')
    }
  }

  const handleTagRemove = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }))
  }

  const handleShippingAdd = () => {
    if (newShipping.method && newShipping.cost >= 0) {
      setFormData(prev => ({
        ...prev,
        shippingOptions: [...prev.shippingOptions, { ...newShipping }]
      }))
      setNewShipping({ method: '', cost: 0, estimatedDays: '' })
    }
  }

  const handleShippingRemove = (index: number) => {
    setFormData(prev => ({
      ...prev,
      shippingOptions: prev.shippingOptions.filter((_, i) => i !== index)
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const updateData: any = {
        title: formData.title,
        description: formData.description,
        categoryId: formData.categoryId,
        condition: formData.condition,
        location: formData.location,
        images: formData.images,
        shippingOptions: formData.shippingOptions,
        tags: formData.tags
      }

      // Only include price fields if they have values
      if (formData.startingPrice) updateData.startingPrice = parseFloat(formData.startingPrice)
      if (formData.buyNowPrice) updateData.buyNowPrice = parseFloat(formData.buyNowPrice)
      if (formData.reservePrice) updateData.reservePrice = parseFloat(formData.reservePrice)
      if (formData.endDate) updateData.endDate = formData.endDate

      const response = await axios.put(`/api/products/${productId}`, updateData)

      if (response.data.success) {
        toast.success('Product updated successfully')
        navigate('/admin/products')
      }
    } catch (error: any) {
      console.error('Error updating product:', error)
      toast.error(error.response?.data?.error || 'Failed to update product')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
    >
      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={() => navigate('/admin/products')}
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
          Back to Products
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Edit Product</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow">
        {/* Basic Information */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                className="input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                required
                rows={4}
                className="input"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category *
                </label>
                <select
                  name="categoryId"
                  value={formData.categoryId}
                  onChange={handleInputChange}
                  required
                  className="input"
                >
                  <option value="">Select Category</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Condition
                </label>
                <select
                  name="condition"
                  value={formData.condition}
                  onChange={handleInputChange}
                  className="input"
                >
                  <option value="new">New</option>
                  <option value="like-new">Like New</option>
                  <option value="good">Good</option>
                  <option value="fair">Fair</option>
                  <option value="poor">Poor</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Pricing</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Starting Price (R) *
              </label>
              <input
                type="number"
                name="startingPrice"
                value={formData.startingPrice}
                onChange={handleInputChange}
                required
                min="0"
                step="0.01"
                className="input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Buy Now Price (R)
              </label>
              <input
                type="number"
                name="buyNowPrice"
                value={formData.buyNowPrice}
                onChange={handleInputChange}
                min="0"
                step="0.01"
                className="input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reserve Price (R)
              </label>
              <input
                type="number"
                name="reservePrice"
                value={formData.reservePrice}
                onChange={handleInputChange}
                min="0"
                step="0.01"
                className="input"
              />
            </div>
          </div>
        </div>

        {/* Auction Details */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Auction Details</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                name="endDate"
                value={formData.endDate}
                onChange={handleInputChange}
                min={new Date().toISOString().split('T')[0]}
                className="input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                placeholder="e.g., Cape Town, South Africa"
                className="input"
              />
            </div>
          </div>
        </div>

        {/* Images */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Images</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {formData.images.map((image, index) => (
              <div key={index} className="relative">
                <img
                  src={image}
                  alt={`Product ${index + 1}`}
                  className="w-full h-24 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => handleImageRemove(index)}
                  className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full hover:bg-red-700"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>
            ))}
            
            <label className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:border-gray-400">
              <PhotoIcon className="h-8 w-8 text-gray-400" />
              <span className="mt-2 text-xs text-gray-600">Add Image</span>
              <input
                type="file"
                onChange={handleImageAdd}
                accept="image/*"
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Tags */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Tags</h2>
          
          <div className="flex flex-wrap gap-2 mb-3">
            {formData.tags.map(tag => (
              <span key={tag} className="px-3 py-1 bg-gray-100 rounded-full text-sm flex items-center">
                {tag}
                <button
                  type="button"
                  onClick={() => handleTagRemove(tag)}
                  className="ml-2 text-gray-500 hover:text-red-600"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </span>
            ))}
          </div>
          
          <div className="flex gap-2">
            <input
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              placeholder="Add a tag"
              className="input flex-1"
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleTagAdd())}
            />
            <button
              type="button"
              onClick={handleTagAdd}
              className="btn-secondary"
            >
              Add Tag
            </button>
          </div>
        </div>

        {/* Shipping Options */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Shipping Options</h2>
          
          <div className="space-y-2 mb-4">
            {formData.shippingOptions.map((option, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <span className="font-medium">{option.method}</span>
                  <span className="ml-3 text-gray-600">R{option.cost}</span>
                  {option.estimatedDays && (
                    <span className="ml-2 text-sm text-gray-500">({option.estimatedDays})</span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => handleShippingRemove(index)}
                  className="text-red-600 hover:text-red-700"
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              </div>
            ))}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <input
              type="text"
              value={newShipping.method}
              onChange={(e) => setNewShipping(prev => ({ ...prev, method: e.target.value }))}
              placeholder="Shipping method"
              className="input"
            />
            <input
              type="number"
              value={newShipping.cost}
              onChange={(e) => setNewShipping(prev => ({ ...prev, cost: parseFloat(e.target.value) }))}
              placeholder="Cost (R)"
              min="0"
              step="0.01"
              className="input"
            />
            <div className="flex gap-2">
              <input
                type="text"
                value={newShipping.estimatedDays}
                onChange={(e) => setNewShipping(prev => ({ ...prev, estimatedDays: e.target.value }))}
                placeholder="Est. days"
                className="input"
              />
              <button
                type="button"
                onClick={handleShippingAdd}
                className="btn-secondary"
              >
                Add
              </button>
            </div>
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={saving}
            className="btn-primary flex-1"
          >
            {saving ? 'Updating...' : 'Update Product'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/admin/products')}
            className="btn-outline flex-1"
          >
            Cancel
          </button>
        </div>
      </form>
    </motion.div>
  )
}

export default EditProduct