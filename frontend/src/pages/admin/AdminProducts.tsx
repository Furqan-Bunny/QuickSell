import { motion } from 'framer-motion'
import { useState } from 'react'
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  PencilIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
  StarIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  TagIcon,
  ShoppingBagIcon,
  ClockIcon,
  FireIcon,
  PlusCircleIcon,
  PhotoIcon
} from '@heroicons/react/24/outline'
import { formatPrice } from '../../data/mockData'
import toast from 'react-hot-toast'

const AdminProducts = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState<any>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [newProduct, setNewProduct] = useState({
    title: '',
    description: '',
    category: 'Electronics',
    condition: 'new',
    startingPrice: '',
    reservePrice: '',
    duration: '7',
    images: [] as string[],
    specifications: '',
    shippingInfo: '',
    sellerName: '',
    sellerUsername: ''
  })

  // Mock products data
  const mockProducts = [
    {
      id: '1',
      title: 'Vintage Rolex Submariner',
      description: 'Classic diving watch in excellent condition',
      seller: 'watchcollector123',
      sellerName: 'John Smith',
      currentBid: 85000,
      startingPrice: 50000,
      category: 'Watches',
      status: 'active',
      condition: 'excellent',
      timeLeft: '2d 14h',
      bidsCount: 23,
      watchers: 156,
      featured: true,
      approved: true,
      images: ['https://images.unsplash.com/photo-1523170335258-f5c6c6bd6edb?w=300&h=300&fit=crop'],
      listedDate: '2024-12-18',
      endDate: '2024-12-24'
    },
    {
      id: '2',
      title: 'iPhone 15 Pro Max - Unopened',
      description: 'Brand new iPhone 15 Pro Max 256GB in Natural Titanium',
      seller: 'techdealer',
      sellerName: 'Sarah Johnson',
      currentBid: 12000,
      startingPrice: 10000,
      category: 'Electronics',
      status: 'pending',
      condition: 'new',
      timeLeft: '5d 8h',
      bidsCount: 45,
      watchers: 234,
      featured: false,
      approved: false,
      images: ['https://images.unsplash.com/photo-1592286634469-9b7429b91b65?w=300&h=300&fit=crop'],
      listedDate: '2024-12-20',
      endDate: '2024-12-26'
    },
    {
      id: '3',
      title: 'Rare Pokemon Card Collection',
      description: 'Complete set of 1st edition Base Set cards',
      seller: 'pokemonmaster',
      sellerName: 'Mike Wilson',
      currentBid: 25000,
      startingPrice: 15000,
      category: 'Collectibles',
      status: 'active',
      condition: 'near mint',
      timeLeft: '1d 3h',
      bidsCount: 67,
      watchers: 89,
      featured: true,
      approved: true,
      images: ['https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=300&h=300&fit=crop'],
      listedDate: '2024-12-19',
      endDate: '2024-12-23'
    },
    {
      id: '4',
      title: 'Antique Victorian Jewelry Box',
      description: 'Beautiful hand-carved jewelry box from the Victorian era',
      seller: 'antiquedealer',
      sellerName: 'Emma Davis',
      currentBid: 3500,
      startingPrice: 2000,
      category: 'Antiques',
      status: 'rejected',
      condition: 'good',
      timeLeft: 'Ended',
      bidsCount: 12,
      watchers: 34,
      featured: false,
      approved: false,
      images: ['https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=300&h=300&fit=crop'],
      listedDate: '2024-12-15',
      endDate: '2024-12-22'
    },
    {
      id: '5',
      title: 'Gaming PC - RTX 4090 Setup',
      description: 'High-end gaming PC with latest components',
      seller: 'pcbuilder',
      sellerName: 'Alex Chen',
      currentBid: 35000,
      startingPrice: 25000,
      category: 'Electronics',
      status: 'active',
      condition: 'excellent',
      timeLeft: '4d 12h',
      bidsCount: 89,
      watchers: 167,
      featured: false,
      approved: true,
      images: ['https://images.unsplash.com/photo-1587831990711-23ca6441447b?w=300&h=300&fit=crop'],
      listedDate: '2024-12-17',
      endDate: '2024-12-25'
    }
  ]

  const filteredProducts = mockProducts.filter(product => {
    const matchesSearch = 
      product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.seller.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.category.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesCategory = filterCategory === 'all' || product.category === filterCategory
    const matchesStatus = filterStatus === 'all' || product.status === filterStatus
    
    return matchesSearch && matchesCategory && matchesStatus
  })

  const handleSelectAll = () => {
    if (selectedProducts.length === filteredProducts.length) {
      setSelectedProducts([])
    } else {
      setSelectedProducts(filteredProducts.map(p => p.id))
    }
  }

  const handleSelectProduct = (productId: string) => {
    if (selectedProducts.includes(productId)) {
      setSelectedProducts(selectedProducts.filter(id => id !== productId))
    } else {
      setSelectedProducts([...selectedProducts, productId])
    }
  }

  const handleApproveProduct = (productId: string) => {
    toast.success('Product approved successfully')
  }

  const handleRejectProduct = (productId: string) => {
    toast.success('Product rejected')
  }

  const handleFeatureProduct = (productId: string) => {
    toast.success('Product featured successfully')
  }

  const handleDeleteProduct = (productId: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      toast.success('Product deleted successfully')
    }
  }

  const handleEditProduct = (product: any) => {
    setEditingProduct(product)
    setShowEditModal(true)
  }

  const handleBulkAction = (action: string) => {
    if (selectedProducts.length === 0) {
      toast.error('Please select products first')
      return
    }
    
    switch (action) {
      case 'approve':
        toast.success(`${selectedProducts.length} products approved`)
        setSelectedProducts([])
        break
      case 'reject':
        toast.success(`${selectedProducts.length} products rejected`)
        setSelectedProducts([])
        break
      case 'feature':
        toast.success(`${selectedProducts.length} products featured`)
        setSelectedProducts([])
        break
      case 'delete':
        if (confirm(`Delete ${selectedProducts.length} products?`)) {
          toast.success(`${selectedProducts.length} products deleted`)
          setSelectedProducts([])
        }
        break
    }
  }

  const handleAddProduct = () => {
    // Validate required fields
    if (!newProduct.title || !newProduct.description || !newProduct.startingPrice || !newProduct.sellerName || !newProduct.sellerUsername) {
      toast.error('Please fill in all required fields')
      return
    }

    // In a real app, this would make an API call
    toast.success('Product added successfully and sent for approval')
    setShowAddModal(false)
    setNewProduct({
      title: '',
      description: '',
      category: 'Electronics',
      condition: 'new',
      startingPrice: '',
      reservePrice: '',
      duration: '7',
      images: [],
      specifications: '',
      shippingInfo: '',
      sellerName: '',
      sellerUsername: ''
    })
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    // In a real app, this would handle actual file upload
    const files = e.target.files
    if (files) {
      const imageUrls = Array.from(files).map(file => URL.createObjectURL(file))
      setNewProduct(prev => ({
        ...prev,
        images: [...prev.images, ...imageUrls].slice(0, 5) // Limit to 5 images
      }))
    }
  }

  const removeImage = (index: number) => {
    setNewProduct(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }))
  }

  const getStatusBadge = (status: string) => {
    const badges: any = {
      active: { bg: 'bg-green-100', text: 'text-green-700', icon: CheckCircleIcon },
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: ClockIcon },
      rejected: { bg: 'bg-red-100', text: 'text-red-700', icon: XCircleIcon },
      ended: { bg: 'bg-gray-100', text: 'text-gray-700', icon: ClockIcon }
    }
    return badges[status] || badges.pending
  }

  const stats = {
    totalProducts: mockProducts.length,
    activeAuctions: mockProducts.filter(p => p.status === 'active').length,
    pendingApproval: mockProducts.filter(p => p.status === 'pending').length,
    featuredItems: mockProducts.filter(p => p.featured).length
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card bg-gradient-to-br from-blue-50 to-blue-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 font-medium">Total Products</p>
              <p className="text-2xl font-bold text-blue-900">{stats.totalProducts}</p>
              <p className="text-xs text-blue-600 mt-1">All listed items</p>
            </div>
            <ShoppingBagIcon className="h-10 w-10 text-blue-500" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-green-50 to-green-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 font-medium">Active Auctions</p>
              <p className="text-2xl font-bold text-green-900">{stats.activeAuctions}</p>
              <p className="text-xs text-green-600 mt-1">Currently running</p>
            </div>
            <CheckCircleIcon className="h-10 w-10 text-green-500" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-yellow-50 to-yellow-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-yellow-600 font-medium">Pending Approval</p>
              <p className="text-2xl font-bold text-yellow-900">{stats.pendingApproval}</p>
              <p className="text-xs text-yellow-600 mt-1">Awaiting review</p>
            </div>
            <ClockIcon className="h-10 w-10 text-yellow-500" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-purple-50 to-purple-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-600 font-medium">Featured Items</p>
              <p className="text-2xl font-bold text-purple-900">{stats.featuredItems}</p>
              <p className="text-xs text-purple-600 mt-1">Promoted listings</p>
            </div>
            <FireIcon className="h-10 w-10 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Filters and Actions */}
      <div className="card">
        <div className="flex flex-wrap gap-4 justify-between items-center">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="input-field pl-10"
              />
            </div>
            
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="input-field w-auto"
            >
              <option value="all">All Categories</option>
              <option value="Electronics">Electronics</option>
              <option value="Watches">Watches</option>
              <option value="Collectibles">Collectibles</option>
              <option value="Antiques">Antiques</option>
              <option value="Art">Art</option>
              <option value="Fashion">Fashion</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="input-field w-auto"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="rejected">Rejected</option>
              <option value="ended">Ended</option>
            </select>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setShowAddModal(true)}
              className="btn-primary flex items-center gap-2"
            >
              <PlusCircleIcon className="h-4 w-4" />
              Add Product
            </button>
            <button className="btn-outline flex items-center gap-2">
              <ArrowDownTrayIcon className="h-4 w-4" />
              Export
            </button>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedProducts.length > 0 && (
          <div className="mt-4 p-3 bg-primary-50 rounded-lg flex justify-between items-center">
            <span className="text-sm text-primary-700">
              {selectedProducts.length} product(s) selected
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => handleBulkAction('approve')}
                className="text-sm text-green-600 hover:text-green-700"
              >
                Approve
              </button>
              <button
                onClick={() => handleBulkAction('reject')}
                className="text-sm text-red-600 hover:text-red-700"
              >
                Reject
              </button>
              <button
                onClick={() => handleBulkAction('feature')}
                className="text-sm text-purple-600 hover:text-purple-700"
              >
                Feature
              </button>
              <button
                onClick={() => handleBulkAction('delete')}
                className="text-sm text-red-600 hover:text-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Products Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedProducts.length === filteredProducts.length && filteredProducts.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Seller</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bids</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredProducts.map((product) => {
                const statusStyle = getStatusBadge(product.status)
                const StatusIcon = statusStyle.icon
                
                return (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedProducts.includes(product.id)}
                        onChange={() => handleSelectProduct(product.id)}
                        className="rounded border-gray-300"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={product.images[0]}
                          alt={product.title}
                          className="h-12 w-12 rounded-lg object-cover"
                        />
                        <div>
                          <p className="font-medium text-gray-900 line-clamp-1">{product.title}</p>
                          <p className="text-sm text-gray-600 line-clamp-1">{product.description}</p>
                          <div className="flex items-center gap-2 mt-1">
                            {product.featured && (
                              <StarIcon className="h-4 w-4 text-yellow-500 fill-current" />
                            )}
                            <span className="text-xs text-gray-500">{product.timeLeft}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm">
                        <p className="font-medium text-gray-900">{product.sellerName}</p>
                        <p className="text-gray-600">@{product.seller}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm">
                        <p className="font-medium text-gray-900">{formatPrice(product.currentBid)}</p>
                        <p className="text-xs text-gray-500">Start: {formatPrice(product.startingPrice)}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusStyle.bg} ${statusStyle.text}`}>
                        <StatusIcon className="h-3 w-3" />
                        {product.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                        <TagIcon className="h-3 w-3" />
                        {product.category}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm">
                        <p className="font-medium text-gray-900">{product.bidsCount}</p>
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <EyeIcon className="h-3 w-3" />
                          {product.watchers}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEditProduct(product)}
                          className="p-1 text-gray-600 hover:text-primary-600"
                          title="Edit"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        {product.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApproveProduct(product.id)}
                              className="p-1 text-gray-600 hover:text-green-600"
                              title="Approve"
                            >
                              <CheckCircleIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleRejectProduct(product.id)}
                              className="p-1 text-gray-600 hover:text-red-600"
                              title="Reject"
                            >
                              <XCircleIcon className="h-4 w-4" />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => handleFeatureProduct(product.id)}
                          className="p-1 text-gray-600 hover:text-yellow-600"
                          title="Feature"
                        >
                          <StarIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(product.id)}
                          className="p-1 text-gray-600 hover:text-red-600"
                          title="Delete"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl p-6 max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto"
          >
            <h3 className="text-xl font-bold text-gray-900 mb-4">Add New Product</h3>
            
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-800">Basic Information</h4>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Product Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g., iPhone 15 Pro Max 256GB"
                    value={newProduct.title}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, title: e.target.value }))}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={4}
                    className="input-field"
                    placeholder="Provide detailed description of the product..."
                    value={newProduct.description}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <select 
                      className="input-field"
                      value={newProduct.category}
                      onChange={(e) => setNewProduct(prev => ({ ...prev, category: e.target.value }))}
                    >
                      <option value="Electronics">Electronics</option>
                      <option value="Watches">Watches</option>
                      <option value="Collectibles">Collectibles</option>
                      <option value="Antiques">Antiques</option>
                      <option value="Art">Art</option>
                      <option value="Fashion">Fashion</option>
                      <option value="Jewelry">Jewelry</option>
                      <option value="Sports">Sports</option>
                      <option value="Books">Books</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Condition</label>
                    <select 
                      className="input-field"
                      value={newProduct.condition}
                      onChange={(e) => setNewProduct(prev => ({ ...prev, condition: e.target.value }))}
                    >
                      <option value="new">New</option>
                      <option value="like new">Like New</option>
                      <option value="excellent">Excellent</option>
                      <option value="good">Good</option>
                      <option value="fair">Fair</option>
                      <option value="poor">Poor</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Images */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-800">Product Images</h4>
                
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                  <input
                    type="file"
                    id="image-upload"
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                  <label
                    htmlFor="image-upload"
                    className="cursor-pointer flex flex-col items-center"
                  >
                    <PhotoIcon className="h-12 w-12 text-gray-400 mb-2" />
                    <span className="text-sm text-gray-600">Click to upload images</span>
                    <span className="text-xs text-gray-500 mt-1">Max 5 images, JPG/PNG up to 10MB each</span>
                  </label>
                </div>

                {newProduct.images.length > 0 && (
                  <div className="grid grid-cols-5 gap-2">
                    {newProduct.images.map((image, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={image}
                          alt={`Product ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg"
                        />
                        <button
                          onClick={() => removeImage(index)}
                          className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <XCircleIcon className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Pricing and Auction Details */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-800">Pricing & Auction Details</h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Starting Price (R) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      className="input-field"
                      placeholder="0.00"
                      value={newProduct.startingPrice}
                      onChange={(e) => setNewProduct(prev => ({ ...prev, startingPrice: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Reserve Price (R)
                    </label>
                    <input
                      type="number"
                      className="input-field"
                      placeholder="Optional minimum selling price"
                      value={newProduct.reservePrice}
                      onChange={(e) => setNewProduct(prev => ({ ...prev, reservePrice: e.target.value }))}
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Auction Duration</label>
                  <select 
                    className="input-field"
                    value={newProduct.duration}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, duration: e.target.value }))}
                  >
                    <option value="1">1 Day</option>
                    <option value="3">3 Days</option>
                    <option value="5">5 Days</option>
                    <option value="7">7 Days</option>
                    <option value="10">10 Days</option>
                    <option value="14">14 Days</option>
                  </select>
                </div>
              </div>

              {/* Additional Information */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-800">Additional Information</h4>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Product Specifications
                  </label>
                  <textarea
                    rows={3}
                    className="input-field"
                    placeholder="e.g., Brand, Model, Size, Weight, Color, etc."
                    value={newProduct.specifications}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, specifications: e.target.value }))}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Shipping Information
                  </label>
                  <textarea
                    rows={2}
                    className="input-field"
                    placeholder="Shipping methods, costs, and estimated delivery times"
                    value={newProduct.shippingInfo}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, shippingInfo: e.target.value }))}
                  />
                </div>
              </div>

              {/* Seller Information */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-800">Seller Information</h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Seller Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="John Smith"
                      value={newProduct.sellerName}
                      onChange={(e) => setNewProduct(prev => ({ ...prev, sellerName: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Seller Username <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="@johnsmith"
                      value={newProduct.sellerUsername}
                      onChange={(e) => setNewProduct(prev => ({ ...prev, sellerUsername: e.target.value }))}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleAddProduct}
                className="btn-primary flex-1"
              >
                Add Product
              </button>
              <button
                onClick={() => {
                  setShowAddModal(false)
                  setNewProduct({
                    title: '',
                    description: '',
                    category: 'Electronics',
                    condition: 'new',
                    startingPrice: '',
                    reservePrice: '',
                    duration: '7',
                    images: [],
                    specifications: '',
                    shippingInfo: '',
                    sellerName: '',
                    sellerUsername: ''
                  })
                }}
                className="btn-outline flex-1"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Edit Product Modal */}
      {showEditModal && editingProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
          >
            <h3 className="text-xl font-bold text-gray-900 mb-4">Edit Product</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  className="input-field"
                  defaultValue={editingProduct.title}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  className="input-field"
                  defaultValue={editingProduct.description}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select className="input-field" defaultValue={editingProduct.category}>
                    <option value="Electronics">Electronics</option>
                    <option value="Watches">Watches</option>
                    <option value="Collectibles">Collectibles</option>
                    <option value="Antiques">Antiques</option>
                    <option value="Art">Art</option>
                    <option value="Fashion">Fashion</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select className="input-field" defaultValue={editingProduct.status}>
                    <option value="active">Active</option>
                    <option value="pending">Pending</option>
                    <option value="rejected">Rejected</option>
                    <option value="ended">Ended</option>
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Starting Price</label>
                  <input
                    type="number"
                    className="input-field"
                    defaultValue={editingProduct.startingPrice}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Current Bid</label>
                  <input
                    type="number"
                    className="input-field"
                    defaultValue={editingProduct.currentBid}
                    readOnly
                  />
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="featured"
                  defaultChecked={editingProduct.featured}
                  className="rounded border-gray-300"
                />
                <label htmlFor="featured" className="text-sm font-medium text-gray-700">
                  Featured Product
                </label>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  toast.success('Product updated successfully')
                  setShowEditModal(false)
                  setEditingProduct(null)
                }}
                className="btn-primary flex-1"
              >
                Update Product
              </button>
              <button
                onClick={() => {
                  setShowEditModal(false)
                  setEditingProduct(null)
                }}
                className="btn-outline flex-1"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  )
}

export default AdminProducts
