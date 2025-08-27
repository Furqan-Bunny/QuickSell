import { motion } from 'framer-motion'
import { useState } from 'react'
import {
  BellIcon,
  PlusCircleIcon,
  MagnifyingGlassIcon,
  PaperAirplaneIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  UserGroupIcon,
  CalendarIcon,
  TrashIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

const AdminNotifications = () => {
  const [activeTab, setActiveTab] = useState('send')
  const [selectedUsers, setSelectedUsers] = useState('all')
  const [notificationTitle, setNotificationTitle] = useState('')
  const [notificationMessage, setNotificationMessage] = useState('')
  const [notificationType, setNotificationType] = useState('info')

  // Mock notification history
  const notifications = [
    {
      id: '1',
      title: 'System Maintenance',
      message: 'Platform will be under maintenance from 2 AM to 4 AM',
      type: 'warning',
      audience: 'All Users',
      sentDate: '2024-12-20 14:30',
      readRate: '78%',
      status: 'sent'
    },
    {
      id: '2',
      title: 'New Feature: Quick Buy',
      message: 'Introducing Quick Buy feature for instant purchases',
      type: 'info',
      audience: 'Active Users',
      sentDate: '2024-12-19 10:00',
      readRate: '65%',
      status: 'sent'
    },
    {
      id: '3',
      title: 'Holiday Sale Starting Soon',
      message: 'Get ready for amazing deals this festive season',
      type: 'success',
      audience: 'All Users',
      sentDate: '2024-12-18 16:45',
      readRate: '82%',
      status: 'sent'
    },
    {
      id: '4',
      title: 'Security Update Required',
      message: 'Please update your password for enhanced security',
      type: 'error',
      audience: 'Selected Users',
      sentDate: '',
      readRate: '0%',
      status: 'scheduled'
    },
    {
      id: '5',
      title: 'Seller Promotion',
      message: 'Reduced fees for new sellers this month',
      type: 'info',
      audience: 'Sellers',
      sentDate: '',
      readRate: '0%',
      status: 'draft'
    }
  ]

  const templates = [
    { id: '1', name: 'Maintenance Notice', type: 'warning' },
    { id: '2', name: 'New Feature', type: 'info' },
    { id: '3', name: 'Promotion', type: 'success' },
    { id: '4', name: 'Security Alert', type: 'error' }
  ]

  const handleSendNotification = () => {
    if (!notificationTitle || !notificationMessage) {
      toast.error('Please fill in all required fields')
      return
    }
    toast.success('Notification sent successfully')
    setNotificationTitle('')
    setNotificationMessage('')
  }

  const getTypeBadge = (type: string) => {
    const badges: any = {
      info: 'bg-blue-100 text-blue-700',
      warning: 'bg-yellow-100 text-yellow-700',
      success: 'bg-green-100 text-green-700',
      error: 'bg-red-100 text-red-700'
    }
    return badges[type] || badges.info
  }

  const getStatusBadge = (status: string) => {
    const badges: any = {
      sent: 'bg-green-100 text-green-700',
      scheduled: 'bg-blue-100 text-blue-700',
      draft: 'bg-gray-100 text-gray-700'
    }
    return badges[status] || badges.draft
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card bg-gradient-to-br from-blue-50 to-blue-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 font-medium">Total Sent</p>
              <p className="text-2xl font-bold text-blue-900">
                {notifications.filter(n => n.status === 'sent').length}
              </p>
            </div>
            <PaperAirplaneIcon className="h-10 w-10 text-blue-500" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-green-50 to-green-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 font-medium">Avg Read Rate</p>
              <p className="text-2xl font-bold text-green-900">75%</p>
            </div>
            <CheckCircleIcon className="h-10 w-10 text-green-500" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-yellow-50 to-yellow-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-yellow-600 font-medium">Scheduled</p>
              <p className="text-2xl font-bold text-yellow-900">
                {notifications.filter(n => n.status === 'scheduled').length}
              </p>
            </div>
            <ClockIcon className="h-10 w-10 text-yellow-500" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-purple-50 to-purple-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-600 font-medium">Active Users</p>
              <p className="text-2xl font-bold text-purple-900">1,234</p>
            </div>
            <UserGroupIcon className="h-10 w-10 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('send')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'send'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Send Notification
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'history'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            History
          </button>
          <button
            onClick={() => setActiveTab('templates')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'templates'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Templates
          </button>
        </nav>
      </div>

      {/* Content */}
      {activeTab === 'send' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Compose Notification</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={notificationTitle}
                  onChange={(e) => setNotificationTitle(e.target.value)}
                  className="input-field"
                  placeholder="Enter notification title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                <textarea
                  value={notificationMessage}
                  onChange={(e) => setNotificationMessage(e.target.value)}
                  className="input-field h-32 resize-none"
                  placeholder="Enter notification message"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  value={notificationType}
                  onChange={(e) => setNotificationType(e.target.value)}
                  className="input-field"
                >
                  <option value="info">Information</option>
                  <option value="warning">Warning</option>
                  <option value="success">Success</option>
                  <option value="error">Error</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Audience</label>
                <select
                  value={selectedUsers}
                  onChange={(e) => setSelectedUsers(e.target.value)}
                  className="input-field"
                >
                  <option value="all">All Users</option>
                  <option value="active">Active Users</option>
                  <option value="sellers">Sellers Only</option>
                  <option value="buyers">Buyers Only</option>
                  <option value="premium">Premium Users</option>
                </select>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleSendNotification}
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                >
                  <PaperAirplaneIcon className="h-4 w-4" />
                  Send Now
                </button>
                <button className="btn-outline flex-1 flex items-center justify-center gap-2">
                  <ClockIcon className="h-4 w-4" />
                  Schedule
                </button>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Preview</h3>
            
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${getTypeBadge(notificationType).split(' ')[0]}`}>
                  <BellIcon className={`h-5 w-5 ${getTypeBadge(notificationType).split(' ')[1]}`} />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">
                    {notificationTitle || 'Notification Title'}
                  </h4>
                  <p className="text-sm text-gray-600 mt-1">
                    {notificationMessage || 'Your notification message will appear here...'}
                  </p>
                  <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                    <span>To: {selectedUsers === 'all' ? 'All Users' : selectedUsers}</span>
                    <span>Type: {notificationType}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Estimated Reach</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Recipients</span>
                  <span className="font-medium">1,234</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Expected Open Rate</span>
                  <span className="font-medium">75-80%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Delivery Time</span>
                  <span className="font-medium">Immediate</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Audience</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sent Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Read Rate</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {notifications.map((notification) => (
                  <tr key={notification.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-gray-900">{notification.title}</p>
                        <p className="text-sm text-gray-600">{notification.message}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge ${getTypeBadge(notification.type)}`}>
                        {notification.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">{notification.audience}</td>
                    <td className="px-4 py-3">
                      <span className={`badge ${getStatusBadge(notification.status)}`}>
                        {notification.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{notification.sentDate || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{notification.readRate}</td>
                    <td className="px-4 py-3">
                      <button className="text-primary-600 hover:text-primary-700 text-sm">
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'templates' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {templates.map((template) => (
            <div key={template.id} className="card hover:shadow-lg transition-shadow cursor-pointer">
              <div className={`p-3 rounded-lg inline-block ${getTypeBadge(template.type).split(' ')[0]}`}>
                <BellIcon className={`h-6 w-6 ${getTypeBadge(template.type).split(' ')[1]}`} />
              </div>
              <h3 className="font-semibold text-gray-900 mt-3">{template.name}</h3>
              <p className="text-sm text-gray-600 mt-1">Click to use this template</p>
              <span className={`badge ${getTypeBadge(template.type)} mt-3`}>
                {template.type}
              </span>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  )
}

export default AdminNotifications