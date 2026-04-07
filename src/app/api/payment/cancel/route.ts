import { getAdminDb } from '@/lib/firebaseAdmin';

export async function POST(req: Request) {
  try {
    const { userId } = await req.json();

    if (!userId) {
      return Response.json({ error: 'userId is required' }, { status: 400 });
    }

    const adminDb = getAdminDb();

    // Set subscription status to cancelled
    await adminDb
      .collection('users')
      .doc(userId)
      .collection('subscription')
      .doc('current')
      .set({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
      }, { merge: true });

    return Response.json({
      success: true,
      message: 'Subscription cancelled successfully.',
    });
  } catch (error) {
    console.error('Cancel subscription failed:', error);
    return Response.json(
      { error: 'Failed to cancel subscription' },
      { status: 500 }
    );
  }
}
