import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Zap } from 'lucide-react';
import { useSubscription } from '../../contexts/SubscriptionContext';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  featureName?: string;
}

const FREE_FEATURES = [
  'Chat with CareerMind AI',
  'Real-time job search',
  'Career advice & guidance',
  'Explore career paths',
];

const PRO_FEATURES = [
  'Everything in Free',
  'Help Me Apply (AI assistant)',
  'Resume Builder with AI',
  'Cover Letter Writer',
  'Application Form Helper',
  'Track Applications & reminders',
  'Save conversations across devices',
  'Priority AI responses',
];

export default function UpgradeModal({ isOpen, onClose, featureName }: UpgradeModalProps) {
  const { openCheckout } = useSubscription();

  const handleUpgrade = () => {
    openCheckout();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50"
            style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
            onClick={onClose}
          />

          {/* Centered container */}
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={onClose}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="w-full max-w-lg"
              onClick={e => e.stopPropagation()}
            >
              <div className="rounded-3xl overflow-hidden" style={{ background: '#FFFFFF', boxShadow: '0 32px 80px rgba(0,0,0,0.25)' }}>

                {/* Header */}
                <div className="px-6 pt-6 pb-4 flex items-start justify-between">
                  <div>
                    {featureName && (
                      <p className="text-xs font-semibold mb-1" style={{ color: '#0095FF' }}>
                        PRO FEATURE
                      </p>
                    )}
                    <h2 className="text-xl font-bold" style={{ color: '#111', fontFamily: 'Sora, sans-serif' }}>
                      {featureName ? `Unlock ${featureName}` : 'Upgrade to Pro'}
                    </h2>
                    {featureName && (
                      <p className="text-sm mt-1" style={{ color: '#666' }}>
                        This feature requires a Pro subscription.
                      </p>
                    )}
                  </div>
                  <button
                    onClick={onClose}
                    className="p-1.5 rounded-full shrink-0"
                    style={{ background: '#FFFFFF', color: '#888' }}
                  >
                    <X size={15} />
                  </button>
                </div>

                {/* Plans */}
                <div className="px-6 pb-4 grid grid-cols-2 gap-4">

                  {/* Free Plan */}
                  <div className="rounded-2xl p-4" style={{ background: '#FFFFFF', border: '1px solid #E5E5E5' }}>
                    <p className="text-xs font-semibold mb-1" style={{ color: '#888' }}>FREE</p>
                    <p className="text-2xl font-bold mb-3" style={{ color: '#111' }}>$0</p>
                    <div className="space-y-2">
                      {FREE_FEATURES.map(f => (
                        <div key={f} className="flex items-start gap-2">
                          <Check size={13} className="shrink-0 mt-0.5" style={{ color: '#22C55E' }} />
                          <span className="text-xs" style={{ color: '#444' }}>{f}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Pro Plan */}
                  <div className="rounded-2xl p-4 relative" style={{ background: '#0095FF' }}>
                    <div
                      className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap"
                      style={{ background: '#111', color: '#FFFFFF' }}
                    >
                      RECOMMENDED
                    </div>
                    <p className="text-xs font-semibold mb-1" style={{ color: 'rgba(255,255,255,0.7)' }}>PRO</p>
                    <div className="flex items-baseline gap-1 mb-3">
                      <p className="text-2xl font-bold" style={{ color: '#FFFFFF' }}>$3</p>
                      <p className="text-xs" style={{ color: 'rgba(255,255,255,0.7)' }}>/month</p>
                    </div>
                    <div className="space-y-2">
                      {PRO_FEATURES.map(f => (
                        <div key={f} className="flex items-start gap-2">
                          <Check size={13} className="shrink-0 mt-0.5" style={{ color: '#FFFFFF' }} />
                          <span className="text-xs" style={{ color: 'rgba(255,255,255,0.9)' }}>{f}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* CTA */}
                <div className="px-6 pb-6">
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={handleUpgrade}
                    className="w-full py-3.5 rounded-2xl text-sm font-bold flex items-center justify-center gap-2"
                    style={{ background: '#0095FF', color: '#FFFFFF', boxShadow: '0 4px 20px rgba(0,149,255,0.3)' }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#007ACC'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = '#0095FF'; }}
                  >
                    <Zap size={16} />
                    Upgrade to Pro — $3/month
                  </motion.button>
                  <p className="text-center text-xs mt-2" style={{ color: '#AAA' }}>
                    Cancel anytime · Secure payment via Polar
                  </p>
                </div>

              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}










