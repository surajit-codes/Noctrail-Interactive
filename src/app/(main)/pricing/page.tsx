'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useData } from '@/context/DataContext';
import AnimatedGrid from '@/components/AnimatedGrid';
import { t } from '@/lib/i18n';

const getFeatures = (ii: any) => ({
  free: [
    { text: ii.freeFeature1 || 'Daily AI briefing', included: true },
    { text: ii.freeFeature2 || 'Basic market data', included: true },
    { text: ii.freeFeature3 || '3 price alerts', included: true },
    { text: ii.freeFeature4 || 'News feed', included: true },
    { text: ii.freeFeature5 || 'AI Chat (3 msg/day)', included: true },
    { text: ii.freeFeature6 || 'Basic portfolio tracker', included: true },
    { text: ii.freeFeature7 || 'Advanced AI analysis', included: false },
    { text: ii.freeFeature8 || 'Portfolio AI advisor', included: false },
    { text: ii.freeFeature9 || 'PDF/Excel export', included: false },
    { text: ii.freeFeature10 || 'Unlimited AI chat', included: false },
  ],
  premium: [
    { text: ii.premiumFeature1 || 'Everything in Free', included: true },
    { text: ii.premiumFeature2 || 'Advanced AI deep analysis', included: true },
    { text: ii.premiumFeature3 || 'Portfolio AI advisor', included: true },
    { text: ii.premiumFeature4 || 'PDF & Excel export', included: true },
    { text: ii.premiumFeature5 || 'Unlimited AI chat', included: true },
    { text: ii.premiumFeature6 || 'Priority email briefings', included: true },
    { text: ii.premiumFeature7 || 'Premium badge 👑', included: true },
    { text: ii.premiumFeature8 || 'Early access to features', included: true },
  ],
});

const getFAQs = (ii: any) => [
  {
    q: ii.faqQ1 || 'Can I cancel anytime?',
    a: ii.faqA1 || 'Yes! Cancel anytime from your settings. No questions asked.',
  },
  {
    q: ii.faqQ2 || 'Is my payment secure?',
    a: ii.faqA2 || "100% secure via Razorpay, India's most trusted payment gateway.",
  },
  {
    q: ii.faqQ3 || 'What happens when I upgrade?',
    a: ii.faqA3 || 'Premium features unlock instantly after payment confirmation.',
  },
  {
    q: ii.faqQ4 || 'Do you offer refunds?',
    a: ii.faqA4 || 'Yes, we offer full refund within 7 days of purchase.',
  },
];

export default function PricingPage() {
  const { user } = useAuth();
  const { isPremium, isLoading } = useSubscription();
  const { addToast, language } = useData();
  const router = useRouter();
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('monthly');
  const [isProcessing, setIsProcessing] = useState(false);
  const ii = t(language);
  const features = getFeatures(ii);
  const faqs = getFAQs(ii);

  const handleUpgrade = async (plan: string) => {
    if (isPremium) return;

    try {
      setIsProcessing(true);

      // Create order
      const orderData = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      }).then((r) => r.json());

      if (orderData.error) {
        addToast('Failed to create order. Please try again.', 'error');
        setIsProcessing(false);
        return;
      }

      // Open Razorpay
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: 'INR',
        name: 'BriefAI',
        description: `Premium Plan - ${plan}`,
        order_id: orderData.orderId,
        image: '/logo.svg',
        prefill: {
          name: user?.displayName || '',
          email: user?.email || '',
          method: 'upi',
          vpa: 'success@razorpay',
        },
        theme: { color: '#7c3aed' },
        remember_customer: false,
        retry: { enabled: true, max_count: 3 },
        config: {
          display: {
            blocks: {
              upi: {
                name: 'Pay via UPI',
                instruments: [{ method: 'upi', flows: ['collect', 'qr'] }],
              },
              other: {
                name: 'Other Methods',
                instruments: [
                  { method: 'netbanking' },
                  { method: 'wallet' },
                ],
              },
            },
            sequence: ['block.upi', 'block.other'],
            preferences: { show_default_blocks: false },
          },
        },
        modal: {
          ondismiss: () => setIsProcessing(false),
          confirm_close: true,
        },
        handler: async (response: any) => {
          const result = await fetch('/api/payment/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...response,
              userId: user?.uid,
              plan,
            }),
          }).then((r) => r.json());

          if (result.success) {
            router.push('/payment/success');
          } else {
            addToast('Payment verification failed. Contact support.', 'error');
          }
          setIsProcessing(false);
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error('Payment error:', err);
      addToast('Payment failed. Please try again.', 'error');
      setIsProcessing(false);
    }
  };


  return (
    <>
      <AnimatedGrid />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{ minHeight: '100vh', padding: '2rem', position: 'relative', zIndex: 10 }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="display-font"
            style={{
              fontSize: '2.5rem',
              fontWeight: 800,
              color: 'white',
              marginBottom: '0.75rem',
              background: 'linear-gradient(135deg, #ffffff 0%, #a78bfa 50%, #f59e0b 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            {ii.choosePlan}
          </motion.h1>
          <p style={{ color: '#9ca3af', fontSize: '1.1rem' }}>
            {ii.unlockFullPower}
          </p>

          {/* Monthly/Yearly Toggle */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '1rem',
              marginTop: '1.5rem',
            }}
          >
            <span
              style={{
                color: billing === 'monthly' ? 'white' : '#6b7280',
                fontWeight: 600,
                fontSize: '0.9rem',
                transition: 'color 0.2s',
              }}
            >
              {ii.monthly}
            </span>
            <button
              onClick={() => setBilling(billing === 'monthly' ? 'yearly' : 'monthly')}
              style={{
                position: 'relative',
                width: '56px',
                height: '28px',
                background: billing === 'yearly'
                  ? 'linear-gradient(to right, #7c3aed, #a855f7)'
                  : 'rgba(255,255,255,0.15)',
                borderRadius: '14px',
                border: 'none',
                cursor: 'pointer',
                transition: 'background 0.3s',
                padding: 0,
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: '3px',
                  width: '22px',
                  height: '22px',
                  background: 'white',
                  borderRadius: '50%',
                  transition: 'left 0.3s ease',
                  left: billing === 'yearly' ? '31px' : '3px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                }}
              />
            </button>
            <span
              style={{
                color: billing === 'yearly' ? 'white' : '#6b7280',
                fontWeight: 600,
                fontSize: '0.9rem',
                transition: 'color 0.2s',
              }}
            >
              {ii.yearly}
              <span
                style={{
                  marginLeft: '0.5rem',
                  background: 'rgba(16,185,129,0.15)',
                  color: '#34d399',
                  fontSize: '0.7rem',
                  padding: '0.2rem 0.5rem',
                  borderRadius: '999px',
                  fontWeight: 700,
                }}
              >
                Save 30%
              </span>
            </span>
          </div>
        </div>

        {/* Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))',
            gap: '2rem',
            maxWidth: '56rem',
            margin: '0 auto',
          }}
        >
          {/* FREE CARD */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            style={{
              background: 'rgba(10,22,40,0.8)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(0,200,255,0.15)',
              borderRadius: '20px',
              padding: '2rem',
            }}
          >
            <h2
              className="display-font"
              style={{ fontSize: '1.5rem', fontWeight: 700, color: 'white', marginBottom: '0.25rem' }}
            >
              {ii.free}
            </h2>
            <p style={{ color: '#9ca3af', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
              Perfect to get started
            </p>
            <div style={{ marginBottom: '2rem' }}>
              <span style={{ fontSize: '2.5rem', fontWeight: 800, color: 'white' }}>₹0</span>
              <span style={{ fontSize: '1rem', color: '#6b7280', fontWeight: 400 }}>/month</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {features.free.map((f, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ fontSize: '0.9rem' }}>{f.included ? '✅' : '❌'}</span>
                  <span
                    style={{
                      color: f.included ? '#e5e7eb' : '#6b7280',
                      fontSize: '0.875rem',
                      textDecoration: f.included ? 'none' : 'line-through',
                    }}
                  >
                    {f.text}
                  </span>
                </div>
              ))}
            </div>

            <button
              disabled
              style={{
                width: '100%',
                marginTop: '2rem',
                padding: '0.75rem',
                borderRadius: '12px',
                border: '1px solid rgba(0,200,255,0.3)',
                background: 'transparent',
                color: isPremium ? '#6b7280' : '#22d3ee',
                fontWeight: 600,
                fontSize: '0.95rem',
                cursor: 'default',
              }}
            >
              {isPremium ? (ii.freePlan || 'Free Plan') : `✓ ${ii.currentPlanBtn || 'Current Plan'}`}
            </button>
          </motion.div>

          {/* PREMIUM CARD */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            style={{
              position: 'relative',
              background: 'rgba(10,22,40,0.8)',
              backdropFilter: 'blur(16px)',
              border: '2px solid rgba(245,158,11,0.5)',
              borderRadius: '20px',
              padding: '2rem',
              boxShadow: '0 25px 50px -12px rgba(245,158,11,0.1), 0 0 60px -15px rgba(245,158,11,0.08)',
            }}
          >
            {/* Most Popular Badge */}
            <div
              style={{
                position: 'absolute',
                top: '-14px',
                left: '50%',
                transform: 'translateX(-50%)',
              }}
            >
              <span
                style={{
                  background: 'linear-gradient(to right, #eab308, #f59e0b)',
                  color: 'black',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  padding: '0.3rem 1.25rem',
                  borderRadius: '999px',
                  letterSpacing: '0.05em',
                  whiteSpace: 'nowrap',
                }}
              >
                {ii.mostPopular}
              </span>
            </div>

            <h2
              className="display-font"
              style={{ fontSize: '1.5rem', fontWeight: 700, color: 'white', marginBottom: '0.25rem' }}
            >
              {ii.premium} 👑
            </h2>
            <p style={{ color: '#9ca3af', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
              {ii.seriousInvestors}
            </p>
            <div style={{ marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '2.5rem', fontWeight: 800, color: 'white' }}>
                {billing === 'monthly' ? '₹299' : '₹2,499'}
              </span>
              <span style={{ fontSize: '1rem', color: '#6b7280', fontWeight: 400 }}>
                {billing === 'monthly' ? ii.perMonth : ii.perYear}
              </span>
            </div>
            {billing === 'yearly' && (
              <p
                style={{
                  color: '#34d399',
                  fontSize: '0.85rem',
                  marginBottom: '1.5rem',
                  fontWeight: 600,
                }}
              >
                {ii.saveAmount}
              </p>
            )}
            {billing === 'monthly' && <div style={{ height: '1.5rem' }} />}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {features.premium.map((f, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ fontSize: '0.9rem' }}>✅</span>
                  <span style={{ color: '#e5e7eb', fontSize: '0.875rem' }}>{f.text}</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => handleUpgrade(billing)}
              disabled={isProcessing || isLoading}
              style={{
                width: '100%',
                marginTop: '2rem',
                padding: '1rem',
                borderRadius: '12px',
                border: 'none',
                fontWeight: 800,
                fontSize: '1.05rem',
                cursor: isPremium ? 'default' : 'pointer',
                color: 'black',
                background: isPremium
                  ? 'linear-gradient(to right, #22c55e, #16a34a)'
                  : 'linear-gradient(to right, #eab308, #f59e0b)',
                boxShadow: isPremium
                  ? '0 10px 25px -5px rgba(34,197,94,0.3)'
                  : '0 10px 25px -5px rgba(245,158,11,0.3)',
                transition: 'all 0.2s ease',
                opacity: isProcessing ? 0.7 : 1,
              }}
              onMouseEnter={(e) => {
                if (!isPremium) {
                  (e.target as HTMLElement).style.transform = 'scale(1.03)';
                  (e.target as HTMLElement).style.boxShadow =
                    '0 15px 35px -5px rgba(245,158,11,0.4)';
                }
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLElement).style.transform = 'scale(1)';
                (e.target as HTMLElement).style.boxShadow =
                  '0 10px 25px -5px rgba(245,158,11,0.3)';
              }}
            >
              {isProcessing
                ? `⏳ ${ii.processing}`
                : isPremium
                  ? `✅ ${ii.currentPlanBtn}`
                  : ii.getPremium}
            </button>
            <p style={{ textAlign: 'center', color: '#6b7280', fontSize: '0.75rem', marginTop: '0.75rem' }}>
              {ii.securePayment}
            </p>


          </motion.div>
        </div>

        {/* FAQ Section */}
        <div style={{ maxWidth: '40rem', margin: '4rem auto 0' }}>
          <h2
            className="display-font"
            style={{
              fontSize: '1.5rem',
              fontWeight: 700,
              color: 'white',
              textAlign: 'center',
              marginBottom: '2rem',
            }}
          >
            {ii.faqsTitle}
          </h2>
          {faqs.map((faq, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + i * 0.08 }}
              style={{
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '12px',
                padding: '1.5rem',
                marginBottom: '1rem',
                background: 'rgba(255,255,255,0.02)',
                transition: 'border-color 0.2s',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(124,58,237,0.3)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)';
              }}
            >
              <h3 style={{ color: 'white', fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.95rem' }}>
                {faq.q}
              </h3>
              <p style={{ color: '#9ca3af', fontSize: '0.875rem', lineHeight: 1.6 }}>{faq.a}</p>
            </motion.div>
          ))}
        </div>

        {/* Bottom Trust Badges */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '2rem',
            marginTop: '3rem',
            flexWrap: 'wrap',
          }}
        >
          {['🔒 256-bit SSL', '🏦 Razorpay Secure', '💯 7-day Refund', '⚡ Instant Access'].map(
            (badge, i) => (
              <span
                key={i}
                style={{
                  color: '#6b7280',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  letterSpacing: '0.05em',
                }}
              >
                {badge}
              </span>
            )
          )}
        </div>
      </motion.div>
    </>
  );
}
