import crypto from 'crypto';
import { getAdminDb } from '@/lib/firebaseAdmin';
import admin from 'firebase-admin';

export async function POST(req: Request) {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      userId,
      plan,
    } = await req.json();

    // Verify Razorpay signature
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return Response.json(
        { error: 'Payment verification failed' },
        { status: 400 }
      );
    }

    // Calculate expiry
    const expiresAt = new Date();
    if (plan === 'yearly') {
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);
    } else {
      expiresAt.setMonth(expiresAt.getMonth() + 1);
    }

    // Save to Firestore
    const adminDb = getAdminDb();
    await adminDb
      .collection('users')
      .doc(userId)
      .collection('subscription')
      .doc('current')
      .set({
        plan: 'premium',
        billing: plan,
        razorpay_payment_id,
        razorpay_order_id,
        started_at: admin.firestore.Timestamp.now(),
        expires_at: expiresAt.toISOString(),
        status: 'active',
      });

    return Response.json({
      success: true,
      message: 'Payment verified successfully',
    });
  } catch (error) {
    console.error('Payment verification failed:', error);
    return Response.json(
      { error: 'Verification failed' },
      { status: 500 }
    );
  }
}
