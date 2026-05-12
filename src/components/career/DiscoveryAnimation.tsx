import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface TourStep {
  selector: string;  // CSS selector to find the element
  label: string;
  duration: number;
  position?: 'top' | 'bottom' | 'right' | 'left'; // where to show tooltip
}

const TOUR_STEPS: TourStep[] = [
  {
    selector: '[data-tour="new-chat"]',
    label: 'Click here to start a new conversation',
    duration: 2800,
    position: 'right',
  },
  {
    selector: '[data-tour="track-apps"]',
    label: 'Track all your job applications here',
    duration: 2800,
    position: 'right',
  },
  {
    selector: '[data-tour="manage-profile"]',
    label: 'Set up your profile so AI can personalize results',
    duration: 2800,
    position: 'right',
  },
  {
    selector: '[data-tour="build-resume"]',
    label: 'Build a professional resume with AI help',
    duration: 2800,
    position: 'right',
  },
  {
    selector: '[data-tour="cover-letter"]',
    label: 'Generate a cover letter for any job',
    duration: 2800,
    position: 'right',
  },
  {
    selector: '[data-tour="chat-input"]',
    label: 'Type your question here — ask for jobs, advice, anything!',
    duration: 3200,
    position: 'top',
  },
];

interface Coords {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface DiscoveryAnimationProps {
  onDismiss: () => void;
}

export default function DiscoveryAnimation({ onDismiss }: DiscoveryAnimationProps) {
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(true);
  const [coords, setCoords] = useState<Coords | null>(null);

  // Get element position for current step
  useEffect(() => {
    const el = document.querySelector(TOUR_STEPS[step].selector) as HTMLElement;
    if (el) {
      const rect = el.getBoundingClientRect();
      setCoords({
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
        width: rect.width,
        height: rect.height,
      });
    }
  }, [step]);

  // Auto-advance
  useEffect(() => {
    const timer = setTimeout(() => {
      if (step < TOUR_STEPS.length - 1) {
        setStep(s => s + 1);
      } else {
        dismiss();
      }
    }, TOUR_STEPS[step].duration);
    return () => clearTimeout(timer);
  }, [step]);

  const dismiss = () => {
    setVisible(false);
    setTimeout(onDismiss, 300);
  };

  const currentStep = TOUR_STEPS[step];

  // Calculate tooltip position
  const getTooltipStyle = () => {
    if (!coords) return {};
    const pos = currentStep.position || 'top';
    switch (pos) {
      case 'right': return { left: coords.x + 40, top: coords.y - 20 };
      case 'top':   return { left: coords.x - 100, top: coords.y - 90 };
      case 'bottom':return { left: coords.x - 100, top: coords.y + 40 };
      case 'left':  return { left: coords.x - 240, top: coords.y - 20 };
      default:      return { left: coords.x + 40, top: coords.y - 20 };
    }
  };

  return (
    <AnimatePresence>
      {visible && coords && (
        <div className="fixed inset-0 z-50 pointer-events-none">

          {/* Skip button */}
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute top-4 right-4 pointer-events-auto px-4 py-2 rounded-full text-xs font-semibold"
            style={{ background: '#0095FF', color: '#FFFFFF', zIndex: 60 }}
            onClick={dismiss}
          >
            Skip tour
          </motion.button>

          {/* Spotlight highlight on the element */}
          <motion.div
            key={`highlight-${step}`}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute rounded-2xl"
            style={{
              left: coords.x - coords.width / 2 - 6,
              top: coords.y - coords.height / 2 - 6,
              width: coords.width + 12,
              height: coords.height + 12,
              border: '2px solid #0095FF',
              boxShadow: '0 0 0 4px rgba(0,149,255,0.2), 0 0 20px rgba(0,149,255,0.3)',
              pointerEvents: 'none',
            }}
          />

          {/* Hand pointing at element */}
          <motion.div
            key={`hand-${step}`}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ type: 'spring', damping: 18, stiffness: 250 }}
            className="absolute"
            style={{
              left: coords.x - 10,
              top: coords.y + coords.height / 2 + 4,
            }}
          >
            <motion.div
              animate={{ y: [0, -6, 0, -6, 0] }}
              transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
              style={{ fontSize: '1.8rem', filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.3))' }}
            >
              👆
            </motion.div>
            {/* Ripple */}
            <motion.div
              animate={{ scale: [1, 2.5, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 1.2, repeat: Infinity }}
              className="absolute rounded-full"
              style={{
                width: '16px',
                height: '16px',
                background: 'rgba(0,149,255,0.4)',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
              }}
            />
          </motion.div>

          {/* Tooltip */}
          <motion.div
            key={`tooltip-${step}`}
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 0.15, duration: 0.25 }}
            className="absolute px-4 py-2.5 rounded-2xl text-sm font-medium"
            style={{
              ...getTooltipStyle(),
              background: '#0095FF',
              color: '#FFFFFF',
              maxWidth: '200px',
              boxShadow: '0 4px 20px rgba(0,149,255,0.35)',
              lineHeight: '1.4',
            }}
          >
            {currentStep.label}
          </motion.div>

          {/* Progress dots */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2"
          >
            {TOUR_STEPS.map((_, i) => (
              <div
                key={i}
                className="rounded-full transition-all duration-300"
                style={{
                  width: i === step ? '20px' : '8px',
                  height: '8px',
                  background: i === step ? '#0095FF' : 'rgba(0,149,255,0.3)',
                }}
              />
            ))}
          </motion.div>

        </div>
      )}
    </AnimatePresence>
  );
}




