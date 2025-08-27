import { motion } from 'framer-motion'
import { useState } from 'react'
import {
  UserPlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  PencilIcon,
  TrashIcon,
  LockClosedIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  ArrowDownTrayIcon,
  EnvelopeIcon,
  PhoneIcon,
  CalendarIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline'
import { formatPrice } from '../../data/mockData'
import toast from 'react-hot-toast'

const AdminUsers = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [filterRole, setFilterRole] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingUser, setEditingUser] = useState<any>(null)

  // Mock users data
  const mockUsers = [
    {
      id: '1',
      username: 'john_doe',
      email: 'john@example.com',
      firstName: 'John',
      lastName: 'Doe',
      role: 'user',
      status: 'active',
      emailVerified: true,
      phone: '+27 82 123 4567',
      balance: 5000,
      totalSpent: 45000,
      totalEarned: 0,
      joinDate: '2024-01-15',
      lastActive: '2024-12-20',
      avatar: 'https://i.pravatar.cc/150?img=1'
    },
    {
      id: '2',
      username: 'sarah_seller',
      email: 'sarah@example.com',
      firstName: 'Sarah',
      lastName: 'Smith',
      role: 'seller',
      status: 'active',
      emailVerified: true,
      phone: '+27 83 234 5678',
      balance: 12000,
      totalSpent: 8000,
      totalEarned: 125000,
      joinDate: '2023-11-20',
      lastActive: '2024-12-21',
      avatar: 'https://i.pravatar.cc/150?img=2'
    },
    {
      id: '3',
      username: 'admin_user',
      email: 'admin@quicksell.com',
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
      status: 'active',
      emailVerified: true,
      phone: '+27 84 345 6789',
      balance: 0,
      totalSpent: 0,
      totalEarned: 0,
      joinDate: '2023-01-01',
      lastActive: '2024-12-21',
      avatar: 'https://i.pravatar.cc/150?img=3'
    },
    {
      id: '4',
      username: 'mike_wilson',
      email: 'mike@example.com',
      firstName: 'Mike',
      lastName: 'Wilson',
      role: 'user',
      status: 'suspended',
      emailVerified: false,
      phone: '+27 85 456 7890',
      balance: 200,
      totalSpent: 3500,
      totalEarned: 0,
      joinDate: '2024-03-10',
      lastActive: '2024-12-10',
      avatar: 'https://i.pravatar.cc/150?img=4'
    },
    {
      id: '5',
      username: 'emma_davis',
      email: 'emma@example.com',
      firstName: 'Emma',
      lastName: 'Davis',
      role: 'seller',
      status: 'active',
      emailVerified: true,
      phone: '+27 86 567 8901',
      balance: 8500,
      totalSpent: 2000,
      totalEarned: 67000,
      joinDate: '2024-02-28',
      lastActive: '2024-12-19',
      avatar: 'https://i.pravatar.cc/150?img=5'
    }
  ]

  const filteredUsers = mockUsers.filter(user => {
    const matchesSearch = 
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesRole = filterRole === 'all' || user.role === filterRole
    const matchesStatus = filterStatus === 'all' || user.status === filterStatus
    
    return matchesSearch && matchesRole && matchesStatus
  })

  const handleSelectAll = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([])
    } else {
      setSelectedUsers(filteredUsers.map(u => u.id))
    }
  }

  const handleSelectUser = (userId: string) => {
    if (selectedUsers.includes(userId)) {
      setSelectedUsers(selectedUsers.filter(id => id !== userId))
    } else {
      setSelectedUsers([...selectedUsers, userId])
    }
  }

  const handleEditUser = (user: any) => {
    setEditingUser(user)
    setShowEditModal(true)
  }

  const handleDeleteUser = (userId: string) => {
    if (confirm('Are you sure you want to delete this user?')) {
      toast.success('User deleted successfully')
    }
  }

  const handleSuspendUser = (userId: string) => {
    toast.success('User suspended successfully')
  }

  const handleActivateUser = (userId: string) => {
    toast.success('User activated successfully')
  }

  const handleBulkAction = (action: string) => {
    if (selectedUsers.length === 0) {
      toast.error('Please select users first')
      return
    }
    
    switch (action) {
      case 'delete':
        if (confirm(`Delete ${selectedUsers.length} users?`)) {
          toast.success(`${selectedUsers.length} users deleted`)
          setSelectedUsers([])
        }
        break
      case 'suspend':
        toast.success(`${selectedUsers.length} users suspended`)
        setSelectedUsers([])
        break
      case 'activate':
        toast.success(`${selectedUsers.length} users activated`)
        setSelectedUsers([])
        break
    }
  }

  const getStatusBadge = (status: string) => {
    const badges: any = {
      active: { bg: 'bg-green-100', text: 'text-green-700', icon: CheckCircleIcon },
      suspended: { bg: 'bg-red-100', text: 'text-red-700', icon: XCircleIcon },
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: ExclamationTriangleIcon }
    }
    return badges[status] || badges.pending
  }

  const getRoleBadge = (role: string) => {
    const badges: any = {
      admin: { bg: 'bg-purple-100', text: 'text-purple-700', icon: ShieldCheckIcon },
      seller: { bg: 'bg-blue-100', text: 'text-blue-700' },
      user: { bg: 'bg-gray-100', text: 'text-gray-700' }
    }
    return badges[role] || badges.user
  }

  const stats = {
    totalUsers: mockUsers.length,
    activeUsers: mockUsers.filter(u => u.status === 'active').length,
    sellers: mockUsers.filter(u => u.role === 'seller').length,
    suspendedUsers: mockUsers.filter(u => u.status === 'suspended').length
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
              <p className="text-sm text-blue-600 font-medium">Total Users</p>
              <p className="text-2xl font-bold text-blue-900">{stats.totalUsers}</p>
              <p className="text-xs text-blue-600 mt-1">All registered users</p>
            </div>
            <UserPlusIcon className="h-10 w-10 text-blue-500" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-green-50 to-green-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 font-medium">Active Users</p>
              <p className="text-2xl font-bold text-green-900">{stats.activeUsers}</p>
              <p className="text-xs text-green-600 mt-1">Currently active</p>
            </div>
            <CheckCircleIcon className="h-10 w-10 text-green-500" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-purple-50 to-purple-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-600 font-medium">Sellers</p>
              <p className="text-2xl font-bold text-purple-900">{stats.sellers}</p>
              <p className="text-xs text-purple-600 mt-1">Verified sellers</p>
            </div>
            <ShieldCheckIcon className="h-10 w-10 text-purple-500" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-red-50 to-red-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-600 font-medium">Suspended</p>
              <p className="text-2xl font-bold text-red-900">{stats.suspendedUsers}</p>
              <p className="text-xs text-red-600 mt-1">Restricted accounts</p>
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
                placeholder="Search users..."
                className="input-field pl-10"
              />
            </div>
            
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="input-field w-auto"
            >
              <option value="all">All Roles</option>
              <option value="user">Users</option>
              <option value="seller">Sellers</option>
              <option value="admin">Admins</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="input-field w-auto"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="pending">Pending</option>
            </select>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setShowAddModal(true)}
              className="btn-primary flex items-center gap-2"
            >
              <UserPlusIcon className="h-4 w-4" />
              Add User
            </button>
            <button className="btn-outline flex items-center gap-2">
              <ArrowDownTrayIcon className="h-4 w-4" />
              Export
            </button>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedUsers.length > 0 && (
          <div className="mt-4 p-3 bg-primary-50 rounded-lg flex justify-between items-center">
            <span className="text-sm text-primary-700">
              {selectedUsers.length} user(s) selected
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => handleBulkAction('activate')}
                className="text-sm text-green-600 hover:text-green-700"
              >
                Activate
              </button>
              <button
                onClick={() => handleBulkAction('suspend')}
                className="text-sm text-yellow-600 hover:text-yellow-700"
              >
                Suspend
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

      {/* Users Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Balance</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Activity</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredUsers.map((user) => {
                const statusStyle = getStatusBadge(user.status)
                const roleStyle = getRoleBadge(user.role)
                const StatusIcon = statusStyle.icon
                const RoleIcon = roleStyle.icon
                
                return (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user.id)}
                        onChange={() => handleSelectUser(user.id)}
                        className="rounded border-gray-300"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={user.avatar}
                          alt={user.username}
                          className="h-10 w-10 rounded-full"
                        />
                        <div>
                          <p className="font-medium text-gray-900">{user.username}</p>
                          <p className="text-sm text-gray-600">
                            {user.firstName} {user.lastName}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm">
                        <div className="flex items-center gap-1 text-gray-600">
                          <EnvelopeIcon className="h-4 w-4" />
                          {user.email}
                        </div>
                        <div className="flex items-center gap-1 text-gray-600 mt-1">
                          <PhoneIcon className="h-4 w-4" />
                          {user.phone}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${roleStyle.bg} ${roleStyle.text}`}>
                        {RoleIcon && <RoleIcon className="h-3 w-3" />}
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusStyle.bg} ${statusStyle.text}`}>
                        <StatusIcon className="h-3 w-3" />
                        {user.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm">
                        <p className="font-medium">{formatPrice(user.balance)}</p>
                        {user.role === 'seller' ? (
                          <p className="text-xs text-green-600">Earned: {formatPrice(user.totalEarned)}</p>
                        ) : (
                          <p className="text-xs text-gray-500">Spent: {formatPrice(user.totalSpent)}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <CalendarIcon className="h-4 w-4" />
                          Joined {user.joinDate}
                        </div>
                        <p className="text-xs mt-1">Last: {user.lastActive}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEditUser(user)}
                          className="p-1 text-gray-600 hover:text-primary-600"
                          title="Edit"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        {user.status === 'active' ? (
                          <button
                            onClick={() => handleSuspendUser(user.id)}
                            className="p-1 text-gray-600 hover:text-yellow-600"
                            title="Suspend"
                          >
                            <LockClosedIcon className="h-4 w-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleActivateUser(user.id)}
                            className="p-1 text-gray-600 hover:text-green-600"
                            title="Activate"
                          >
                            <CheckCircleIcon className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteUser(user.id)}
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

      {/* Add/Edit User Modal */}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl p-6 max-w-md w-full mx-4"
          >
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              {showEditModal ? 'Edit User' : 'Add New User'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                <input
                  type="text"
                  className="input-field"
                  defaultValue={editingUser?.username}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  className="input-field"
                  defaultValue={editingUser?.email}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                  <input
                    type="text"
                    className="input-field"
                    defaultValue={editingUser?.firstName}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                  <input
                    type="text"
                    className="input-field"
                    defaultValue={editingUser?.lastName}
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select className="input-field" defaultValue={editingUser?.role || 'user'}>
                  <option value="user">User</option>
                  <option value="seller">Seller</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select className="input-field" defaultValue={editingUser?.status || 'active'}>
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  toast.success(showEditModal ? 'User updated successfully' : 'User added successfully')
                  setShowAddModal(false)
                  setShowEditModal(false)
                  setEditingUser(null)
                }}
                className="btn-primary flex-1"
              >
                {showEditModal ? 'Update' : 'Add'} User
              </button>
              <button
                onClick={() => {
                  setShowAddModal(false)
                  setShowEditModal(false)
                  setEditingUser(null)
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

export default AdminUsers