// Mock Product Service for Testing
import { Product, Bid } from './productService';

class MockProductService {
  private mockProducts: Product[] = [
    {
      id: '1',
      title: 'iPhone 14 Pro Max',
      description: 'Brand new iPhone 14 Pro Max, 256GB, Deep Purple. Sealed in box with warranty.',
      images: ['https://picsum.photos/400/400?random=1'],
      category: 'Electronics',
      categoryId: 'cat-1',
      sellerId: 'seller-1',
      sellerName: 'TechStore SA',
      startingPrice: 15000,
      currentPrice: 18500,
      buyNowPrice: 25000,
      incrementAmount: 500,
      startDate: new Date('2025-01-15'),
      endDate: new Date('2025-01-25'),
      condition: 'new',
      status: 'active',
      shippingCost: 150,
      freeShipping: false,
      location: 'Cape Town',
      views: 234,
      totalBids: 12,
      uniqueBidders: 8,
      watchers: 45,
      featured: true
    },
    {
      id: '2',
      title: 'Nike Air Jordan 1 Retro',
      description: 'Original Air Jordan 1 Retro High OG. Size US 10. Brand new with box.',
      images: ['https://picsum.photos/400/400?random=2'],
      category: 'Fashion',
      categoryId: 'cat-2',
      sellerId: 'seller-2',
      sellerName: 'SneakerHead',
      startingPrice: 2500,
      currentPrice: 3200,
      buyNowPrice: 4500,
      incrementAmount: 100,
      startDate: new Date('2025-01-18'),
      endDate: new Date('2025-01-28'),
      condition: 'new',
      status: 'active',
      shippingCost: 100,
      freeShipping: false,
      location: 'Johannesburg',
      views: 156,
      totalBids: 8,
      uniqueBidders: 5,
      watchers: 23,
      featured: true
    },
    {
      id: '3',
      title: 'PlayStation 5 Console',
      description: 'PS5 Disc Edition with extra controller and 3 games. Excellent condition.',
      images: ['https://picsum.photos/400/400?random=3'],
      category: 'Electronics',
      categoryId: 'cat-1',
      sellerId: 'seller-3',
      sellerName: 'GameZone',
      startingPrice: 8000,
      currentPrice: 9500,
      incrementAmount: 250,
      startDate: new Date('2025-01-20'),
      endDate: new Date('2025-01-30'),
      condition: 'excellent',
      status: 'active',
      shippingCost: 200,
      freeShipping: false,
      location: 'Durban',
      views: 312,
      totalBids: 15,
      uniqueBidders: 10,
      watchers: 67,
      featured: false
    },
    {
      id: '4',
      title: 'MacBook Pro M2',
      description: '14-inch MacBook Pro with M2 chip, 16GB RAM, 512GB SSD. Space Gray.',
      images: ['https://picsum.photos/400/400?random=4'],
      category: 'Electronics',
      categoryId: 'cat-1',
      sellerId: 'seller-1',
      sellerName: 'TechStore SA',
      startingPrice: 25000,
      currentPrice: 28000,
      buyNowPrice: 35000,
      incrementAmount: 1000,
      startDate: new Date('2025-01-16'),
      endDate: new Date('2025-01-26'),
      condition: 'like-new',
      status: 'active',
      shippingCost: 0,
      freeShipping: true,
      location: 'Pretoria',
      views: 445,
      totalBids: 18,
      uniqueBidders: 12,
      watchers: 89,
      featured: true
    },
    {
      id: '5',
      title: 'Samsung 55" 4K Smart TV',
      description: 'Samsung QLED 55 inch 4K Smart TV. Model QN55Q80B. Brand new, sealed.',
      images: ['https://picsum.photos/400/400?random=5'],
      category: 'Electronics',
      categoryId: 'cat-1',
      sellerId: 'seller-4',
      sellerName: 'ElectroMart',
      startingPrice: 12000,
      currentPrice: 13500,
      incrementAmount: 500,
      startDate: new Date('2025-01-19'),
      endDate: new Date('2025-01-29'),
      condition: 'new',
      status: 'active',
      shippingCost: 350,
      freeShipping: false,
      location: 'Cape Town',
      views: 198,
      totalBids: 6,
      uniqueBidders: 4,
      watchers: 34,
      featured: false
    }
  ];

  private mockBids: Bid[] = [
    {
      id: 'bid-1',
      productId: '1',
      bidderId: 'mock-user-1',
      bidderName: 'testbuyer',
      amount: 18500,
      status: 'winning',
      placedAt: new Date('2025-01-22T10:30:00')
    },
    {
      id: 'bid-2',
      productId: '2',
      bidderId: 'mock-user-1',
      bidderName: 'testbuyer',
      amount: 3000,
      status: 'outbid',
      placedAt: new Date('2025-01-21T14:20:00')
    }
  ];

  async getProducts(filters?: {
    category?: string;
    status?: string;
    featured?: boolean;
  }): Promise<Product[]> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    let products = [...this.mockProducts];

    if (filters?.category) {
      products = products.filter(p => p.category === filters.category);
    }
    if (filters?.status) {
      products = products.filter(p => p.status === filters.status);
    }
    if (filters?.featured !== undefined) {
      products = products.filter(p => p.featured === filters.featured);
    }

    return products;
  }

  async getProduct(productId: string): Promise<Product | null> {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const product = this.mockProducts.find(p => p.id === productId);
    if (product) {
      // Increment views
      product.views++;
    }
    return product || null;
  }

  async placeBid(
    productId: string,
    bidderId: string,
    bidderName: string,
    amount: number
  ): Promise<string> {
    await new Promise(resolve => setTimeout(resolve, 800));

    const product = this.mockProducts.find(p => p.id === productId);
    if (!product) {
      throw new Error('Product not found');
    }

    if (amount <= product.currentPrice) {
      throw new Error(`Bid must be higher than current price of ${this.formatPrice(product.currentPrice)}`);
    }

    // Update existing bids to outbid status
    this.mockBids
      .filter(b => b.productId === productId && b.status === 'winning')
      .forEach(b => b.status = 'outbid');

    // Create new bid
    const newBid: Bid = {
      id: `bid-${Date.now()}`,
      productId,
      bidderId,
      bidderName,
      amount,
      status: 'winning',
      placedAt: new Date()
    };

    this.mockBids.push(newBid);

    // Update product
    product.currentPrice = amount;
    product.totalBids++;

    return newBid.id!;
  }

  async getProductBids(productId: string): Promise<Bid[]> {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return this.mockBids
      .filter(b => b.productId === productId)
      .sort((a, b) => b.amount - a.amount);
  }

  async getUserBids(userId: string): Promise<Bid[]> {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return this.mockBids
      .filter(b => b.bidderId === userId)
      .sort((a, b) => {
        const dateA = a.placedAt instanceof Date ? a.placedAt : new Date(a.placedAt);
        const dateB = b.placedAt instanceof Date ? b.placedAt : new Date(b.placedAt);
        return dateB.getTime() - dateA.getTime();
      });
  }

  getTimeRemaining(endDate: any): string {
    const end = endDate instanceof Date ? endDate.getTime() : new Date(endDate).getTime();
    const now = new Date().getTime();
    const diff = end - now;

    if (diff <= 0) return 'Ended';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  }

  formatPrice(price: number): string {
    return `R${price.toLocaleString('en-ZA')}`;
  }
}

export default new MockProductService();