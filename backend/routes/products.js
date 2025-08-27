const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Product = require('../models/Product');
const Bid = require('../models/Bid');
const Category = require('../models/Category');
const { authMiddleware, optionalAuth, sellerMiddleware } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/products/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'product-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Get all products with filters
router.get('/', optionalAuth, async (req, res) => {
  try {
    const {
      category,
      subcategory,
      status = 'active',
      minPrice,
      maxPrice,
      condition,
      seller,
      search,
      sortBy = 'createdAt',
      order = 'desc',
      page = 1,
      limit = 12
    } = req.query;

    // Use mock data for development - filter products based on query parameters
    let filteredProducts = [...mockProducts];
    
    // Filter by status
    if (status) {
      filteredProducts = filteredProducts.filter(p => p.status === status);
    }
    
    // Filter by category
    if (category) {
      filteredProducts = filteredProducts.filter(p => 
        p.category.name.toLowerCase() === category.toLowerCase()
      );
    }
    
    // Filter by condition
    if (condition) {
      filteredProducts = filteredProducts.filter(p => p.condition === condition);
    }
    
    // Filter by seller
    if (seller) {
      filteredProducts = filteredProducts.filter(p => 
        p.seller.username === seller
      );
    }
    
    // Filter by price range
    if (minPrice || maxPrice) {
      filteredProducts = filteredProducts.filter(p => {
        if (minPrice && p.currentPrice < parseFloat(minPrice)) return false;
        if (maxPrice && p.currentPrice > parseFloat(maxPrice)) return false;
        return true;
      });
    }
    
    // Search filter
    if (search) {
      const searchTerm = search.toLowerCase();
      filteredProducts = filteredProducts.filter(p => 
        p.title.toLowerCase().includes(searchTerm) ||
        p.description.toLowerCase().includes(searchTerm) ||
        p.category.name.toLowerCase().includes(searchTerm)
      );
    }

    // Sort products
    filteredProducts.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'currentBid':
        case 'currentPrice':
          aValue = a.currentPrice;
          bValue = b.currentPrice;
          break;
        case 'views':
          aValue = a.views;
          bValue = b.views;
          break;
        case 'endDate':
          aValue = new Date(a.endDate);
          bValue = new Date(b.endDate);
          break;
        default: // createdAt or other
          aValue = new Date(a.endDate); // Use endDate as proxy for createdAt
          bValue = new Date(b.endDate);
      }
      
      if (order === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;
    const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

    res.json({
      products: paginatedProducts,
      currentPage: pageNum,
      totalPages: Math.ceil(filteredProducts.length / limitNum),
      totalProducts: filteredProducts.length
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Mock products data for development
const mockProducts = [
  {
    _id: '1',
    title: 'Vintage Rolex Submariner',
    description: 'A classic diving watch in excellent condition. This 1980s Rolex Submariner has been well-maintained and comes with original papers.',
    seller: {
      username: 'watchcollector123',
      firstName: 'John',
      lastName: 'Smith',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
      ratings: { average: 4.8, count: 45 },
      phone: '+27123456789'
    },
    category: { name: 'Watches', slug: 'watches' },
    currentPrice: 85000,
    currentBid: 85000,
    startingPrice: 50000,
    reservePrice: 80000,
    incrementAmount: 1000,
    totalBids: 23,
    uniqueBidders: 18,
    condition: 'excellent',
    status: 'active',
    endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // Ends in 3 days
    images: [
      'https://images.unsplash.com/photo-1523170335258-f5c6c6bd6edb?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1594534475808-b18fc33b045e?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1548181207-e1e6c0c4478b?w=800&h=600&fit=crop'
    ],
    views: 1456,
    watchers: 23,
    specifications: {
      brand: 'Rolex',
      model: 'Submariner',
      year: '1985',
      material: 'Stainless Steel',
      movement: 'Automatic',
      waterResistance: '300m'
    },
    shipping: {
      cost: 250,
      methods: ['Standard Delivery', 'Express Delivery'],
      location: 'Cape Town, Western Cape'
    },
    questions: [
      {
        user: { username: 'buyer123', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=50&h=50&fit=crop&crop=face' },
        question: 'Does this come with the original box?',
        answer: 'Yes, it comes with the original Rolex box and papers.',
        date: new Date('2024-12-20')
      }
    ],
    reviews: []
  },
  {
    _id: '2',
    title: 'iPhone 15 Pro Max - Unopened',
    description: 'Brand new iPhone 15 Pro Max 256GB in Natural Titanium. Factory sealed and unopened.',
    seller: {
      username: 'techdealer',
      firstName: 'Sarah',
      lastName: 'Johnson',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b830?w=100&h=100&fit=crop&crop=face',
      ratings: { average: 4.9, count: 128 },
      phone: '+27987654321'
    },
    category: { name: 'Electronics', slug: 'electronics' },
    currentPrice: 12000,
    currentBid: 12000,
    startingPrice: 10000,
    reservePrice: 15000,
    incrementAmount: 500,
    totalBids: 45,
    uniqueBidders: 32,
    condition: 'new',
    status: 'active',
    endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // Ends in 5 days
    images: [
      'https://images.unsplash.com/photo-1592286634469-9b7429b91b65?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&h=600&fit=crop'
    ],
    views: 2341,
    watchers: 45,
    specifications: {
      brand: 'Apple',
      model: 'iPhone 15 Pro Max',
      storage: '256GB',
      color: 'Natural Titanium',
      condition: 'Brand New',
      warranty: '1 Year Apple Warranty'
    },
    shipping: {
      cost: 100,
      methods: ['Standard Delivery', 'Express Delivery', 'Collection'],
      location: 'Johannesburg, Gauteng'
    },
    questions: [],
    reviews: []
  },
  {
    _id: '3',
    title: 'Rare Pokemon Card Collection',
    description: 'Complete set of 1st edition Base Set cards including Charizard. All cards are in near mint condition.',
    seller: {
      username: 'pokemonmaster',
      firstName: 'Mike',
      lastName: 'Wilson',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face',
      ratings: { average: 4.7, count: 67 },
      phone: '+27456789123'
    },
    category: { name: 'Collectibles', slug: 'collectibles' },
    currentPrice: 25000,
    currentBid: 25000,
    startingPrice: 15000,
    reservePrice: 30000,
    incrementAmount: 1000,
    totalBids: 67,
    uniqueBidders: 45,
    condition: 'near mint',
    status: 'active',
    endDate: new Date(Date.now() + 12 * 60 * 60 * 1000), // Ends in 12 hours
    images: [
      'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1611604548018-d56a0d67e1e4?w=800&h=600&fit=crop'
    ],
    views: 892,
    watchers: 67,
    specifications: {
      set: 'Base Set 1st Edition',
      year: '1998',
      cards: '102 Cards Complete',
      condition: 'Near Mint',
      language: 'English',
      rarity: 'Complete Set'
    },
    shipping: {
      cost: 150,
      methods: ['Registered Mail', 'Express Delivery'],
      location: 'Durban, KwaZulu-Natal'
    },
    questions: [],
    reviews: []
  },
  {
    _id: '4',
    title: 'Antique Victorian Jewelry Box',
    description: 'Beautiful hand-carved jewelry box from the Victorian era. Features intricate woodwork and original brass hardware.',
    seller: {
      username: 'antiquedealer',
      firstName: 'Emma',
      lastName: 'Davis',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face',
      ratings: { average: 4.6, count: 34 },
      phone: '+27321654987'
    },
    category: { name: 'Antiques', slug: 'antiques' },
    currentPrice: 3500,
    currentBid: 3500,
    startingPrice: 2000,
    reservePrice: 4000,
    incrementAmount: 250,
    totalBids: 12,
    uniqueBidders: 8,
    condition: 'good',
    status: 'active',
    endDate: new Date(Date.now() + 2 * 60 * 60 * 1000), // Ends in 2 hours
    images: [
      'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&h=600&fit=crop'
    ],
    views: 456,
    watchers: 12,
    specifications: {
      era: 'Victorian',
      material: 'Carved Wood',
      age: 'Circa 1890',
      dimensions: '25cm x 15cm x 10cm',
      condition: 'Good',
      origin: 'England'
    },
    shipping: {
      cost: 200,
      methods: ['Standard Delivery', 'Collection'],
      location: 'Port Elizabeth, Eastern Cape'
    },
    questions: [],
    reviews: []
  },
  {
    _id: '5',
    title: 'Gaming PC - RTX 4090 Setup',
    description: 'High-end gaming PC with latest components. RTX 4090, Intel i9-13900K, 32GB DDR5 RAM.',
    seller: {
      username: 'pcbuilder',
      firstName: 'Alex',
      lastName: 'Chen',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
      ratings: { average: 4.9, count: 89 },
      phone: '+27789456123'
    },
    category: { name: 'Electronics', slug: 'electronics' },
    currentPrice: 35000,
    currentBid: 35000,
    startingPrice: 25000,
    reservePrice: 40000,
    incrementAmount: 1000,
    totalBids: 89,
    uniqueBidders: 67,
    condition: 'excellent',
    status: 'active',
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Ends in 7 days
    images: [
      'https://images.unsplash.com/photo-1587831990711-23ca6441447b?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1551703599146-cd1cf01f8dff?w=800&h=600&fit=crop'
    ],
    views: 1234,
    watchers: 89,
    specifications: {
      cpu: 'Intel i9-13900K',
      gpu: 'RTX 4090',
      ram: '32GB DDR5',
      storage: '2TB NVMe SSD',
      motherboard: 'ASUS ROG Strix Z790',
      psu: '1000W 80+ Gold'
    },
    shipping: {
      cost: 300,
      methods: ['Express Delivery', 'Collection'],
      location: 'Pretoria, Gauteng'
    },
    questions: [],
    reviews: []
  },
  {
    _id: '6',
    title: 'Louis Vuitton Handbag',
    description: 'Authentic Louis Vuitton Neverfull MM in Damier Ebene canvas. Excellent condition with dust bag.',
    seller: {
      username: 'luxurybags',
      firstName: 'Sophie',
      lastName: 'Williams',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b830?w=100&h=100&fit=crop&crop=face',
      ratings: { average: 4.8, count: 56 },
      phone: '+27654321987'
    },
    category: { name: 'Fashion', slug: 'fashion' },
    currentPrice: 8500,
    currentBid: 8500,
    startingPrice: 6000,
    reservePrice: 10000,
    incrementAmount: 250,
    totalBids: 34,
    uniqueBidders: 24,
    condition: 'excellent',
    status: 'active',
    endDate: new Date(Date.now() + 18 * 60 * 60 * 1000), // Ends in 18 hours
    images: [
      'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&h=600&fit=crop'
    ],
    views: 678,
    watchers: 34,
    specifications: {
      brand: 'Louis Vuitton',
      model: 'Neverfull MM',
      material: 'Damier Ebene Canvas',
      color: 'Brown',
      authenticity: 'Guaranteed Authentic',
      year: '2022'
    },
    shipping: {
      cost: 150,
      methods: ['Registered Mail', 'Express Delivery'],
      location: 'Cape Town, Western Cape'
    },
    questions: [],
    reviews: []
  },
  {
    _id: '7',
    title: 'Vintage Gibson Les Paul Guitar',
    description: '1975 Gibson Les Paul Standard in Tobacco Sunburst. Original case included.',
    seller: {
      username: 'guitarshop',
      firstName: 'David',
      lastName: 'Miller',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
      ratings: { average: 4.7, count: 78 },
      phone: '+27147258369'
    },
    category: { name: 'Musical Instruments', slug: 'musical-instruments' },
    currentPrice: 45000,
    currentBid: 45000,
    startingPrice: 35000,
    reservePrice: 50000,
    incrementAmount: 1000,
    totalBids: 45,
    uniqueBidders: 32,
    condition: 'good',
    status: 'active',
    endDate: new Date('2025-09-29T23:59:59'),
    images: [
      'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=600&fit=crop'
    ],
    views: 987,
    watchers: 45,
    specifications: {
      brand: 'Gibson',
      model: 'Les Paul Standard',
      year: '1975',
      color: 'Tobacco Sunburst',
      condition: 'Good',
      includes: 'Original Hard Case'
    },
    shipping: {
      cost: 400,
      methods: ['Express Delivery', 'Collection'],
      location: 'Johannesburg, Gauteng'
    },
    questions: [],
    reviews: []
  },
  {
    _id: '8',
    title: 'MacBook Pro M3 Max',
    description: '16-inch MacBook Pro with M3 Max chip, 36GB RAM, 1TB SSD. Perfect for creative professionals.',
    seller: {
      username: 'applestore',
      firstName: 'Michael',
      lastName: 'Brown',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
      ratings: { average: 4.9, count: 156 },
      phone: '+27852741963'
    },
    category: { name: 'Electronics', slug: 'electronics' },
    currentPrice: 28000,
    currentBid: 28000,
    startingPrice: 22000,
    reservePrice: 32000,
    incrementAmount: 1000,
    totalBids: 78,
    uniqueBidders: 56,
    condition: 'excellent',
    status: 'active',
    endDate: new Date('2025-09-30T23:59:59'),
    images: [
      'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&h=600&fit=crop'
    ],
    views: 1567,
    watchers: 78,
    specifications: {
      brand: 'Apple',
      model: 'MacBook Pro 16"',
      processor: 'M3 Max',
      ram: '36GB',
      storage: '1TB SSD',
      year: '2024'
    },
    shipping: {
      cost: 200,
      methods: ['Express Delivery', 'Collection'],
      location: 'Cape Town, Western Cape'
    },
    questions: [],
    reviews: []
  },
  {
    _id: '9',
    title: 'Diamond Engagement Ring',
    description: '1.5 carat diamond engagement ring in 18k white gold. GIA certified.',
    seller: {
      username: 'jewelrystore',
      firstName: 'Rachel',
      lastName: 'Green',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b830?w=100&h=100&fit=crop&crop=face',
      ratings: { average: 4.8, count: 92 },
      phone: '+27741852963'
    },
    category: { name: 'Jewelry', slug: 'jewelry' },
    currentPrice: 15000,
    currentBid: 15000,
    startingPrice: 12000,
    reservePrice: 18000,
    incrementAmount: 500,
    totalBids: 45,
    uniqueBidders: 32,
    condition: 'new',
    status: 'active',
    endDate: new Date('2025-10-01T23:59:59'),
    images: [
      'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&h=600&fit=crop'
    ],
    views: 789,
    watchers: 45,
    specifications: {
      carat: '1.5ct',
      cut: 'Round Brilliant',
      color: 'G',
      clarity: 'VS2',
      metal: '18k White Gold',
      certification: 'GIA'
    },
    shipping: {
      cost: 100,
      methods: ['Registered Mail', 'Express Delivery'],
      location: 'Johannesburg, Gauteng'
    },
    questions: [],
    reviews: []
  },
  {
    _id: '10',
    title: 'Vintage Mercedes-Benz Classic Car',
    description: '1985 Mercedes-Benz 560SL convertible. Fully restored, original engine.',
    seller: {
      username: 'classicars',
      firstName: 'James',
      lastName: 'Wilson',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face',
      ratings: { average: 4.7, count: 34 },
      phone: '+27963852741'
    },
    category: { name: 'Vehicles', slug: 'vehicles' },
    currentPrice: 180000,
    currentBid: 180000,
    startingPrice: 150000,
    reservePrice: 200000,
    incrementAmount: 5000,
    totalBids: 123,
    uniqueBidders: 89,
    condition: 'excellent',
    status: 'active',
    endDate: new Date('2025-10-05T23:59:59'),
    images: [
      'https://images.unsplash.com/photo-1550355191-aa8a80b41353?w=800&h=600&fit=crop'
    ],
    views: 2345,
    watchers: 123,
    specifications: {
      make: 'Mercedes-Benz',
      model: '560SL',
      year: '1985',
      mileage: '125,000 km',
      engine: '5.6L V8',
      transmission: 'Automatic'
    },
    shipping: {
      cost: 2000,
      methods: ['Collection Only'],
      location: 'Durban, KwaZulu-Natal'
    },
    questions: [],
    reviews: []
  },
  {
    _id: '11',
    title: 'Professional Camera Set',
    description: 'Canon EOS R5 with 24-70mm and 70-200mm lenses. Complete photographer kit.',
    seller: {
      username: 'photopro',
      firstName: 'Lisa',
      lastName: 'Anderson',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face',
      ratings: { average: 4.9, count: 67 },
      phone: '+27159753486'
    },
    category: { name: 'Electronics', slug: 'electronics' },
    currentPrice: 22000,
    currentBid: 22000,
    startingPrice: 18000,
    reservePrice: 25000,
    incrementAmount: 500,
    totalBids: 56,
    uniqueBidders: 42,
    condition: 'excellent',
    status: 'active',
    endDate: new Date('2025-10-02T23:59:59'),
    images: [
      'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=800&h=600&fit=crop'
    ],
    views: 1123,
    watchers: 56,
    specifications: {
      brand: 'Canon',
      model: 'EOS R5',
      lenses: '24-70mm f/2.8, 70-200mm f/2.8',
      includes: 'Battery Grip, Memory Cards, Bag',
      condition: 'Excellent',
      shutter: '15,000 actuations'
    },
    shipping: {
      cost: 250,
      methods: ['Express Delivery', 'Collection'],
      location: 'Pretoria, Gauteng'
    },
    questions: [],
    reviews: []
  },
  {
    _id: '12',
    title: 'Rare Wine Collection',
    description: '1982 Bordeaux wine collection including Château Margaux and Lafite Rothschild.',
    seller: {
      username: 'winecollector',
      firstName: 'Robert',
      lastName: 'Parker',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
      ratings: { average: 4.8, count: 43 },
      phone: '+27486159753'
    },
    category: { name: 'Collectibles', slug: 'collectibles' },
    currentPrice: 35000,
    currentBid: 35000,
    startingPrice: 28000,
    reservePrice: 40000,
    incrementAmount: 1000,
    totalBids: 34,
    uniqueBidders: 26,
    condition: 'excellent',
    status: 'active',
    endDate: new Date('2025-10-03T23:59:59'),
    images: [
      'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=800&h=600&fit=crop'
    ],
    views: 567,
    watchers: 34,
    specifications: {
      vintage: '1982',
      region: 'Bordeaux, France',
      includes: '6 bottles',
      storage: 'Professional cellar',
      condition: 'Perfect',
      provenance: 'Verified'
    },
    shipping: {
      cost: 500,
      methods: ['Specialized Wine Courier'],
      location: 'Cape Town, Western Cape'
    },
    questions: [],
    reviews: []
  }
];

// Get single product
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    // Use mock data for development
    const productId = req.params.id;
    const product = mockProducts.find(p => p._id === productId);

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Mock bid history
    const bids = [
      {
        _id: '1',
        amount: product.currentPrice,
        bidder: {
          username: 'bidder1',
          avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=50&h=50&fit=crop&crop=face'
        },
        timestamp: new Date('2024-12-21T10:30:00')
      },
      {
        _id: '2',
        amount: product.currentPrice - product.incrementAmount,
        bidder: {
          username: 'bidder2',
          avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b830?w=50&h=50&fit=crop&crop=face'
        },
        timestamp: new Date('2024-12-21T09:15:00')
      },
      {
        _id: '3',
        amount: product.currentPrice - (product.incrementAmount * 2),
        bidder: {
          username: 'bidder3',
          avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=50&h=50&fit=crop&crop=face'
        },
        timestamp: new Date('2024-12-21T08:45:00')
      }
    ];

    res.json({ product, bids });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create new product (seller/admin only)
router.post('/', [authMiddleware, sellerMiddleware], upload.array('images', 10), [
  body('title').notEmpty().trim(),
  body('description').notEmpty().trim(),
  body('category').notEmpty(),
  body('startingPrice').isFloat({ min: 0 }),
  body('endDate').isISO8601(),
  body('condition').isIn(['new', 'like-new', 'excellent', 'good', 'fair', 'poor'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const productData = {
      ...req.body,
      seller: req.user._id,
      images: []
    };

    // Handle uploaded images
    if (req.files && req.files.length > 0) {
      productData.images = req.files.map((file, index) => ({
        url: `/uploads/products/${file.filename}`,
        caption: req.body[`imageCaption${index}`] || '',
        isPrimary: index === 0
      }));
    }

    const product = new Product(productData);
    await product.save();

    // Update category product count
    await Category.findByIdAndUpdate(product.category, {
      $inc: { productCount: 1 }
    });

    res.status(201).json({
      message: 'Product created successfully',
      product
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update product
router.put('/:id', [authMiddleware], upload.array('images', 10), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Check ownership
    if (product.seller.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Don't allow certain updates if auction has started
    if (product.status === 'active' && product.totalBids > 0) {
      const restrictedFields = ['startingPrice', 'endDate', 'auctionType'];
      for (const field of restrictedFields) {
        if (req.body[field] !== undefined) {
          return res.status(400).json({ 
            error: `Cannot update ${field} after bidding has started` 
          });
        }
      }
    }

    // Handle new images
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map((file, index) => ({
        url: `/uploads/products/${file.filename}`,
        caption: req.body[`imageCaption${index}`] || '',
        isPrimary: false
      }));
      product.images = [...product.images, ...newImages];
    }

    // Update other fields
    Object.keys(req.body).forEach(key => {
      if (key !== 'images' && !key.startsWith('imageCaption')) {
        product[key] = req.body[key];
      }
    });

    await product.save();
    res.json({ message: 'Product updated successfully', product });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete product
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Check ownership
    if (product.seller.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Don't allow deletion if auction has bids
    if (product.totalBids > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete product with existing bids' 
      });
    }

    await product.deleteOne();
    
    // Update category product count
    await Category.findByIdAndUpdate(product.category, {
      $inc: { productCount: -1 }
    });

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Watch/unwatch product
router.post('/:id/watch', authMiddleware, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const userIndex = product.watchers.indexOf(req.user._id);
    
    if (userIndex === -1) {
      product.watchers.push(req.user._id);
      res.json({ message: 'Product added to watchlist', watching: true });
    } else {
      product.watchers.splice(userIndex, 1);
      res.json({ message: 'Product removed from watchlist', watching: false });
    }

    await product.save();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Ask question about product
router.post('/:id/questions', authMiddleware, [
  body('question').notEmpty().trim()
], async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    product.questions.push({
      user: req.user._id,
      question: req.body.question
    });

    await product.save();
    res.json({ message: 'Question submitted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Answer question (seller only)
router.post('/:id/questions/:questionId/answer', authMiddleware, [
  body('answer').notEmpty().trim()
], async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Check if user is the seller
    if (product.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Only seller can answer questions' });
    }

    const question = product.questions.id(req.params.questionId);
    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }

    question.answer = req.body.answer;
    question.answeredAt = new Date();

    await product.save();
    res.json({ message: 'Question answered successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get seller's products
router.get('/seller/:sellerId', async (req, res) => {
  try {
    const products = await Product.find({ 
      seller: req.params.sellerId,
      status: { $in: ['active', 'ended', 'sold'] }
    })
    .populate('category', 'name slug')
    .sort('-createdAt');

    res.json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get featured products
router.get('/featured/list', async (req, res) => {
  try {
    const products = await Product.find({ 
      featured: true,
      status: 'active'
    })
    .populate('seller', 'username avatar')
    .populate('category', 'name slug')
    .sort('-createdAt')
    .limit(8);

    res.json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get ending soon products
router.get('/ending/soon', async (req, res) => {
  try {
    const twentyFourHoursFromNow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    
    const products = await Product.find({
      status: 'active',
      endDate: { 
        $gte: new Date(),
        $lte: twentyFourHoursFromNow
      }
    })
    .populate('seller', 'username avatar')
    .populate('category', 'name slug')
    .sort('endDate')
    .limit(8);

    res.json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;