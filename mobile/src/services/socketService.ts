import { io, Socket } from 'socket.io-client';
import { SOCKET_URL } from '../config/api';

interface BidData {
  productId: string;
  userId: string;
  userName: string;
  amount: number;
}

interface AuctionInfo {
  currentPrice: number;
  bidsCount: number;
  topBids: any[];
  endDate: Date;
}

class SocketService {
  private socket: Socket | null = null;
  private currentProductId: string | null = null;
  private bidListeners: Map<string, Function[]> = new Map();
  private connectionListeners: Function[] = [];
  private auctionInfoListeners: Function[] = [];

  connect() {
    if (this.socket?.connected) {
      return;
    }

    this.socket = io(SOCKET_URL, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Socket connected');
      this.connectionListeners.forEach(listener => listener(true));
      
      // Rejoin auction room if we were in one
      if (this.currentProductId) {
        this.joinAuction(this.currentProductId);
      }
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
      this.connectionListeners.forEach(listener => listener(false));
    });

    this.socket.on('auction-info', (data: AuctionInfo) => {
      console.log('Received auction info:', data);
      this.auctionInfoListeners.forEach(listener => listener(data));
    });

    this.socket.on('new-bid', (bidData: any) => {
      console.log('New bid received:', bidData);
      const listeners = this.bidListeners.get(bidData.productId) || [];
      listeners.forEach(listener => listener(bidData));
    });

    this.socket.on('bid-success', (data: any) => {
      console.log('Bid placed successfully:', data);
    });

    this.socket.on('bid-error', (error: any) => {
      console.error('Bid error:', error);
    });

    this.socket.on('error', (error: any) => {
      console.error('Socket error:', error);
    });
  }

  joinAuction(productId: string) {
    if (!this.socket?.connected) {
      this.connect();
      // Wait for connection before joining
      return;
    }

    // Don't rejoin if already in this auction
    if (this.currentProductId === productId) {
      console.log(`Already in auction room: ${productId}`);
      return;
    }

    // Leave previous auction if any
    if (this.currentProductId) {
      this.leaveAuction(this.currentProductId);
    }

    this.currentProductId = productId;
    this.socket?.emit('join-auction', productId);
    console.log(`Joined auction room: ${productId}`);
  }

  leaveAuction(productId: string) {
    if (!this.socket?.connected) return;

    this.socket.emit('leave-auction', productId);
    this.currentProductId = null;
    
    // Clear listeners for this auction
    this.bidListeners.delete(productId);
    console.log(`Left auction room: ${productId}`);
  }

  placeBid(bidData: BidData) {
    if (!this.socket?.connected) {
      throw new Error('Socket not connected');
    }

    this.socket.emit('place-bid', bidData);
  }

  getBidHistory(productId: string) {
    if (!this.socket?.connected) {
      throw new Error('Socket not connected');
    }

    return new Promise((resolve) => {
      this.socket?.emit('get-bid-history', productId);
      
      // Set up one-time listener for response
      const handleHistory = (bids: any[]) => {
        this.socket?.off('bid-history', handleHistory);
        resolve(bids);
      };
      
      this.socket?.on('bid-history', handleHistory);
      
      // Timeout after 5 seconds
      setTimeout(() => {
        this.socket?.off('bid-history', handleHistory);
        resolve([]);
      }, 5000);
    });
  }

  onNewBid(productId: string, callback: Function) {
    if (!this.bidListeners.has(productId)) {
      this.bidListeners.set(productId, []);
    }
    
    this.bidListeners.get(productId)?.push(callback);
    
    // Return cleanup function
    return () => {
      const listeners = this.bidListeners.get(productId) || [];
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }

  onConnectionChange(callback: Function) {
    this.connectionListeners.push(callback);
    
    // Return cleanup function
    return () => {
      const index = this.connectionListeners.indexOf(callback);
      if (index > -1) {
        this.connectionListeners.splice(index, 1);
      }
    };
  }

  onAuctionInfo(callback: Function) {
    this.auctionInfoListeners.push(callback);
    
    // Return cleanup function
    return () => {
      const index = this.auctionInfoListeners.indexOf(callback);
      if (index > -1) {
        this.auctionInfoListeners.splice(index, 1);
      }
    };
  }

  disconnect() {
    if (this.currentProductId) {
      this.leaveAuction(this.currentProductId);
    }
    
    this.socket?.disconnect();
    this.socket = null;
    this.bidListeners.clear();
    this.connectionListeners = [];
    this.auctionInfoListeners = [];
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

export default new SocketService();