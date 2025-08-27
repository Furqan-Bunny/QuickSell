import { motion } from 'framer-motion'
import { useState } from 'react'
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

const AdminCategories = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState<any>(null)

  // Mock categories data
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

  const handleDeleteCategory = (categoryId: string) => {
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

  const getStatusBadge = (status: string) => {
    const badges: any = {
      active: { bg: 'bg-green-100', text: 'text-green-700', icon: CheckCircleIcon },
      inactive: { bg: 'bg-red-100', text: 'text-red-700', icon: XCircleIcon }
    }
    return badges[status] || badges.active
  }

  const stats = {
    totalCategories: mockCategories.length,
    activeCategories: mockCategories.filter(c => c.status === 'active').length,
    totalProducts: mockCategories.reduce((sum, cat) => sum + cat.productCount, 0),
    inactiveCategories: mockCategories.filter(c => c.status === 'inactive').length
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
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Slug</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Products</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Updated</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredCategories.map((category) => {
                const statusStyle = getStatusBadge(category.status)
                const StatusIcon = statusStyle.icon
                
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
                        <span className="text-2xl">{category.icon}</span>
                        <div>
                          <p className="font-medium text-gray-900">{category.name}</p>
                          <p className="text-sm text-gray-600 line-clamp-1">{category.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">
                        {category.slug}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm">
                        <p className="font-medium text-gray-900">{category.productCount}</p>
                        <p className="text-xs text-gray-500">total products</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleToggleStatus(category.id, category.status)}
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-colors ${statusStyle.bg} ${statusStyle.text} hover:opacity-80`}
                      >
                        <StatusIcon className="h-3 w-3" />
                        {category.status}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-600">
                        <p>{category.lastUpdated}</p>
                        <p className="text-xs text-gray-500">Created: {category.createdDate}</p>
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
                          onClick={() => handleToggleStatus(category.id, category.status)}
                          className={`p-1 text-gray-600 hover:${category.status === 'active' ? 'text-red-600' : 'text-green-600'}`}
                          title={category.status === 'active' ? 'Deactivate' : 'Activate'}
                        >
                          {category.status === 'active' ? (
                            <XCircleIcon className="h-4 w-4" />
                          ) : (
                            <CheckCircleIcon className="h-4 w-4" />
                          )}
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(category.id)}
                          className="p-1 text-gray-600 hover:text-red-600"
                          title="Delete Category"
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
                  className="input-field"
                  defaultValue={editingCategory.icon}
                  maxLength={2}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select className="input-field" defaultValue={editingCategory.status}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Products in category:</span> {editingCategory.productCount}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Created:</span> {editingCategory.createdDate}
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  toast.success('Category updated successfully')
                  setShowEditModal(false)
                  setEditingCategory(null)
                }}
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
