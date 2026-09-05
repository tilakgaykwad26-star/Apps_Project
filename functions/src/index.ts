import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as crypto from 'crypto';

admin.initializeApp();
const db = admin.firestore();

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || 'rzp_test_DurgaMandalKey';
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || 'DummySecretKey123456';
const RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || 'WebhookSecret123456';

/**
 * 1. Server-Side Razorpay Order Creation
 */
export const createRazorpayOrder = functions.https.onCall(async (data, context) => {
  const { amount, donorName, donorPhone, donationType } = data;

  if (!amount || amount < 10) {
    throw new functions.https.HttpsError('invalid-argument', 'Amount must be at least Rs. 10');
  }

  try {
    const Razorpay = require('razorpay');
    const rzp = new Razorpay({
      key_id: RAZORPAY_KEY_ID,
      key_secret: RAZORPAY_KEY_SECRET,
    });

    const options = {
      amount: Math.round(amount * 100), // paise
      currency: 'INR',
      receipt: `RCPT_${Date.now()}`,
      notes: {
        donorName: donorName || 'Anonymous',
        donorPhone: donorPhone || '',
        donationType: donationType || 'general',
      },
    };

    const order = await rzp.orders.create(options);

    // Save pending record in Firestore
    await db.collection('donations').doc(order.id).set({
      amount,
      donorName: donorName || 'Anonymous',
      donorPhone: donorPhone || '',
      donationType: donationType || 'general',
      paymentStatus: 'pending',
      razorpayOrderId: order.id,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: RAZORPAY_KEY_ID,
    };
  } catch (error: any) {
    console.error('Error creating Razorpay order:', error);
    throw new functions.https.HttpsError('internal', error.message || 'Unable to create order');
  }
});

// Helper to compute Indian Financial Year (April 1 to March 31)
function getIndianFiscalYear(): string {
  const now = new Date();
  const month = now.getMonth(); // 0 = Jan, 1 = Feb, 2 = Mar
  const startYear = month < 3 ? now.getFullYear() - 1 : now.getFullYear();
  const nextYearShort = String(startYear + 1).slice(-2);
  return `${startYear}-${nextYearShort}`;
}

/**
 * 2. Server-Side HMAC-SHA256 Signature Verification
 */
export const verifyRazorpayPayment = functions.https.onCall(async (data, context) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = data;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing payment verification parameters');
  }

  // Idempotency check: prevent duplicate processing or receipt overwrites
  const donationRef = db.collection('donations').doc(razorpay_order_id);
  const existingDoc = await donationRef.get();

  if (existingDoc.exists) {
    const existingData = existingDoc.data();
    if (existingData?.paymentStatus === 'successful' && existingData?.receiptNumber) {
      return {
        success: true,
        receiptNumber: existingData.receiptNumber,
        message: 'Payment was already verified and confirmed',
        isDuplicate: true,
      };
    }
  }

  // Compute expected HMAC
  const body = razorpay_order_id + '|' + razorpay_payment_id;
  const expectedSignature = crypto
    .createHmac('sha256', RAZORPAY_KEY_SECRET)
    .update(body.toString())
    .digest('hex');

  if (expectedSignature !== razorpay_signature) {
    console.error('Signature mismatch in payment verification');
    throw new functions.https.HttpsError('permission-denied', 'Payment signature verification failed');
  }

  // Generate official fiscal receipt number (e.g. DM/2026-27/DON-XXXX)
  const fy = getIndianFiscalYear();
  const timestampPart = Date.now().toString().slice(-4);
  const randomPart = Math.floor(100 + Math.random() * 900);
  const receiptNumber = `DM/${fy}/DON-${timestampPart}${randomPart}`;

  // Atomically update donation document in Firestore
  await donationRef.set({
    paymentStatus: 'successful',
    razorpayPaymentId: razorpay_payment_id,
    razorpaySignature: razorpay_signature,
    receiptNumber,
    verifiedAt: admin.firestore.FieldValue.serverTimestamp(),
  }, { merge: true });

  // Also sync to dm_donations for client compatibility
  try {
    await db.collection('dm_donations').doc(razorpay_order_id).set({
      paymentStatus: 'successful',
      razorpayPaymentId: razorpay_payment_id,
      receiptNumber,
      verifiedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
  } catch (err) {
    console.warn('Sync to dm_donations optional warning:', err);
  }

  return {
    success: true,
    receiptNumber,
    message: 'Payment verified and official receipt generated successfully',
  };
});

/**
 * 3. Asynchronous Razorpay Webhook Endpoint
 */
export const razorpayWebhook = functions.https.onRequest(async (req, res) => {
  const signature = req.headers['x-razorpay-signature'] as string;

  if (!signature) {
    res.status(400).send('Missing signature');
    return;
  }

  // Use rawBody buffer if available for accurate HMAC verification
  const rawBody = (req as any).rawBody ? (req as any).rawBody.toString('utf8') : JSON.stringify(req.body);

  const expectedSignature = crypto
    .createHmac('sha256', RAZORPAY_WEBHOOK_SECRET)
    .update(rawBody)
    .digest('hex');

  if (expectedSignature !== signature) {
    console.error('Invalid webhook signature detected');
    res.status(400).send('Invalid signature');
    return;
  }

  const event = req.body?.event;
  const payload = req.body?.payload;

  if (event === 'payment.captured' && payload?.payment?.entity) {
    const payment = payload.payment.entity;
    const orderId = payment.order_id;

    if (orderId) {
      const docRef = db.collection('donations').doc(orderId);
      const docSnap = await docRef.get();
      const existingData = docSnap.exists ? docSnap.data() : null;

      if (!existingData || existingData.paymentStatus !== 'successful') {
        const fy = getIndianFiscalYear();
        const receiptNumber = existingData?.receiptNumber || `DM/${fy}/DON-${Date.now().toString().slice(-6)}`;
        
        await docRef.set(
          {
            paymentStatus: 'successful',
            razorpayPaymentId: payment.id,
            amount: payment.amount / 100,
            receiptNumber,
            capturedAt: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
      }
    }
  }

  res.status(200).json({ status: 'ok' });
});

/**
 * 4. Push Notification Broadcast via FCM
 */
export const sendNoticeBroadcast = functions.firestore
  .document('notices/{noticeId}')
  .onCreate(async (snap, context) => {
    const notice = snap.data();
    if (!notice || !notice.isPublished) return;

    if (notice.priority === 'urgent' || notice.priority === 'important') {
      const message: admin.messaging.Message = {
        topic: 'mandal_notices',
        notification: {
          title: `दुर्गा मंडळ — ${notice.priority === 'urgent' ? 'तात्काळ सूचना' : 'महत्त्वाची सूचना'}`,
          body: notice.titleMarathi || notice.title,
        },
        data: {
          noticeId: context.params.noticeId,
          priority: notice.priority,
        },
      };

      try {
        await admin.messaging().send(message);
        console.log('FCM broadcast notification sent successfully for notice:', context.params.noticeId);
      } catch (err) {
        console.error('Error sending FCM notification:', err);
      }
    }
  });
