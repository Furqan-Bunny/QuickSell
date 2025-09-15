import { productsAPI, bidsAPI } from './apiService';

export interface Product {
  id?: string;
  title: string;
  description: string;
  images: string[];
  category: string;
  categoryId?: string;
  sellerId: string;
  sellerName: string;
  startingPrice: number;
  currentPrice: number;
  buyNowPrice?: number;
  incrementAmount: number;
  startDate: any;
  endDate: any;
  condition: 'new' | 'like-new' | 'excellent' | 'good' | 'fair' | 'poor';
  status: 'active' | 'ended' | 'sold';
  shippingCost: number;
  freeShipping: boolean;
  location: string;
  views: number;
  totalBids: number;
  bidsCount?: number;
  uniqueBidders: number;
  watchers: number;
  featured?: boolean;
}

export interface Bid {
  id?: string;
  productId: string;
  userId?: string;
  bidderId?: string;
  userName?: string;
  bidderName?: string;
  amount: number;
  status: 'active' | 'winning' | 'outbid' | 'won' | 'cancelled';
  placedAt?: any;
  createdAt?: any;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  productCount?: number;
}

class ProductService {
  async getProducts(filters?: {
    category?: string;
    status?: string;
    featured?: boolean;
    search?: string;
    minPrice?: number;
    maxPrice?: number;
    sort?: string;
  }): Promise<Product[]> {
    try {
      const response = await productsAPI.getAll(filters);
      
      // Handle the response structure
      const products = response.data || response.products || response;
      
      if (Array.isArray(products)) {
        return products.map(this.formatProduct);
      }
      
      return [];
    } catch (error: any) {
      console.error('Error getting products:', error);
      return [];
    }
  }

  async getProduct(productId: string): Promise<Product | null> {
    try {
      const response = await productsAPI.getById(productId);
      
      // Handle the response structure
      const product = response.data || response.product || response;
      
      if (product) {
        return this.formatProduct(product);
      }
      
      return null;
    } catch (error: any) {
      console.error('Error getting product:', error);
      return null;
    }
  }

  async getCategories(): Promise<Category[]> {
    try {
      const response = await productsAPI.getCategories();
      
      // Handle the response structure
      const categories = response.data || response.categories || response;
      
      if (Array.isArray(categories)) {
        return categories;
      }
      
      return [];
    } catch (error: any) {
      console.error('Error getting categories:', error);
      return [];
    }
  }

  async searchProducts(query: string): Promise<Product[]> {
    try {
      const response = await productsAPI.search(query);
      
      // Handle the response structure
      const products = response.data || response.products || response;
      
      if (Array.isArray(products)) {
        return products.map(this.formatProduct);
      }
      
      return [];
    } catch (error: any) {
      console.error('Error searching products:', error);
      return [];
    }
  }

  async placeBid(
    productId: string,
    userId: string,
    userName: string,
    amount: number
  ): Promise<string> {
    try {
      const response = await bidsAPI.placeBid(productId, amount);
      
      if (response.success || response.bid) {
        return response.bid?.id || response.bidId || 'success';
      }
      
      throw new Error(response.error || 'Failed to place bid');
    } catch (error: any) {
      throw new Error(error.message || 'Failed to place bid');
    }
  }

  async getProductBids(productId: string): Promise<Bid[]> {
    try {
      const response = await bidsAPI.getBidHistory(productId);
      
      // Handle the response structure
      const bids = response.data || response.bids || response;
      
      if (Array.isArray(bids)) {
        return bids.map(this.formatBid);
      }
      
      return [];
    } catch (error: any) {
      console.error('Error getting product bids:', error);
      return [];
    }
  }

  async getUserBids(userId: string): Promise<Bid[]> {
    try {
      const response = await bidsAPI.getMyBids();
      
      // Handle the response structure
      const bids = response.data || response.bids || response;
      
      if (Array.isArray(bids)) {
        return bids.map(this.formatBid);
      }
      
      return [];
    } catch (error: any) {
      console.error('Error getting user bids:', error);
      return [];
    }
  }

  private formatProduct(product: any): Product {
    // Format Firebase timestamp to Date if needed
    const formatDate = (date: any) => {
      if (date?._seconds) {
        return new Date(date._seconds * 1000);
      }
      if (date?.toDate) {
        return date.toDate();
      }
      return date ? new Date(date) : new Date();
    };

    return {
      id: product.id || product._id,
      title: product.title || '',
      description: product.description || '',
      images: Array.isArray(product.images) ? product.images : [product.images].filter(Boolean),
      category: product.category || 'Other',
      categoryId: product.categoryId,
      sellerId: product.sellerId || product.seller,
      sellerName: product.sellerName || 'Unknown Seller',
      startingPrice: product.startingPrice || product.startPrice || 0,
      currentPrice: product.currentPrice || 0,
      buyNowPrice: product.buyNowPrice,
      incrementAmount: product.incrementAmount || 100,
      startDate: formatDate(product.startDate),
      endDate: formatDate(product.endDate),
      condition: product.condition || 'good',
      status: product.status || 'active',
      shippingCost: product.shippingCost || 0,
      freeShipping: product.freeShipping || false,
      location: product.location || 'South Africa',
      views: product.views || 0,
      totalBids: product.totalBids || product.bidsCount || 0,
      bidsCount: product.bidsCount || product.totalBids || 0,
      uniqueBidders: product.uniqueBidders || 0,
      watchers: product.watchers || 0,
      featured: product.featured || false
    };
  }

  private formatBid(bid: any): Bid {
    // Format Firebase timestamp to Date if needed
    const formatDate = (date: any) => {
      if (date?._seconds) {
        return new Date(date._seconds * 1000);
      }
      if (date?.toDate) {
        return date.toDate();
      }
      return date ? new Date(date) : new Date();
    };

    return {
      id: bid.id || bid._id,
      productId: bid.productId,
      userId: bid.userId || bid.bidderId,
      bidderId: bid.bidderId || bid.userId,
      userName: bid.userName || bid.bidderName,
      bidderName: bid.bidderName || bid.userName,
      amount: bid.amount || 0,
      status: bid.status || 'active',
      placedAt: formatDate(bid.placedAt || bid.createdAt),
      createdAt: formatDate(bid.createdAt || bid.placedAt)
    };
  }

  getTimeRemaining(endDate: any): string {
    const end = endDate?.getTime ? endDate.getTime() : new Date(endDate).getTime();
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

  getConditionLabel(condition: string): string {
    const labels: Record<string, string> = {
      'new': 'Brand New',
      'like-new': 'Like New',
      'excellent': 'Excellent',
      'good': 'Good',
      'fair': 'Fair',
      'poor': 'Poor'
    };
    return labels[condition] || condition;
  }
}

export default new ProductService();