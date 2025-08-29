const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const emailService = require('../services/emailService');

const db = admin.firestore();

// Create withdrawal request
router.post('/request', authMiddleware, async (req, res) => {
  try {
    const { amount, bankDetails, notes } = req.body;
    const userId = req.user.uid;
    
    // Validate input
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid withdrawal amount' });
    }
    
    if (!bankDetails || !bankDetails.accountNumber || !bankDetails.bankName) {
      return res.status(400).json({ error: 'Bank details are required' });
    }
    
    // Get user details
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const userData = userDoc.data();
    
    // Check user balance
    if (userData.balance < amount) {
      return res.status(400).json({ 
        error: `Insufficient balance. Available: R${userData.balance}` 
      });
    }
    
    // Check for pending withdrawals
    const pendingWithdrawals = await db.collection('withdrawals')
      .where('userId', '==', userId)
      .where('status', '==', 'pending')
      .get();
    
    if (!pendingWithdrawals.empty) {
      return res.status(400).json({ 
        error: 'You have a pending withdrawal request. Please wait for it to be processed.' 
      });
    }
    
    // Create withdrawal request
    const withdrawalData = {
      userId,
      userEmail: userData.email,
      userName: `${userData.firstName} ${userData.lastName}`,
      amount,
      bankDetails: {
        accountNumber: bankDetails.accountNumber,
        bankName: bankDetails.bankName,
        accountHolder: bankDetails.accountHolder || userData.firstName + ' ' + userData.lastName,
        branchCode: bankDetails.branchCode || '',
        accountType: bankDetails.accountType || 'Savings'
      },
      notes: notes || '',
      status: 'pending',
      requestedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    // Use transaction to ensure consistency
    await db.runTransaction(async (transaction) => {
      const withdrawalRef = db.collection('withdrawals').doc();
      
      // Create withdrawal request
      transaction.set(withdrawalRef, withdrawalData);
      
      // Deduct amount from user balance (hold the funds)
      transaction.update(userDoc.ref, {
        balance: admin.firestore.FieldValue.increment(-amount),
        heldBalance: admin.firestore.FieldValue.increment(amount),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      withdrawalData.id = withdrawalRef.id;
    });
    
    // Send email notification to user
    try {
      await emailService.sendWithdrawalRequest(userData, withdrawalData);
    } catch (emailError) {
      console.error('Error sending withdrawal request email:', emailError);
    }
    
    res.status(201).json({
      success: true,
      message: 'Withdrawal request submitted successfully',
      data: withdrawalData
    });
  } catch (error) {
    console.error('Error creating withdrawal request:', error);
    res.status(500).json({ error: 'Failed to create withdrawal request' });
  }
});

// Get user's withdrawal history
router.get('/my-withdrawals', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.uid;
    const { status } = req.query;
    
    let query = db.collection('withdrawals')
      .where('userId', '==', userId);
    
    if (status) {
      query = query.where('status', '==', status);
    }
    
    let snapshot;
    try {
      // Try with orderBy first
      snapshot = await query
        .orderBy('requestedAt', 'desc')
        .get();
    } catch (indexError) {
      console.log('Withdrawals orderBy failed, using fallback:', indexError.message);
      // Fallback without ordering if index is missing
      snapshot = await query.get();
    }
    
    const withdrawals = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    res.json({
      success: true,
      data: withdrawals
    });
  } catch (error) {
    console.error('Error fetching withdrawals:', error);
    res.status(500).json({ error: 'Failed to fetch withdrawal history' });
  }
});

// Admin: Get all withdrawal requests
router.get('/admin/all', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { status } = req.query;
    
    let query = db.collection('withdrawals');
    
    if (status) {
      query = query.where('status', '==', status);
    }
    
    let snapshot;
    try {
      // Try with orderBy first
      snapshot = await query
        .orderBy('requestedAt', 'desc')
        .get();
    } catch (indexError) {
      console.log('Admin withdrawals orderBy failed, using fallback:', indexError.message);
      // Fallback without ordering if index is missing
      snapshot = await query.get();
    }
    
    const withdrawals = [];
    for (const doc of snapshot.docs) {
      const withdrawal = { id: doc.id, ...doc.data() };
      
      // Get user details
      const userDoc = await db.collection('users').doc(withdrawal.userId).get();
      if (userDoc.exists) {
        withdrawal.user = userDoc.data();
      }
      
      withdrawals.push(withdrawal);
    }
    
    res.json({
      success: true,
      data: withdrawals
    });
  } catch (error) {
    console.error('Error fetching admin withdrawals:', error);
    res.status(500).json({ error: 'Failed to fetch withdrawals' });
  }
});

// Admin: Approve withdrawal
router.post('/admin/approve/:withdrawalId', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { withdrawalId } = req.params;
    const { transactionReference, notes } = req.body;
    const adminId = req.user.uid;
    
    const withdrawalDoc = await db.collection('withdrawals').doc(withdrawalId).get();
    
    if (!withdrawalDoc.exists) {
      return res.status(404).json({ error: 'Withdrawal request not found' });
    }
    
    const withdrawal = withdrawalDoc.data();
    
    if (withdrawal.status !== 'pending') {
      return res.status(400).json({ error: 'This withdrawal has already been processed' });
    }
    
    // Get user details
    const userDoc = await db.collection('users').doc(withdrawal.userId).get();
    const userData = userDoc.data();
    
    // Update withdrawal status
    await db.runTransaction(async (transaction) => {
      // Update withdrawal
      transaction.update(withdrawalDoc.ref, {
        status: 'approved',
        approvedBy: adminId,
        approvedAt: admin.firestore.FieldValue.serverTimestamp(),
        transactionReference: transactionReference || '',
        adminNotes: notes || '',
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      // Update user's held balance (remove from held since it's approved)
      transaction.update(userDoc.ref, {
        heldBalance: admin.firestore.FieldValue.increment(-withdrawal.amount),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      // Create transaction record
      const transactionRef = db.collection('transactions').doc();
      transaction.set(transactionRef, {
        userId: withdrawal.userId,
        type: 'withdrawal',
        amount: -withdrawal.amount,
        status: 'completed',
        description: `Withdrawal to ${withdrawal.bankDetails.bankName} account`,
        reference: transactionReference || '',
        withdrawalId: withdrawalId,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
    });
    
    // Send email notification
    try {
      await emailService.sendWithdrawalApproved(userData, withdrawal, transactionReference);
    } catch (emailError) {
      console.error('Error sending approval email:', emailError);
    }
    
    res.json({
      success: true,
      message: 'Withdrawal approved successfully'
    });
  } catch (error) {
    console.error('Error approving withdrawal:', error);
    res.status(500).json({ error: 'Failed to approve withdrawal' });
  }
});

// Admin: Reject withdrawal
router.post('/admin/reject/:withdrawalId', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { withdrawalId } = req.params;
    const { reason } = req.body;
    const adminId = req.user.uid;
    
    if (!reason) {
      return res.status(400).json({ error: 'Rejection reason is required' });
    }
    
    const withdrawalDoc = await db.collection('withdrawals').doc(withdrawalId).get();
    
    if (!withdrawalDoc.exists) {
      return res.status(404).json({ error: 'Withdrawal request not found' });
    }
    
    const withdrawal = withdrawalDoc.data();
    
    if (withdrawal.status !== 'pending') {
      return res.status(400).json({ error: 'This withdrawal has already been processed' });
    }
    
    // Get user details
    const userDoc = await db.collection('users').doc(withdrawal.userId).get();
    const userData = userDoc.data();
    
    // Update withdrawal status and refund balance
    await db.runTransaction(async (transaction) => {
      // Update withdrawal
      transaction.update(withdrawalDoc.ref, {
        status: 'rejected',
        rejectedBy: adminId,
        rejectedAt: admin.firestore.FieldValue.serverTimestamp(),
        rejectionReason: reason,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      // Refund the amount back to user's available balance
      transaction.update(userDoc.ref, {
        balance: admin.firestore.FieldValue.increment(withdrawal.amount),
        heldBalance: admin.firestore.FieldValue.increment(-withdrawal.amount),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    });
    
    // Send email notification
    try {
      await emailService.sendWithdrawalRejected(userData, withdrawal, reason);
    } catch (emailError) {
      console.error('Error sending rejection email:', emailError);
    }
    
    res.json({
      success: true,
      message: 'Withdrawal rejected successfully'
    });
  } catch (error) {
    console.error('Error rejecting withdrawal:', error);
    res.status(500).json({ error: 'Failed to reject withdrawal' });
  }
});

// Cancel withdrawal request (by user)
router.delete('/:withdrawalId', authMiddleware, async (req, res) => {
  try {
    const { withdrawalId } = req.params;
    const userId = req.user.uid;
    
    const withdrawalDoc = await db.collection('withdrawals').doc(withdrawalId).get();
    
    if (!withdrawalDoc.exists) {
      return res.status(404).json({ error: 'Withdrawal request not found' });
    }
    
    const withdrawal = withdrawalDoc.data();
    
    // Check ownership
    if (withdrawal.userId !== userId) {
      return res.status(403).json({ error: 'You can only cancel your own withdrawal requests' });
    }
    
    // Check status
    if (withdrawal.status !== 'pending') {
      return res.status(400).json({ error: 'Only pending withdrawals can be cancelled' });
    }
    
    // Cancel and refund
    await db.runTransaction(async (transaction) => {
      // Update withdrawal
      transaction.update(withdrawalDoc.ref, {
        status: 'cancelled',
        cancelledAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      // Refund to available balance
      const userRef = db.collection('users').doc(userId);
      transaction.update(userRef, {
        balance: admin.firestore.FieldValue.increment(withdrawal.amount),
        heldBalance: admin.firestore.FieldValue.increment(-withdrawal.amount),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    });
    
    res.json({
      success: true,
      message: 'Withdrawal request cancelled successfully'
    });
  } catch (error) {
    console.error('Error cancelling withdrawal:', error);
    res.status(500).json({ error: 'Failed to cancel withdrawal' });
  }
});

module.exports = router;