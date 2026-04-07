import Razorpay from 'razorpay';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(req: Request) {
  try {
    const { plan } = await req.json();
    const amount = plan === 'yearly' ? 249900 : 29900;

    const order = await razorpay.orders.create({
      amount,
      currency: 'INR',
      receipt: `briefai_${Date.now()}`,
      notes: { plan, product: 'BriefAI Premium' },
    });

    return Response.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      plan,
    });
  } catch (error) {
    console.error('Razorpay order creation failed:', error);
    return Response.json(
      { error: 'Order creation failed' },
      { status: 500 }
    );
  }
}
