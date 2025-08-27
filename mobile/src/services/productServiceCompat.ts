import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import { db } from '../config/firebaseConfig';
import mockProductService from './mockProductService';

// Use real Firebase for production
const USE_MOCK = false;

export interface Product {
  id?: string;
  title: string;
  description: string;
  images: string[];
  category: string;
  categoryId: string;
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
  uniqueBidders: number;
  watchers: number;
  featured?: boolean;
}

export interface Bid {
  id?: string;
  productId: string;
  bidderId: string;
  bidderName: string;
  amount: number;
  status: 'winning' | 'outbid' | 'won' | 'cancelled';
  placedAt: any;
}

class ProductService {
  async getProducts(filters?: {
    category?: string;
    status?: string;
    featured?: boolean;
  }): Promise<Product[]> {
    if (USE_MOCK) {
      return mockProductService.getProducts(filters);
    }
    
    try {
      let query = db.collection('products');

      // Apply filters - indexes are now enabled for all combinations
      if (filters?.status) {
        query = query.where('status', '==', filters.status);
      }
      if (filters?.category) {
        query = query.where('category', '==', filters.category);
      }
      if (filters?.featured !== undefined) {
        query = query.where('featured', '==', filters.featured);
      }

      // Add ordering - all indexes are now created
      query = query.orderBy('createdAt', 'desc');

      const querySnapshot = await query.get();
      const products: Product[] = [];

      querySnapshot.forEach((doc) => {
        products.push({
          id: doc.id,
          ...doc.data()
        } as Product);
      });

      return products;
    } catch (error: any) {
      console.error('Error getting products:', error);
      return [];
    }
  }

  async getProduct(productId: string): Promise<Product | null> {
    if (USE_MOCK) {
      return mockProductService.getProduct(productId);
    }
    
    try {
      const doc = await db.collection('products').doc(productId).get();

      if (doc.exists) {
        // Increment views
        await doc.ref.update({
          views: firebase.firestore.FieldValue.increment(1)
        });

        return {
          id: doc.id,
          ...doc.data()
        } as Product;
      }
      return null;
    } catch (error: any) {
      console.error('Error getting product:', error);
      return null;
    }
  }

  async placeBid(
    productId: string,
    bidderId: string,
    bidderName: string,
    amount: number
  ): Promise<string> {
    if (USE_MOCK) {
      return mockProductService.placeBid(productId, bidderId, bidderName, amount);
    }
    
    try {
      const bidData = {
        productId,
        bidderId,
        bidderName,
        amount,
        status: 'winning',
        placedAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      const docRef = await db.collection('bids').add(bidData);

      // Update product with new bid info
      await db.collection('products').doc(productId).update({
        currentPrice: amount,
        totalBids: firebase.firestore.FieldValue.increment(1),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      return docRef.id;
    } catch (error: any) {
      throw new Error(`Failed to place bid: ${error.message}`);
    }
  }

  async getProductBids(productId: string): Promise<Bid[]> {
    if (USE_MOCK) {
      return mockProductService.getProductBids(productId);
    }
    
    try {
      const querySnapshot = await db.collection('bids')
        .where('productId', '==', productId)
        .orderBy('amount', 'desc')
        .limit(10)
        .get();
        
      const bids: Bid[] = [];

      querySnapshot.forEach((doc) => {
        bids.push({
          id: doc.id,
          ...doc.data()
        } as Bid);
      });

      return bids;
    } catch (error: any) {
      console.error('Error getting bids:', error);
      return [];
    }
  }

  async getUserBids(userId: string): Promise<Bid[]> {
    if (USE_MOCK) {
      return mockProductService.getUserBids(userId);
    }
    
    try {
      const querySnapshot = await db.collection('bids')
        .where('bidderId', '==', userId)
        .orderBy('placedAt', 'desc')
        .get();

      const bids: Bid[] = [];

      querySnapshot.forEach((doc) => {
        bids.push({
          id: doc.id,
          ...doc.data()
        } as Bid);
      });

      return bids;
    } catch (error: any) {
      console.error('Error getting user bids:', error);
      return [];
    }
  }

  getTimeRemaining(endDate: any): string {
    if (USE_MOCK) {
      return mockProductService.getTimeRemaining(endDate);
    }
    
    const end = endDate?.toDate ? endDate.toDate().getTime() : new Date(endDate).getTime();
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
    if (USE_MOCK) {
      return mockProductService.formatPrice(price);
    }
    
    return `R${price.toLocaleString('en-ZA')}`;
  }
}

export default new ProductService();