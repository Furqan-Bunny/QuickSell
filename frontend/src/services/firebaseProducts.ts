import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  query, 
  where, 
  orderBy, 
  limit,
  serverTimestamp,
  Timestamp,
  addDoc
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject 
} from 'firebase/storage';
import { db, storage } from '../config/firebase';

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
  startDate: Timestamp | any;
  endDate: Timestamp | any;
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
  createdAt?: any;
  updatedAt?: any;
}

export interface Bid {
  id?: string;
  productId: string;
  bidderId: string;
  bidderName: string;
  amount: number;
  maxAmount?: number;
  isAutoBid: boolean;
  status: 'winning' | 'outbid' | 'won' | 'cancelled';
  placedAt: Timestamp | any;
}

class FirebaseProductService {
  // Products Collection
  async createProduct(product: Product, imageFiles?: File[]): Promise<string> {
    try {
      // Upload images if provided
      let imageUrls: string[] = [];
      if (imageFiles && imageFiles.length > 0) {
        imageUrls = await this.uploadProductImages(imageFiles);
      }

      const productData = {
        ...product,
        images: imageUrls.length > 0 ? imageUrls : product.images,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        views: 0,
        totalBids: 0,
        uniqueBidders: 0,
        watchers: 0
      };

      const docRef = await addDoc(collection(db, 'products'), productData);
      return docRef.id;
    } catch (error: any) {
      throw new Error(`Failed to create product: ${error.message}`);
    }
  }

  async getProduct(productId: string): Promise<Product | null> {
    try {
      const docRef = doc(db, 'products', productId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        // Increment views
        await updateDoc(docRef, {
          views: (docSnap.data().views || 0) + 1
        });

        return {
          id: docSnap.id,
          ...docSnap.data()
        } as Product;
      }
      return null;
    } catch (error: any) {
      throw new Error(`Failed to get product: ${error.message}`);
    }
  }

  async getProducts(filters?: {
    category?: string;
    status?: string;
    featured?: boolean;
    sellerId?: string;
  }): Promise<Product[]> {
    try {
      let q = query(collection(db, 'products'));

      if (filters?.category) {
        q = query(q, where('category', '==', filters.category));
      }
      if (filters?.status) {
        q = query(q, where('status', '==', filters.status));
      }
      if (filters?.featured !== undefined) {
        q = query(q, where('featured', '==', filters.featured));
      }
      if (filters?.sellerId) {
        q = query(q, where('sellerId', '==', filters.sellerId));
      }

      q = query(q, orderBy('createdAt', 'desc'));

      const querySnapshot = await getDocs(q);
      const products: Product[] = [];

      querySnapshot.forEach((doc) => {
        products.push({
          id: doc.id,
          ...doc.data()
        } as Product);
      });

      return products;
    } catch (error: any) {
      throw new Error(`Failed to get products: ${error.message}`);
    }
  }

  async updateProduct(productId: string, updates: Partial<Product>): Promise<void> {
    try {
      await updateDoc(doc(db, 'products', productId), {
        ...updates,
        updatedAt: serverTimestamp()
      });
    } catch (error: any) {
      throw new Error(`Failed to update product: ${error.message}`);
    }
  }

  async deleteProduct(productId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'products', productId));
    } catch (error: any) {
      throw new Error(`Failed to delete product: ${error.message}`);
    }
  }

  // Bids Collection
  async placeBid(bid: Omit<Bid, 'id'>): Promise<string> {
    try {
      const bidData = {
        ...bid,
        placedAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'bids'), bidData);

      // Update product with new bid info
      await this.updateProduct(bid.productId, {
        currentPrice: bid.amount,
        totalBids: await this.getProductBidCount(bid.productId) + 1
      });

      return docRef.id;
    } catch (error: any) {
      throw new Error(`Failed to place bid: ${error.message}`);
    }
  }

  async getProductBids(productId: string): Promise<Bid[]> {
    try {
      const q = query(
        collection(db, 'bids'),
        where('productId', '==', productId),
        orderBy('amount', 'desc'),
        orderBy('placedAt', 'asc')
      );

      const querySnapshot = await getDocs(q);
      const bids: Bid[] = [];

      querySnapshot.forEach((doc) => {
        bids.push({
          id: doc.id,
          ...doc.data()
        } as Bid);
      });

      return bids;
    } catch (error: any) {
      throw new Error(`Failed to get bids: ${error.message}`);
    }
  }

  async getUserBids(userId: string): Promise<Bid[]> {
    try {
      const q = query(
        collection(db, 'bids'),
        where('bidderId', '==', userId),
        orderBy('placedAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const bids: Bid[] = [];

      querySnapshot.forEach((doc) => {
        bids.push({
          id: doc.id,
          ...doc.data()
        } as Bid);
      });

      return bids;
    } catch (error: any) {
      throw new Error(`Failed to get user bids: ${error.message}`);
    }
  }

  private async getProductBidCount(productId: string): Promise<number> {
    const q = query(
      collection(db, 'bids'),
      where('productId', '==', productId)
    );
    const snapshot = await getDocs(q);
    return snapshot.size;
  }

  // Image Upload
  async uploadProductImages(files: File[]): Promise<string[]> {
    const urls: string[] = [];

    for (const file of files) {
      const fileName = `products/${Date.now()}_${file.name}`;
      const storageRef = ref(storage, fileName);
      
      const snapshot = await uploadBytes(storageRef, file);
      const url = await getDownloadURL(snapshot.ref);
      urls.push(url);
    }

    return urls;
  }

  async deleteProductImage(imageUrl: string): Promise<void> {
    try {
      // Extract file path from URL
      const url = new URL(imageUrl);
      const path = decodeURIComponent(url.pathname.split('/o/')[1].split('?')[0]);
      
      const storageRef = ref(storage, path);
      await deleteObject(storageRef);
    } catch (error: any) {
      console.error('Failed to delete image:', error);
    }
  }
}

export default new FirebaseProductService();