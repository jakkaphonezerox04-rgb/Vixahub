const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

// TMWEasy Webhook Handler
exports.tmweasyWebhook = functions.https.onRequest(async (req, res) => {
  // Enable CORS
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  try {
    console.log('📥 TMWEasy Webhook received:', req.body);
    
    const {
      Status,
      Amount,
      ref1,          // User ID/Username
      transactionid, // Transaction ID
      Msg,
      timestamp
    } = req.body;

    // Validate required fields
    if (!ref1) {
      return res.status(400).json({
        success: false,
        error: 'Missing ref1 (user identifier)'
      });
    }

    // Handle successful payment
    if (Status === 'check_success' && Amount) {
      const amount = parseFloat(Amount);
      const creditToAdd = amount * 10; // 10x multiplier (like original PHP: $mul=1, but we use 10x)

      try {
        // Update user credit in Firebase
        const userRef = db.collection('users').doc(ref1);
        const userDoc = await userRef.get();

        if (!userDoc.exists) {
          // Create new user if doesn't exist
          await userRef.set({
            username: ref1,
            credit: creditToAdd,
            totalTopup: amount,
            lastTopupDate: admin.firestore.Timestamp.now(),
            transactions: []
          });
        } else {
          // Update existing user
          await userRef.update({
            credit: admin.firestore.FieldValue.increment(creditToAdd),
            totalTopup: admin.firestore.FieldValue.increment(amount),
            lastTopupDate: admin.firestore.Timestamp.now()
          });
        }

        // Log transaction
        const transactionRef = db.collection('transactions').doc();
        await transactionRef.set({
          userId: ref1,
          amount: amount,
          credit: creditToAdd,
          transactionId: transactionid || `auto_${Date.now()}`,
          status: 'success',
          method: 'bank_transfer',
          bank: 'kbank', // กสิกรไทย
          timestamp: admin.firestore.Timestamp.now(),
          webhookData: req.body
        });

        console.log(`✅ Payment processed: ${ref1} +${creditToAdd} credits (${amount} THB)`);

        return res.json({
          success: true,
          message: 'Payment processed successfully',
          data: {
            userId: ref1,
            amount: amount,
            credit: creditToAdd,
            transactionId: transactionid
          }
        });

      } catch (dbError) {
        console.error('❌ Database error:', dbError);
        return res.status(500).json({
          success: false,
          error: 'Database update failed',
          details: dbError.message
        });
      }

    } else {
      // Handle failed payment
      console.log(`⚠️ Payment failed: ${ref1} - ${Msg || 'Unknown error'}`);

      // Log failed transaction
      if (ref1) {
        const transactionRef = db.collection('transactions').doc();
        await transactionRef.set({
          userId: ref1,
          amount: Amount || 0,
          status: 'failed',
          method: 'bank_transfer',
          bank: 'kbank',
          error: Msg || 'Payment verification failed',
          timestamp: admin.firestore.Timestamp.now(),
          webhookData: req.body
        });
      }

      return res.json({
        success: false,
        message: Msg || 'Payment verification failed',
        status: Status
      });
    }

  } catch (error) {
    console.error('❌ Webhook error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
});

// Manual payment confirmation endpoint
exports.confirmPayment = functions.https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      userId, 
      amount, 
      transactionId, 
      bankAccount = '0488510843' 
    } = req.body;

    if (!userId || !amount || !transactionId) {
      return res.status(400).json({
        error: 'Missing required fields: userId, amount, transactionId'
      });
    }

    // Simulate TMWEasy API call for manual confirmation
    const tmweasyData = {
      Status: 'check_success',
      Amount: amount,
      ref1: userId,
      transactionid: transactionId,
      timestamp: new Date().toISOString()
    };

    // Process the payment using the same webhook logic
    req.body = tmweasyData;
    return exports.tmweasyWebhook(req, res);

  } catch (error) {
    console.error('❌ Manual confirmation error:', error);
    return res.status(500).json({
      error: 'Confirmation failed',
      details: error.message
    });
  }
});

// Get user credit endpoint
exports.getUserCredit = functions.https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  
  const { userId } = req.query;
  
  if (!userId) {
    return res.status(400).json({ error: 'Missing userId parameter' });
  }

  try {
    const userDoc = await db.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      return res.json({
        success: true,
        data: {
          userId,
          credit: 0,
          totalTopup: 0,
          exists: false
        }
      });
    }

    const userData = userDoc.data();
    return res.json({
      success: true,
      data: {
        userId,
        credit: userData.credit || 0,
        totalTopup: userData.totalTopup || 0,
        lastTopupDate: userData.lastTopupDate,
        exists: true
      }
    });

  } catch (error) {
    console.error('❌ Get credit error:', error);
    return res.status(500).json({
      error: 'Failed to get user credit',
      details: error.message
    });
  }
}); 