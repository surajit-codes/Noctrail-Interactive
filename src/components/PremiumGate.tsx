'use client';

import { useRouter } from 'next/navigation';
import { useSubscription } from '@/hooks/useSubscription';

interface PremiumGateProps {
  children: React.ReactNode;
  feature: string;
}

export default function PremiumGate({ children, feature }: PremiumGateProps) {
  const { isPremium, isLoading } = useSubscription();
  const router = useRouter();

  if (isLoading) {
    return (
      <div
        style={{
          background: 'rgba(255,255,255,0.03)',
          borderRadius: '16px',
          height: '12rem',
          animation: 'pulse 2s cubic-bezier(0.4,0,0.6,1) infinite',
        }}
      />
    );
  }

  if (isPremium) return <>{children}</>;

  return (
    <div style={{ position: 'relative', borderRadius: '16px', overflow: 'hidden' }}>
      {/* Blurred preview */}
      <div
        style={{
          filter: 'blur(4px)',
          pointerEvents: 'none',
          userSelect: 'none',
          opacity: 0.5,
        }}
      >
        {children}
      </div>

      {/* Upgrade overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(0,0,0,0.4)',
          backdropFilter: 'blur(6px)',
        }}
      >
        <div
          style={{
            background: '#0a1628',
            border: '1px solid rgba(245,158,11,0.4)',
            borderRadius: '16px',
            padding: '2rem',
            textAlign: 'center',
            maxWidth: '24rem',
            margin: '0 1rem',
            boxShadow: '0 25px 50px -12px rgba(245,158,11,0.1)',
          }}
        >
          <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>👑</div>
          <h3
            style={{
              color: 'white',
              fontWeight: 700,
              fontSize: '1.25rem',
              marginBottom: '0.5rem',
            }}
          >
            Premium Feature
          </h3>
          <p style={{ color: '#9ca3af', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
            {feature}
          </p>
          <p style={{ color: '#6b7280', fontSize: '0.75rem', marginBottom: '1.5rem' }}>
            Upgrade to BriefAI Premium to unlock this and all other advanced features.
          </p>
          <button
            onClick={() => router.push('/pricing')}
            style={{
              width: '100%',
              background: 'linear-gradient(to right, #eab308, #f59e0b)',
              color: 'black',
              fontWeight: 700,
              padding: '0.75rem 1.5rem',
              borderRadius: '12px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.95rem',
              boxShadow: '0 10px 25px -5px rgba(245,158,11,0.3)',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              (e.target as HTMLElement).style.transform = 'scale(1.02)';
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLElement).style.transform = 'scale(1)';
            }}
          >
            Upgrade to Premium →
          </button>
          <p style={{ color: '#4b5563', fontSize: '0.75rem', marginTop: '0.75rem' }}>
            Starting at ₹299/month
          </p>
        </div>
      </div>
    </div>
  );
}
