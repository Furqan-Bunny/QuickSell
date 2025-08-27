import { db } from '../config/firebaseConfig';
import mockProductService from './mockProductService';

// Simple product service that avoids complex index requirements
const USE_MOCK = false;

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
  condition: string;
  status: string;
  shippingCost: number;
  freeShipping: boolean;
  location: string;
  views: number;
  totalBids: number;
  uniqueBidders: number;
  watchers: number;
  featured?: boolean;
  createdAt?: any;
}

class SimpleProductService {
  async getProducts(filters?: {
    category?: string;
    status?: string;
    featured?: boolean;
  }): Promise<Product[]> {
    if (USE_MOCK) {
      return mockProductService.getProducts(filters);
    }
    
    try {
      // Fetch all products without complex queries
      const snapshot = await db.collection('products').get();
      let products: Product[] = [];

      snapshot.forEach((doc) => {
        const data = doc.data();
        const product = {
          id: doc.id,
          ...data
        } as Product;

        // Apply filters in memory
        let includeProduct = true;

        if (filters?.status && data.status !== filters.status) {
          includeProduct = false;
        }
        if (filters?.category && data.category !== filters.category) {
          includeProduct = false;
        }
        if (filters?.featured !== undefined && data.featured !== filters.featured) {
          includeProduct = false;
        }

        if (includeProduct) {
          products.push(product);
        }
      });

      // Sort by createdAt in memory
      products.sort((a, b) => {
        const aTime = a.createdAt?._seconds || a.createdAt?.seconds || 0;
        const bTime = b.createdAt?._seconds || b.createdAt?.seconds || 0;
        return bTime - aTime; // Newest first
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
}

export default new SimpleProductService();