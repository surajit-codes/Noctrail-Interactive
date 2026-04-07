'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import confetti from 'canvas-confetti';
import { motion } from 'framer-motion';
import AnimatedGrid from '@/components/AnimatedGrid';

const UNLOCKED_FEATURES = [
  '🔬 Advanced AI deep analysis',
  '🤖 Portfolio AI advisor',
  '📄 PDF & Excel export',
  '💬 Unlimited AI chat',
  '📧 Priority email briefings',
];

export default function PaymentSuccess() {
  const router = useRouter();

  useEffect(() => {
    // Fire confetti on load!
    const duration = 2000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#7c3aed', '#f59e0b', '#10b981', '#00d4ff'],
      });
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#7c3aed', '#f59e0b', '#10b981', '#00d4ff'],
      });
      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();

    // Auto redirect after 5 seconds
    const timeout = setTimeout(() => router.push('/dashboard'), 5000);
    return () => clearTimeout(timeout);
  }, [router]);

  return (
    <>
      <AnimatedGrid />
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          position: 'relative',
          zIndex: 10,
        }}
      >
        <div style={{ textAlign: 'center', maxWidth: '28rem' }}>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
            style={{ fontSize: '5rem', marginBottom: '1.5rem' }}
          >
            👑
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="display-font"
            style={{
              fontSize: '2.5rem',
              fontWeight: 800,
              color: 'white',
              marginBottom: '1rem',
              background: 'linear-gradient(135deg, #eab308, #f59e0b, #fbbf24)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Welcome to Premium!
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            style={{ color: '#9ca3af', marginBottom: '2rem', fontSize: '1rem', lineHeight: 1.6 }}
          >
            Your account has been upgraded. All premium features are now unlocked!
          </motion.p>

          {/* Unlocked features list */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            style={{
              background: '#0a1628',
              border: '1px solid rgba(245,158,11,0.3)',
              borderRadius: '16px',
              padding: '1.5rem',
              marginBottom: '2rem',
              textAlign: 'left',
            }}
          >
            <h3
              style={{
                color: '#fbbf24',
                fontWeight: 600,
                marginBottom: '1rem',
                fontSize: '0.9rem',
              }}
            >
              ✨ You now have access to:
            </h3>
            {UNLOCKED_FEATURES.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + i * 0.1 }}
                style={{
                  color: '#d1d5db',
                  padding: '0.6rem 0',
                  borderBottom:
                    i < UNLOCKED_FEATURES.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                  fontSize: '0.9rem',
                }}
              >
                {f}
              </motion.div>
            ))}
          </motion.div>

          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            onClick={() => router.push('/dashboard')}
            style={{
              width: '100%',
              background: 'linear-gradient(to right, #eab308, #f59e0b)',
              color: 'black',
              fontWeight: 800,
              padding: '1rem',
              borderRadius: '12px',
              border: 'none',
              fontSize: '1.1rem',
              cursor: 'pointer',
              boxShadow: '0 10px 25px -5px rgba(245,158,11,0.3)',
              transition: 'transform 0.2s',
            }}
            onMouseEnter={(e) => {
              (e.target as HTMLElement).style.transform = 'scale(1.03)';
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLElement).style.transform = 'scale(1)';
            }}
          >
            Go to Dashboard →
          </motion.button>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            style={{ color: '#4b5563', fontSize: '0.8rem', marginTop: '1rem' }}
          >
            Redirecting automatically in 5 seconds...
          </motion.p>
        </div>
      </motion.div>
    </>
  );
}
