export interface Product {
  id: string;
  title: string;
  description: string;
  images: string[];
  category: string;
  categoryId: string;
  seller: {
    id: string;
    name: string;
    rating: number;
    verified: boolean;
  };
  startingPrice: number;
  currentPrice: number;
  buyNowPrice?: number;
  incrementAmount: number;
  startDate: string;
  endDate: string;
  condition: 'new' | 'like-new' | 'excellent' | 'good' | 'fair' | 'poor';
  status: 'active' | 'ended' | 'sold';
  shippingCost: number;
  freeShipping: boolean;
  location: string;
  views: number;
  bids: number;
  watchers: number;
  featured?: boolean;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  count: number;
}

export const categories: Category[] = [
  { id: '1', name: 'Electronics', slug: 'electronics', icon: '📱', count: 156 },
  { id: '2', name: 'Fashion', slug: 'fashion', icon: '👗', count: 243 },
  { id: '3', name: 'Home & Garden', slug: 'home-garden', icon: '🏠', count: 89 },
  { id: '4', name: 'Sports & Outdoors', slug: 'sports', icon: '⚽', count: 124 },
  { id: '5', name: 'Vehicles', slug: 'vehicles', icon: '🚗', count: 67 },
  { id: '6', name: 'Collectibles & Art', slug: 'collectibles', icon: '🎨', count: 198 },
  { id: '7', name: 'Books & Media', slug: 'books', icon: '📚', count: 312 },
  { id: '8', name: 'Jewelry & Watches', slug: 'jewelry', icon: '💎', count: 95 }
];

// All products are sold by admin - only admin can list items
const adminSeller = {
  id: 'admin',
  name: 'Quicksell Official',
  rating: 5.0,
  verified: true
};

export const mockProducts: Product[] = [
  {
    id: '1',
    title: 'iPhone 14 Pro Max 256GB - Excellent Condition',
    description: 'Premium smartphone in excellent condition! Color: Deep Purple, Storage: 256GB, Battery Health: 92%, Includes original box and charger. Perfect for photography enthusiasts.',
    images: [
      'https://images.unsplash.com/photo-1678685888221-cda773a3dcdb?w=800',
      'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800'
    ],
    category: 'Electronics',
    categoryId: '1',
    seller: adminSeller,
    startingPrice: 15000,
    currentPrice: 16500,
    buyNowPrice: 22000,
    incrementAmount: 500,
    startDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    condition: 'excellent',
    status: 'active',
    shippingCost: 150,
    freeShipping: false,
    location: 'Cape Town, Western Cape',
    views: 234,
    bids: 8,
    watchers: 23,
    featured: true
  },
  {
    id: '2',
    title: '2019 Volkswagen Polo GTI - Low Mileage',
    description: 'Well-maintained hot hatch! Year: 2019, Mileage: 35,000 km, Engine: 2.0 TSI, Full service history at VW, One owner, Accident-free.',
    images: [
      'https://images.unsplash.com/photo-1609521263047-f8f205293f24?w=800'
    ],
    category: 'Vehicles',
    categoryId: '5',
    seller: adminSeller,
    startingPrice: 280000,
    currentPrice: 285000,
    buyNowPrice: 350000,
    incrementAmount: 5000,
    startDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
    condition: 'excellent',
    status: 'active',
    shippingCost: 0,
    freeShipping: false,
    location: 'Johannesburg, Gauteng',
    views: 1203,
    bids: 3,
    watchers: 45,
    featured: true
  },
  {
    id: '3',
    title: 'MacBook Pro M2 13" - 2023 Model',
    description: 'Latest MacBook Pro with M2 chip! 8GB RAM, 512GB SSD, Space Gray, AppleCare+ until Dec 2024, Mint condition.',
    images: [
      'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800'
    ],
    category: 'Electronics',
    categoryId: '1',
    seller: adminSeller,
    startingPrice: 18000,
    currentPrice: 19500,
    buyNowPrice: 28000,
    incrementAmount: 1000,
    startDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
    condition: 'like-new',
    status: 'active',
    shippingCost: 200,
    freeShipping: false,
    location: 'Durban, KwaZulu-Natal',
    views: 567,
    bids: 12,
    watchers: 34
  },
  {
    id: '4',
    title: 'Nike Air Jordan 1 Retro High - Size 10',
    description: 'Iconic sneakers in great condition. Authentic Nike Air Jordan 1, Size: US 10, Colorway: Chicago Red, Original box included.',
    images: [
      'https://images.unsplash.com/photo-1600181516264-3ea807ff44b9?w=800'
    ],
    category: 'Fashion',
    categoryId: '2',
    seller: adminSeller,
    startingPrice: 3500,
    currentPrice: 4200,
    buyNowPrice: 5500,
    incrementAmount: 200,
    startDate: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    endDate: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(),
    condition: 'good',
    status: 'active',
    shippingCost: 150,
    freeShipping: false,
    location: 'Pretoria, Gauteng',
    views: 445,
    bids: 15,
    watchers: 67,
    featured: true
  },
  {
    id: '5',
    title: 'Rare Krugerrand Gold Coin Collection - 1970s',
    description: 'Investment-grade gold coins. Set of 3 Krugerrands from 1974-1976, 1 oz fine gold each, Uncirculated condition.',
    images: [
      'https://images.unsplash.com/photo-1610375461246-83df859d849d?w=800'
    ],
    category: 'Collectibles & Art',
    categoryId: '6',
    seller: adminSeller,
    startingPrice: 120000,
    currentPrice: 125000,
    buyNowPrice: 150000,
    incrementAmount: 2000,
    startDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    condition: 'new',
    status: 'active',
    shippingCost: 500,
    freeShipping: false,
    location: 'Cape Town, Western Cape',
    views: 3456,
    bids: 5,
    watchers: 123,
    featured: true
  },
  {
    id: '6',
    title: 'Samsung 55" 4K Smart TV - Crystal UHD',
    description: 'Transform your viewing experience! Model: AU8000, 55 inch display, Smart TV with streaming apps, HDR support.',
    images: [
      'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=800'
    ],
    category: 'Electronics',
    categoryId: '1',
    seller: adminSeller,
    startingPrice: 6000,
    currentPrice: 6500,
    buyNowPrice: 9500,
    incrementAmount: 250,
    startDate: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    condition: 'excellent',
    status: 'active',
    shippingCost: 350,
    freeShipping: false,
    location: 'Port Elizabeth, Eastern Cape',
    views: 123,
    bids: 4,
    watchers: 18
  },
  {
    id: '7',
    title: 'Springboks 2023 World Cup Jersey - Signed',
    description: "Collector's item! Official 2023 RWC jersey signed by Siya Kolisi, Size: XL, Certificate of authenticity included.",
    images: [
      'https://images.unsplash.com/photo-1577223625816-7546f13df25d?w=800'
    ],
    category: 'Sports & Outdoors',
    categoryId: '4',
    seller: adminSeller,
    startingPrice: 5000,
    currentPrice: 6200,
    buyNowPrice: 8500,
    incrementAmount: 250,
    startDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    condition: 'new',
    status: 'active',
    shippingCost: 100,
    freeShipping: false,
    location: 'Johannesburg, Gauteng',
    views: 789,
    bids: 18,
    watchers: 92,
    featured: true
  },
  {
    id: '8',
    title: 'Weber Genesis II Gas Braai - Premium BBQ',
    description: 'Perfect for South African braais! 3-burner gas braai, Stainless steel, Side burner, Cover included.',
    images: [
      'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800'
    ],
    category: 'Home & Garden',
    categoryId: '3',
    seller: adminSeller,
    startingPrice: 8000,
    currentPrice: 8000,
    buyNowPrice: 12000,
    incrementAmount: 500,
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    condition: 'excellent',
    status: 'active',
    shippingCost: 400,
    freeShipping: false,
    location: 'Bloemfontein, Free State',
    views: 234,
    bids: 0,
    watchers: 12
  },
  {
    id: '9',
    title: 'Tanzanite & Diamond Ring - 18k White Gold',
    description: 'Exquisite tanzanite ring. 2.5ct Tanzanite center, 0.5ct diamonds, 18k white gold, GIA certified, Size 7.',
    images: [
      'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800'
    ],
    category: 'Jewelry & Watches',
    categoryId: '8',
    seller: adminSeller,
    startingPrice: 35000,
    currentPrice: 38000,
    buyNowPrice: 50000,
    incrementAmount: 1000,
    startDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
    condition: 'new',
    status: 'active',
    shippingCost: 0,
    freeShipping: true,
    location: 'Cape Town, Western Cape',
    views: 567,
    bids: 7,
    watchers: 43
  },
  {
    id: '10',
    title: 'Genuine Leather Jacket - Italian Design',
    description: 'Premium Italian leather jacket. Size: Large, Color: Black, 100% genuine leather, Worn only twice.',
    images: [
      'https://images.unsplash.com/photo-1520012218364-3dbe62c99bee?w=800'
    ],
    category: 'Fashion',
    categoryId: '2',
    seller: adminSeller,
    startingPrice: 2500,
    currentPrice: 2500,
    buyNowPrice: 4000,
    incrementAmount: 100,
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
    condition: 'like-new',
    status: 'active',
    shippingCost: 100,
    freeShipping: false,
    location: 'Durban, KwaZulu-Natal',
    views: 89,
    bids: 0,
    watchers: 8
  }
];

// Helper function to get products by category
export const getProductsByCategory = (categoryId: string): Product[] => {
  return mockProducts.filter(product => product.categoryId === categoryId);
};

// Helper function to get featured products
export const getFeaturedProducts = (): Product[] => {
  return mockProducts.filter(product => product.featured);
};

// Helper function to get a single product
export const getProductById = (id: string): Product | undefined => {
  return mockProducts.find(product => product.id === id);
};

// Helper function to format price in ZAR
export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
};

// Helper function to calculate time remaining
export const getTimeRemaining = (endDate: string): string => {
  const end = new Date(endDate).getTime();
  const now = new Date().getTime();
  const diff = end - now;

  if (diff <= 0) return 'Ended';

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
};