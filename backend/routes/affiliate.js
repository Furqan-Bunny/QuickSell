const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const { authMiddleware: auth } = require('../middleware/auth');
const crypto = require('crypto');
const { sendTemplatedEmail } = require('../utils/brevoEmail');

const db = admin.firestore();

// Generate unique referral code
const generateReferralCode = () => {
  return crypto.randomBytes(8).toString('hex');
};

// Send invitation email
router.post('/invite', auth, async (req, res) => {
  try {
    const { email, name } = req.body;
    const inviterId = req.user.uid;
    
    console.log('Invite request:', { email, name, inviterId, userEmail: req.user.email });

    // Check if email is already registered
    const existingUser = await admin.auth().getUserByEmail(email).catch((error) => {
      console.log('User lookup error (expected if not exists):', error.code);
      return null;
    });
    if (existingUser) {
      console.log('User already exists:', email);
      return res.status(400).json({ error: 'User already exists' });
    }

    // Check if invitation already sent
    const existingInvite = await db.collection('invitations')
      .where('inviterEmail', '==', req.user.email)
      .where('inviteeEmail', '==', email)
      .where('status', '==', 'pending')
      .get();

    if (!existingInvite.empty) {
      console.log('Invitation already sent to:', email);
      return res.status(400).json({ error: 'Invitation already sent to this email' });
    }

    // Generate referral code
    const referralCode = generateReferralCode();

    // Create invitation record
    const invitation = {
      inviterId,
      inviterEmail: req.user.email,
      inviterName: req.user.displayName || req.user.email,
      inviteeEmail: email,
      inviteeName: name || '',
      referralCode,
      status: 'pending',
      reward: 5, // 5 ZAR reward
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    };

    await db.collection('invitations').add(invitation);

    // Send invitation email using Brevo template
    const inviteLink = `${process.env.FRONTEND_URL}/signup?ref=${referralCode}`;
    console.log('Frontend URL:', process.env.FRONTEND_URL);
    console.log('Invite link:', inviteLink);
    
    await sendTemplatedEmail('invitation', {
      to: email,
      name: name || email,
      inviterName: invitation.inviterName,
      inviteeName: name || 'there',
      inviteLink,
      replyTo: req.user.email
    });

    res.json({ message: 'Invitation sent successfully' });
  } catch (error) {
    console.error('Error sending invitation:', error);
    res.status(500).json({ error: 'Failed to send invitation' });
  }
});

// Get user's invitations
router.get('/invitations', auth, async (req, res) => {
  try {
    // First get all invitations for the user without ordering
    const invitations = await db.collection('invitations')
      .where('inviterId', '==', req.user.uid)
      .get();

    const invitationList = [];
    invitations.forEach(doc => {
      const data = doc.data();
      invitationList.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        expiresAt: data.expiresAt?.toDate ? data.expiresAt.toDate() : data.expiresAt
      });
    });

    // Sort in memory instead of using Firestore orderBy
    invitationList.sort((a, b) => b.createdAt - a.createdAt);

    res.json(invitationList);
  } catch (error) {
    console.error('Error fetching invitations:', error);
    res.status(500).json({ error: 'Failed to fetch invitations' });
  }
});

// Validate referral code
router.get('/validate/:code', async (req, res) => {
  try {
    const { code } = req.params;

    const invitationSnapshot = await db.collection('invitations')
      .where('referralCode', '==', code)
      .where('status', '==', 'pending')
      .limit(1)
      .get();

    if (invitationSnapshot.empty) {
      return res.status(404).json({ valid: false, error: 'Invalid or expired referral code' });
    }

    const invitation = invitationSnapshot.docs[0].data();
    
    // Check if expired
    if (invitation.expiresAt.toDate() < new Date()) {
      return res.status(400).json({ valid: false, error: 'Invitation has expired' });
    }

    res.json({
      valid: true,
      inviterName: invitation.inviterName,
      inviterEmail: invitation.inviterEmail
    });
  } catch (error) {
    console.error('Error validating referral:', error);
    res.status(500).json({ error: 'Failed to validate referral code' });
  }
});

// Process referral on signup
router.post('/process-referral', async (req, res) => {
  try {
    const { referralCode, newUserId } = req.body;

    if (!referralCode || !newUserId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Find the invitation
    const invitationSnapshot = await db.collection('invitations')
      .where('referralCode', '==', referralCode)
      .where('status', '==', 'pending')
      .limit(1)
      .get();

    if (invitationSnapshot.empty) {
      return res.status(404).json({ error: 'Invalid referral code' });
    }

    const invitationDoc = invitationSnapshot.docs[0];
    const invitation = invitationDoc.data();

    // Check if expired
    if (invitation.expiresAt.toDate() < new Date()) {
      return res.status(400).json({ error: 'Invitation has expired' });
    }

    // Start transaction
    await db.runTransaction(async (transaction) => {
      // Update invitation status
      transaction.update(invitationDoc.ref, {
        status: 'completed',
        completedAt: admin.firestore.FieldValue.serverTimestamp(),
        inviteeId: newUserId
      });

      // Add reward to inviter's balance
      const inviterRef = db.collection('users').doc(invitation.inviterId);
      const inviterDoc = await transaction.get(inviterRef);
      
      if (inviterDoc.exists) {
        const currentBalance = inviterDoc.data().balance || 0;
        transaction.update(inviterRef, {
          balance: currentBalance + invitation.reward
        });

        // Create transaction record
        const transactionData = {
          userId: invitation.inviterId,
          type: 'referral_reward',
          amount: invitation.reward,
          description: `Referral reward for inviting ${invitation.inviteeEmail}`,
          referralCode,
          inviteeId: newUserId,
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        };
        
        transaction.create(db.collection('transactions').doc(), transactionData);
      }

      // Track referral for new user
      const newUserRef = db.collection('users').doc(newUserId);
      transaction.update(newUserRef, {
        referredBy: invitation.inviterId,
        referralCode: referralCode
      });
    });

    // Send notification email to inviter using Brevo template
    await sendTemplatedEmail('referralSuccess', {
      to: invitation.inviterEmail,
      name: invitation.inviterName,
      inviteeEmail: invitation.inviteeEmail,
      dashboardLink: `${process.env.FRONTEND_URL}/dashboard`,
      affiliateLink: `${process.env.FRONTEND_URL}/affiliate`
    });

    res.json({ message: 'Referral processed successfully' });
  } catch (error) {
    console.error('Error processing referral:', error);
    res.status(500).json({ error: 'Failed to process referral' });
  }
});

// Get referral statistics
router.get('/stats', auth, async (req, res) => {
  try {
    const userId = req.user.uid;

    // Get all invitations
    const invitations = await db.collection('invitations')
      .where('inviterId', '==', userId)
      .get();

    let pending = 0;
    let completed = 0;
    let totalEarned = 0;

    invitations.forEach(doc => {
      const data = doc.data();
      if (data.status === 'pending') {
        // Check if expired
        const expiresAt = data.expiresAt?.toDate ? data.expiresAt.toDate() : data.expiresAt;
        if (expiresAt && new Date(expiresAt) < new Date()) {
          // Expired, don't count as pending
        } else {
          pending++;
        }
      } else if (data.status === 'completed') {
        completed++;
        totalEarned += data.reward || 0;
      }
    });

    res.json({
      totalInvitations: invitations.size,
      pending,
      completed,
      totalEarned
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

module.exports = router;