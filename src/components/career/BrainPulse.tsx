import { motion } from "framer-motion";

interface BrainPulseProps {
  intensity: number; // 0-10
}

export default function BrainPulse({ intensity }: BrainPulseProps) {
  const glowSize = 8 + intensity * 2;
  const opacity = 0.4 + intensity * 0.06;

  return (
    <div className="flex items-center gap-2">
      <div className="relative flex items-center justify-center">
        {/* Outer pulse rings */}
        <motion.div
          className="absolute rounded-full"
          style={{
            width: glowSize * 3,
            height: glowSize * 3,
            background: `rgba(0, 212, 200, ${opacity * 0.15})`,
          }}
          animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0, 0.3] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute rounded-full"
          style={{
            width: glowSize * 2,
            height: glowSize * 2,
            background: `rgba(0, 212, 200, ${opacity * 0.25})`,
          }}
          animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0.1, 0.4] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
        />
        {/* Core dot */}
        <motion.div
          className="relative rounded-full z-10"
          style={{
            width: glowSize,
            height: glowSize,
            background: `rgba(0, 212, 200, ${Math.min(opacity + 0.3, 1)})`,
            boxShadow: `0 0 ${glowSize * 2}px rgba(0, 212, 200, ${opacity})`,
          }}
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>
      <span
        className="text-xs font-mono"
        style={{ color: `rgba(0, 212, 200, ${Math.min(opacity + 0.4, 1)})` }}
      >
        AI LEARNING
      </span>
    </div>
  );
}






