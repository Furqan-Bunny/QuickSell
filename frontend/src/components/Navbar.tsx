import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useAuthStore } from '../store/authStore'
import { Menu, Transition } from '@headlessui/react'
import { Fragment } from 'react'
import {
  HomeIcon,
  ShoppingBagIcon,
  UserIcon,
  HeartIcon,
  BellIcon,
  PlusCircleIcon,
  ChevronDownIcon,
  ArrowRightOnRectangleIcon,
  Cog6ToothIcon,
  ShoppingCartIcon,
  MagnifyingGlassIcon,
  Bars3Icon,
  XMarkIcon
} from '@heroicons/react/24/outline'

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuthStore()
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery)}`)
    }
  }

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <ShoppingBagIcon className="h-8 w-8 text-primary-600" />
            <span className="text-2xl font-bold text-gradient">Quicksell</span>
          </Link>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-lg mx-8">
            <div className="relative w-full">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for products..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <button
                type="submit"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 btn-primary py-1 px-3 text-sm"
              >
                Search
              </button>
            </div>
          </form>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            <Link to="/products" className="text-gray-700 hover:text-primary-600 transition-colors">
              Browse
            </Link>

            {isAuthenticated ? (
              <>
                {/* Only show Create Auction for admin */}
                {user?.role === 'admin' && (
                  <Link to="/create-auction" className="text-gray-700 hover:text-primary-600 transition-colors" title="Create Auction">
                    <PlusCircleIcon className="h-6 w-6" />
                  </Link>
                )}
                <Link to="/wishlist" className="text-gray-700 hover:text-primary-600 transition-colors" title="Wishlist">
                  <HeartIcon className="h-6 w-6" />
                </Link>
                <Link to="/notifications" className="text-gray-700 hover:text-primary-600 transition-colors relative">
                  <BellIcon className="h-6 w-6" />
                  <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full text-white text-xs flex items-center justify-center">
                    3
                  </span>
                </Link>

                {/* User Menu */}
                <Menu as="div" className="relative">
                  <Menu.Button className="flex items-center space-x-2 text-gray-700 hover:text-primary-600">
                    <div className="h-8 w-8 bg-primary-100 rounded-full flex items-center justify-center">
                      {user?.avatar ? (
                        <img src={user.avatar} alt={user.username} className="h-8 w-8 rounded-full" />
                      ) : (
                        <UserIcon className="h-5 w-5 text-primary-600" />
                      )}
                    </div>
                    <span className="font-medium">{user?.username}</span>
                    <ChevronDownIcon className="h-4 w-4" />
                  </Menu.Button>

                  <Transition
                    as={Fragment}
                    enter="transition ease-out duration-100"
                    enterFrom="transform opacity-0 scale-95"
                    enterTo="transform opacity-100 scale-100"
                    leave="transition ease-in duration-75"
                    leaveFrom="transform opacity-100 scale-100"
                    leaveTo="transform opacity-0 scale-95"
                  >
                    <Menu.Items className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2">
                      <Menu.Item>
                        {({ active }) => (
                          <Link
                            to="/dashboard"
                            className={`${
                              active ? 'bg-gray-100' : ''
                            } block px-4 py-2 text-sm text-gray-700`}
                          >
                            Dashboard
                          </Link>
                        )}
                      </Menu.Item>
                      <Menu.Item>
                        {({ active }) => (
                          <Link
                            to="/profile"
                            className={`${
                              active ? 'bg-gray-100' : ''
                            } block px-4 py-2 text-sm text-gray-700`}
                          >
                            Profile
                          </Link>
                        )}
                      </Menu.Item>
                      <Menu.Item>
                        {({ active }) => (
                          <Link
                            to="/my-auctions"
                            className={`${
                              active ? 'bg-gray-100' : ''
                            } block px-4 py-2 text-sm text-gray-700`}
                          >
                            My Auctions
                          </Link>
                        )}
                      </Menu.Item>
                      <Menu.Item>
                        {({ active }) => (
                          <Link
                            to="/my-bids"
                            className={`${
                              active ? 'bg-gray-100' : ''
                            } block px-4 py-2 text-sm text-gray-700`}
                          >
                            My Bids
                          </Link>
                        )}
                      </Menu.Item>
                      <Menu.Item>
                        {({ active }) => (
                          <Link
                            to="/orders"
                            className={`${
                              active ? 'bg-gray-100' : ''
                            } block px-4 py-2 text-sm text-gray-700`}
                          >
                            Orders
                          </Link>
                        )}
                      </Menu.Item>
                      <Menu.Item>
                        {({ active }) => (
                          <Link
                            to="/affiliate"
                            className={`${
                              active ? 'bg-gray-100' : ''
                            } block px-4 py-2 text-sm text-gray-700`}
                          >
                            Invite & Earn
                          </Link>
                        )}
                      </Menu.Item>
                      {user?.role === 'admin' && (
                        <>
                          <div className="border-t border-gray-200 my-2"></div>
                          <Menu.Item>
                            {({ active }) => (
                              <Link
                                to="/admin/dashboard"
                                className={`${
                                  active ? 'bg-gray-100' : ''
                                } block px-4 py-2 text-sm text-gray-700`}
                              >
                                Admin Panel
                              </Link>
                            )}
                          </Menu.Item>
                        </>
                      )}
                      <div className="border-t border-gray-200 my-2"></div>
                      <Menu.Item>
                        {({ active }) => (
                          <button
                            onClick={handleLogout}
                            className={`${
                              active ? 'bg-gray-100' : ''
                            } block w-full text-left px-4 py-2 text-sm text-gray-700`}
                          >
                            Logout
                          </button>
                        )}
                      </Menu.Item>
                    </Menu.Items>
                  </Transition>
                </Menu>

                {/* Balance */}
                <div className="bg-primary-50 px-3 py-1 rounded-lg">
                  <span className="text-sm font-medium text-primary-700">
                    ${user?.balance?.toFixed(2) || '0.00'}
                  </span>
                </div>
              </>
            ) : (
              <>
                <Link to="/login" className="text-gray-700 hover:text-primary-600 transition-colors">
                  Login
                </Link>
                <Link to="/register" className="btn-primary">
                  Register
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden"
          >
            {mobileMenuOpen ? (
              <XMarkIcon className="h-6 w-6 text-gray-700" />
            ) : (
              <Bars3Icon className="h-6 w-6 text-gray-700" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            <form onSubmit={handleSearch} className="mb-4">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for products..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              </div>
            </form>

            <div className="space-y-2">
              <Link to="/products" className="block py-2 text-gray-700">
                Browse Products
              </Link>
              {isAuthenticated ? (
                <>
                  <Link to="/dashboard" className="block py-2 text-gray-700">
                    Dashboard
                  </Link>
                  <Link to="/create-auction" className="block py-2 text-gray-700">
                    Create Auction
                  </Link>
                  <Link to="/my-auctions" className="block py-2 text-gray-700">
                    My Auctions
                  </Link>
                  <Link to="/my-bids" className="block py-2 text-gray-700">
                    My Bids
                  </Link>
                  <Link to="/wishlist" className="block py-2 text-gray-700">
                    Wishlist
                  </Link>
                  <Link to="/notifications" className="block py-2 text-gray-700">
                    Notifications
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left py-2 text-gray-700"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="block py-2 text-gray-700">
                    Login
                  </Link>
                  <Link to="/register" className="block py-2 text-gray-700">
                    Register
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}

export default Navbar