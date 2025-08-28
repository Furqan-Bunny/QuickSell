const admin = require('firebase-admin');
const emailService = require('./emailService');

const db = admin.firestore();

class AuctionScheduler {
  constructor() {
    this.checkInterval = null;
  }

  // Start the scheduler
  start() {
    // Check for expired auctions every minute
    this.checkInterval = setInterval(() => {
      this.checkExpiredAuctions();
    }, 60000); // 1 minute

    // Initial check on startup
    this.checkExpiredAuctions();
    
    console.log('Auction scheduler started');
  }

  // Stop the scheduler
  stop() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
      console.log('Auction scheduler stopped');
    }
  }

  // Check for expired auctions and process them
  async checkExpiredAuctions() {
    try {
      const now = new Date();
      
      // Find all active auctions that have ended
      const expiredProductsSnapshot = await db.collection('products')
        .where('status', '==', 'active')
        .where('endDate', '<=', now)
        .get();

      if (expiredProductsSnapshot.empty) {
        return;
      }

      console.log(`Found ${expiredProductsSnapshot.size} expired auctions to process`);

      // Process each expired auction
      for (const doc of expiredProductsSnapshot.docs) {
        await this.processExpiredAuction(doc.id, doc.data());
      }
    } catch (error) {
      console.error('Error checking expired auctions:', error);
    }
  }

  // Process a single expired auction
  async processExpiredAuction(productId, product) {
    try {
      console.log(`Processing expired auction: ${product.title} (${productId})`);

      // Get the highest bid
      const highestBidSnapshot = await db.collection('bids')
        .where('productId', '==', productId)
        .where('status', '==', 'active')
        .orderBy('amount', 'desc')
        .limit(1)
        .get();

      let updates = {
        status: 'ended',
        endedAt: admin.firestore.FieldValue.serverTimestamp()
      };

      if (!highestBidSnapshot.empty) {
        const highestBid = highestBidSnapshot.docs[0].data();
        
        // Set winner information
        updates.winnerId = highestBid.userId;
        updates.winnerName = highestBid.userName;
        updates.finalPrice = highestBid.amount;
        updates.status = 'sold';

        // Update product
        await db.collection('products').doc(productId).update(updates);

        // Create order for the winner
        const orderData = {
          productId,
          productTitle: product.title,
          productImage: product.images?.[0] || '',
          sellerId: product.sellerId,
          sellerName: product.sellerName,
          buyerId: highestBid.userId,
          buyerName: highestBid.userName,
          amount: highestBid.amount,
          status: 'pending_payment',
          paymentMethod: null,
          shippingAddress: null,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };

        const orderRef = await db.collection('orders').add(orderData);
        console.log(`Created order ${orderRef.id} for auction ${productId}`);

        // Send winner notification email
        try {
          const winnerDoc = await db.collection('users').doc(highestBid.userId).get();
          if (winnerDoc.exists) {
            const winner = winnerDoc.data();
            await emailService.sendAuctionWonNotification(
              winner,
              product,
              highestBid.amount
            );
            console.log(`Sent winner notification to ${winner.email}`);
          }
        } catch (emailError) {
          console.error('Error sending winner notification:', emailError);
        }

        // Update all other bids to 'lost' status
        const losingBidsSnapshot = await db.collection('bids')
          .where('productId', '==', productId)
          .where('status', 'in', ['active', 'outbid'])
          .get();

        const batch = db.batch();
        losingBidsSnapshot.forEach(doc => {
          if (doc.id !== highestBidSnapshot.docs[0].id) {
            batch.update(doc.ref, {
              status: 'lost',
              updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
          }
        });
        
        // Update winning bid status
        batch.update(highestBidSnapshot.docs[0].ref, {
          status: 'won',
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        
        await batch.commit();
        console.log(`Updated bid statuses for auction ${productId}`);
      } else {
        // No bids - auction ended without winner
        updates.status = 'ended_no_bids';
        await db.collection('products').doc(productId).update(updates);
        console.log(`Auction ${productId} ended with no bids`);
      }
    } catch (error) {
      console.error(`Error processing expired auction ${productId}:`, error);
    }
  }

  // Manually end an auction (called from admin endpoint)
  async endAuctionManually(productId) {
    try {
      const productDoc = await db.collection('products').doc(productId).get();
      
      if (!productDoc.exists) {
        throw new Error('Product not found');
      }

      const product = productDoc.data();
      
      if (product.status !== 'active') {
        throw new Error('Auction is not active');
      }

      await this.processExpiredAuction(productId, product);
      return { success: true, message: 'Auction ended successfully' };
    } catch (error) {
      console.error('Error manually ending auction:', error);
      throw error;
    }
  }
}

module.exports = new AuctionScheduler();