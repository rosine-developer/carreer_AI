import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface TourStep {
  selector: string;
  buttonLabel: string;
  label: string;
  duration: number;
  position?: 'top' | 'bottom' | 'right' | 'left';
}

const TOUR_STEPS: TourStep[] = [
  {
    selector: '[data-tour="new-chat"]',
    buttonLabel: '+ New Chat',
    label: 'Start a new conversation anytime',
    duration: 2800,
    position: 'right',
  },
  {
    selector: '[data-tour="track-apps"]',
    buttonLabel: 'Track Applications',
    label: 'Track all your job applications here',
    duration: 2800,
    position: 'right',
  },
  {
    selector: '[data-tour="manage-profile"]',
    buttonLabel: 'Manage Profile',
    label: 'Set up your profile so AI can personalize results',
    duration: 2800,
    position: 'right',
  },
  {
    selector: '[data-tour="build-resume"]',
    buttonLabel: 'Build Resume',
    label: 'Build a professional resume with AI help',
    duration: 2800,
    position: 'right',
  },
  {
    selector: '[data-tour="cover-letter"]',
    buttonLabel: 'Cover Letter',
    label: 'Generate a cover letter for any job',
    duration: 2800,
    position: 'right',
  },
  {
    selector: '[data-tour="chat-input"]',
    buttonLabel: 'Message CareerMind AI...',
    label: 'Type your question — ask for jobs, advice, anything!',
    duration: 3200,
    position: 'top',
  },
];

interface Coords { x: number; y: number; width: number; height: number; }

interface DiscoveryAnimationProps {
  onDismiss: () => void;
  onEnsureSidebarOpen?: () => void;
}

export default function DiscoveryAnimation({ onDismiss, onEnsureSidebarOpen }: DiscoveryAnimationProps) {
  const [step, setStep] = useState(0);
  const [coords, setCoords] = useState<Coords | null>(null);
  const [ready, setReady] = useState(false);
  const [gone, setGone] = useState(false);

  // Wait for page to fully paint, then open sidebar and start tour
  useEffect(() => {
    const t = setTimeout(() => {
      onEnsureSidebarOpen?.();
      setTimeout(() => setReady(true), 400); // extra wait for sidebar animation
    }, 2000);
    return () => clearTimeout(t);
  }, []);

  // Measure element position for current step
  useEffect(() => {
    if (!ready) return;
    const t = setTimeout(() => {
      const el = document.querySelector(TOUR_STEPS[step].selector) as HTMLElement;
      if (el) {
        const r = el.getBoundingClientRect();
        setCoords({ x: r.left + r.width / 2, y: r.top + r.height / 2, width: r.width, height: r.height });
      } else {
        setCoords(null);
      }
    }, 200);
    return () => clearTimeout(t);
  }, [step, ready]);

  // Auto-advance
  useEffect(() => {
    if (!ready) return;
    const t = setTimeout(() => {
      if (step < TOUR_STEPS.length - 1) {
        setStep(s => s + 1);
      } else {
        dismiss();
      }
    }, TOUR_STEPS[step].duration);
    return () => clearTimeout(t);
  }, [step, ready]);

  const dismiss = () => {
    setGone(true);
    setTimeout(onDismiss, 300);
  };

  if (!ready || gone) return null;

  const cur = TOUR_STEPS[step];

  const tooltipPos = (): React.CSSProperties => {
    if (!coords) return {};
    switch (cur.position) {
      case 'right':  return { position: 'fixed', left: coords.x + coords.width / 2 + 14, top: coords.y - 18 };
      case 'top':    return { position: 'fixed', left: coords.x - 110, top: coords.y - coords.height / 2 - 68 };
      case 'bottom': return { position: 'fixed', left: coords.x - 110, top: coords.y + coords.height / 2 + 10 };
      case 'left':   return { position: 'fixed', left: coords.x - coords.width / 2 - 190, top: coords.y - 18 };
      default:       return { position: 'fixed', left: coords.x + coords.width / 2 + 14, top: coords.y - 18 };
    }
  };

  return (
    <>
      {/* Skip button — fixed top-right, no wrapper div */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={dismiss}
        style={{
          position: 'fixed', top: 12, right: 12, zIndex: 99999,
          background: '#8B7FE8', color: '#fff',
          border: 'none', borderRadius: 999,
          padding: '6px 14px', fontSize: 12, fontWeight: 600,
          cursor: 'pointer', fontFamily: 'Sora, sans-serif',
          boxShadow: '0 2px 12px rgba(139,127,232,0.5)',
        }}
      >
        Skip tour
      </motion.button>

      {/* Progress dots — fixed bottom-center */}
      <div style={{
        position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
        display: 'flex', gap: 8, zIndex: 99999,
      }}>
        {TOUR_STEPS.map((_, i) => (
          <div key={i} style={{
            width: i === step ? 20 : 8, height: 8,
            borderRadius: 999,
            background: i === step ? '#8B7FE8' : 'rgba(139,127,232,0.35)',
            transition: 'all 0.3s',
          }} />
        ))}
      </div>

      {/* Spotlight ring + label + tooltip — only when coords are known */}
      <AnimatePresence mode="wait">
        {coords && (
          <motion.div
            key={`step-${step}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            style={{ position: 'fixed', inset: 0, zIndex: 99998, pointerEvents: 'none' }}
          >
            {/* Glowing ring around the element */}
            <div style={{
              position: 'fixed',
              left: coords.x - coords.width / 2 - 10,
              top: coords.y - coords.height / 2 - 10,
              width: coords.width + 20,
              height: coords.height + 20,
              borderRadius: 14,
              border: '2px solid #8B7FE8',
              background: 'rgba(139,127,232,0.18)',
              boxShadow: '0 0 0 4px rgba(139,127,232,0.2), 0 0 28px rgba(139,127,232,0.5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {/* Button label always visible inside ring */}
              <span style={{
                color: '#fff', fontSize: 12, fontWeight: 600,
                fontFamily: 'Sora, sans-serif',
                textShadow: '0 1px 6px rgba(0,0,0,0.9)',
                whiteSpace: 'nowrap',
              }}>
                {cur.buttonLabel}
              </span>
            </div>

            {/* Bouncing arrow below the ring */}
            <motion.div
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
              style={{
                position: 'fixed',
                left: coords.x - 9,
                top: coords.y + coords.height / 2 + 12,
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#8B7FE8">
                <path d="M4 0L4 17L7.5 13.5L10.5 20L12.5 19L9.5 12.5L14 12.5L4 0Z"/>
              </svg>
            </motion.div>

            {/* Tooltip bubble */}
            <div style={{
              ...tooltipPos(),
              zIndex: 99999,
              background: '#8B7FE8',
              color: '#fff',
              borderRadius: 12,
              padding: '8px 12px',
              fontSize: 12,
              fontWeight: 500,
              maxWidth: 170,
              lineHeight: 1.45,
              boxShadow: '0 4px 16px rgba(139,127,232,0.45)',
              fontFamily: 'Sora, sans-serif',
            }}>
              {cur.label}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
