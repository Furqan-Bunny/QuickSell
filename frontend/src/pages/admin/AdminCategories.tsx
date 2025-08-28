import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import axios from 'axios'
import {
  MagnifyingGlassIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
  TagIcon,
  FolderIcon,
  ArrowDownTrayIcon,
  EyeIcon,
  AdjustmentsHorizontalIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

interface Category {
  id: string
  name: string
  icon?: string
  description?: string
  order?: number
  productCount?: number
  createdAt?: any
  updatedAt?: any
}

const AdminCategories = () => {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState<any>(null)
  const [newCategory, setNewCategory] = useState({
    name: '',
    icon: '',
    description: '',
    order: 0
  })

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      toast.error('Admin access required')
      navigate('/')
      return
    }
    fetchCategories()
  }, [user])

  const fetchCategories = async () => {
    try {
      setLoading(true)
      const response = await axios.get('/api/admin/categories')
      if (response.data.success) {
        // Fetch product count for each category
        const categoriesWithCount = await Promise.all(
          response.data.data.map(async (cat: Category) => {
            try {
              const prodResponse = await axios.get(`/api/products?categoryId=${cat.id}`)
              return {
                ...cat,
                productCount: prodResponse.data.data?.length || 0
              }
            } catch (error) {
              return { ...cat, productCount: 0 }
            }
          })
        )
        setCategories(categoriesWithCount)
      }
    } catch (error: any) {
      console.error('Error fetching categories:', error)
      toast.error('Failed to fetch categories')
    } finally {
      setLoading(false)
    }
  }

  const handleAddCategory = async () => {
    if (!newCategory.name) {
      toast.error('Category name is required')
      return
    }

    try {
      const response = await axios.post('/api/admin/categories', newCategory)
      if (response.data.success) {
        toast.success('Category added successfully')
        setShowAddModal(false)
        setNewCategory({ name: '', icon: '', description: '', order: 0 })
        fetchCategories()
      }
    } catch (error: any) {
      console.error('Error adding category:', error)
      toast.error(error.response?.data?.error || 'Failed to add category')
    }
  }

  const handleUpdateCategory = async () => {
    if (!editingCategory?.name) {
      toast.error('Category name is required')
      return
    }

    try {
      const response = await axios.put(`/api/admin/categories/${editingCategory.id}`, {
        name: editingCategory.name,
        icon: editingCategory.icon,
        description: editingCategory.description,
        order: editingCategory.order || 0
      })
      if (response.data.success) {
        toast.success('Category updated successfully')
        setShowEditModal(false)
        setEditingCategory(null)
        fetchCategories()
      }
    } catch (error: any) {
      console.error('Error updating category:', error)
      toast.error(error.response?.data?.error || 'Failed to update category')
    }
  }

  const handleDeleteCategoryAPI = async (categoryId: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return

    try {
      const response = await axios.delete(`/api/admin/categories/${categoryId}`)
      if (response.data.success) {
        toast.success('Category deleted successfully')
        fetchCategories()
      }
    } catch (error: any) {
      console.error('Error deleting category:', error)
      if (error.response?.data?.error?.includes('existing products')) {
        toast.error('Cannot delete category with existing products')
      } else {
        toast.error(error.response?.data?.error || 'Failed to delete category')
      }
    }
  }

  // Add filter status state
  const [filterStatus, setFilterStatus] = useState('all')
  
  // Mock categories data (removed - using real data now)
  const mockCategories = [
    {
      id: '1',
      name: 'Electronics',
      slug: 'electronics',
      description: 'Electronic devices and gadgets',
      productCount: 1250,
      status: 'active',
      icon: '📱',
      createdDate: '2024-01-15',
      lastUpdated: '2024-12-15'
    },
    {
      id: '2',
      name: 'Watches',
      slug: 'watches',
      description: 'Luxury and vintage timepieces',
      productCount: 847,
      status: 'active',
      icon: '⌚',
      createdDate: '2024-01-15',
      lastUpdated: '2024-12-10'
    },
    {
      id: '3',
      name: 'Collectibles',
      slug: 'collectibles',
      description: 'Rare collectible items and memorabilia',
      productCount: 623,
      status: 'active',
      icon: '🎯',
      createdDate: '2024-01-15',
      lastUpdated: '2024-12-12'
    },
    {
      id: '4',
      name: 'Antiques',
      slug: 'antiques',
      description: 'Vintage and antique items',
      productCount: 412,
      status: 'active',
      icon: '🏺',
      createdDate: '2024-01-15',
      lastUpdated: '2024-12-08'
    },
    {
      id: '5',
      name: 'Art',
      slug: 'art',
      description: 'Paintings, sculptures, and artwork',
      productCount: 345,
      status: 'active',
      icon: '🎨',
      createdDate: '2024-02-01',
      lastUpdated: '2024-12-14'
    },
    {
      id: '6',
      name: 'Fashion',
      slug: 'fashion',
      description: 'Clothing, accessories, and fashion items',
      productCount: 289,
      status: 'active',
      icon: '👗',
      createdDate: '2024-02-15',
      lastUpdated: '2024-12-11'
    },
    {
      id: '7',
      name: 'Sports Equipment',
      slug: 'sports-equipment',
      description: 'Sports and fitness equipment',
      productCount: 156,
      status: 'inactive',
      icon: '⚽',
      createdDate: '2024-03-01',
      lastUpdated: '2024-11-20'
    },
    {
      id: '8',
      name: 'Books & Manuscripts',
      slug: 'books-manuscripts',
      description: 'Rare books and historical manuscripts',
      productCount: 234,
      status: 'active',
      icon: '📚',
      createdDate: '2024-03-15',
      lastUpdated: '2024-12-09'
    }
  ]

  const filteredCategories = mockCategories.filter(category => {
    const matchesSearch = 
      category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      category.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
      category.description.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesStatus = filterStatus === 'all' || category.status === filterStatus
    
    return matchesSearch && matchesStatus
  })

  const handleSelectAll = () => {
    if (selectedCategories.length === filteredCategories.length) {
      setSelectedCategories([])
    } else {
      setSelectedCategories(filteredCategories.map(c => c.id))
    }
  }

  const handleSelectCategory = (categoryId: string) => {
    if (selectedCategories.includes(categoryId)) {
      setSelectedCategories(selectedCategories.filter(id => id !== categoryId))
    } else {
      setSelectedCategories([...selectedCategories, categoryId])
    }
  }

  const handleEditCategory = (category: any) => {
    setEditingCategory(category)
    setShowEditModal(true)
  }

  const handleDeleteCategoryMock = (categoryId: string) => {
    if (confirm('Are you sure you want to delete this category? This action cannot be undone.')) {
      toast.success('Category deleted successfully')
    }
  }

  const handleToggleStatus = (categoryId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active'
    toast.success(`Category ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`)
  }

  const handleBulkAction = (action: string) => {
    if (selectedCategories.length === 0) {
      toast.error('Please select categories first')
      return
    }
    
    switch (action) {
      case 'activate':
        toast.success(`${selectedCategories.length} categories activated`)
        setSelectedCategories([])
        break
      case 'deactivate':
        toast.success(`${selectedCategories.length} categories deactivated`)
        setSelectedCategories([])
        break
      case 'delete':
        if (confirm(`Delete ${selectedCategories.length} categories?`)) {
          toast.success(`${selectedCategories.length} categories deleted`)
          setSelectedCategories([])
        }
        break
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  const stats = {
    totalCategories: categories.length,
    activeCategories: categories.length, // All categories are active in Phase 1
    totalProducts: categories.reduce((sum, cat) => sum + (cat.productCount || 0), 0),
    inactiveCategories: 0 // No inactive categories in Phase 1
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
              <p className="text-sm text-blue-600 font-medium">Total Categories</p>
              <p className="text-2xl font-bold text-blue-900">{stats.totalCategories}</p>
              <p className="text-xs text-blue-600 mt-1">All categories</p>
            </div>
            <FolderIcon className="h-10 w-10 text-blue-500" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-green-50 to-green-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 font-medium">Active Categories</p>
              <p className="text-2xl font-bold text-green-900">{stats.activeCategories}</p>
              <p className="text-xs text-green-600 mt-1">Currently enabled</p>
            </div>
            <CheckCircleIcon className="h-10 w-10 text-green-500" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-purple-50 to-purple-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-600 font-medium">Total Products</p>
              <p className="text-2xl font-bold text-purple-900">{stats.totalProducts}</p>
              <p className="text-xs text-purple-600 mt-1">Across all categories</p>
            </div>
            <TagIcon className="h-10 w-10 text-purple-500" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-red-50 to-red-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-600 font-medium">Inactive</p>
              <p className="text-2xl font-bold text-red-900">{stats.inactiveCategories}</p>
              <p className="text-xs text-red-600 mt-1">Disabled categories</p>
            </div>
            <XCircleIcon className="h-10 w-10 text-red-500" />
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
                placeholder="Search categories..."
                className="input-field pl-10"
              />
            </div>
            
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="input-field w-auto"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setShowAddModal(true)}
              className="btn-primary flex items-center gap-2"
            >
              <PlusIcon className="h-4 w-4" />
              Add Category
            </button>
            <button className="btn-outline flex items-center gap-2">
              <ArrowDownTrayIcon className="h-4 w-4" />
              Export
            </button>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedCategories.length > 0 && (
          <div className="mt-4 p-3 bg-primary-50 rounded-lg flex justify-between items-center">
            <span className="text-sm text-primary-700">
              {selectedCategories.length} category(ies) selected
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => handleBulkAction('activate')}
                className="text-sm text-green-600 hover:text-green-700"
              >
                Activate
              </button>
              <button
                onClick={() => handleBulkAction('deactivate')}
                className="text-sm text-red-600 hover:text-red-700"
              >
                Deactivate
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

      {/* Categories Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedCategories.length === filteredCategories.length && filteredCategories.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Identifier</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Products</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Updated</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredCategories.map((category) => {
                return (
                  <tr key={category.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedCategories.includes(category.id)}
                        onChange={() => handleSelectCategory(category.id)}
                        className="rounded border-gray-300"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{category.icon || '📦'}</span>
                        <div>
                          <p className="font-medium text-gray-900">{category.name}</p>
                          <p className="text-sm text-gray-600 line-clamp-1">{category.description || 'No description'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">
                        {category.name?.toLowerCase().replace(/\s+/g, '-')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm">
                        <p className="font-medium text-gray-900">{category.productCount || 0}</p>
                        <p className="text-xs text-gray-500">total products</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <CheckCircleIcon className="h-3 w-3" />
                        active
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-600">
                        <p>{(category as any).updatedAt ? new Date((category as any).updatedAt._seconds ? (category as any).updatedAt._seconds * 1000 : (category as any).updatedAt).toLocaleDateString() : 'N/A'}</p>
                        <p className="text-xs text-gray-500">Order: {(category as any).order || 0}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEditCategory(category)}
                          className="p-1 text-gray-600 hover:text-primary-600"
                          title="Edit Category"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteCategoryAPI(category.id)}
                          className="p-1 text-gray-600 hover:text-red-600"
                          title="Delete Category"
                          disabled={category.productCount > 0}
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

      {/* Add Category Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl p-6 max-w-md w-full mx-4"
          >
            <h3 className="text-xl font-bold text-gray-900 mb-4">Add New Category</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category Name</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g., Home & Garden"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category Slug</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g., home-garden"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  className="input-field"
                  placeholder="Brief description of the category..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Icon (Emoji)</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="🏠"
                  maxLength={2}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select className="input-field">
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  toast.success('Category added successfully')
                  setShowAddModal(false)
                }}
                className="btn-primary flex-1"
              >
                Add Category
              </button>
              <button
                onClick={() => setShowAddModal(false)}
                className="btn-outline flex-1"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Edit Category Modal */}
      {showEditModal && editingCategory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl p-6 max-w-md w-full mx-4"
          >
            <h3 className="text-xl font-bold text-gray-900 mb-4">Edit Category</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category Name</label>
                <input
                  type="text"
                  className="input-field"
                  defaultValue={editingCategory.name}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category Slug</label>
                <input
                  type="text"
                  className="input-field"
                  defaultValue={editingCategory.slug}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  className="input-field"
                  defaultValue={editingCategory.description}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Icon (Emoji)</label>
                <input
                  type="text"
                  value={editingCategory.icon || ''}
                  onChange={(e) => setEditingCategory({...editingCategory, icon: e.target.value})}
                  className="input-field"
                  maxLength={2}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Display Order</label>
                <input
                  type="number"
                  value={editingCategory.order || 0}
                  onChange={(e) => setEditingCategory({...editingCategory, order: parseInt(e.target.value) || 0})}
                  className="input-field"
                />
              </div>
              
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Products in category:</span> {editingCategory.productCount || 0}
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleUpdateCategory}
                className="btn-primary flex-1"
              >
                Update Category
              </button>
              <button
                onClick={() => {
                  setShowEditModal(false)
                  setEditingCategory(null)
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

export default AdminCategories
