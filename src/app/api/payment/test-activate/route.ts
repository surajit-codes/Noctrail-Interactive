import { getAdminDb } from '@/lib/firebaseAdmin';
import admin from 'firebase-admin';

export async function POST(req: Request) {
  try {
    const { userId, plan } = await req.json();

    if (!userId) {
      return Response.json({ error: 'userId is required' }, { status: 400 });
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
        billing: plan || 'monthly',
        razorpay_payment_id: `test_pay_${Date.now()}`,
        razorpay_order_id: `test_order_${Date.now()}`,
        started_at: admin.firestore.Timestamp.now(),
        expires_at: expiresAt.toISOString(),
        status: 'active',
      });

    return Response.json({
      success: true,
      message: 'Test payment activated — Premium unlocked!',
    });
  } catch (error) {
    console.error('Test payment failed:', error);
    return Response.json(
      { error: 'Test payment failed' },
      { status: 500 }
    );
  }
}
