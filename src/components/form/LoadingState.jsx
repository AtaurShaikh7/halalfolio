import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const STEPS = [
  'Fetching NAV history…',
  'Running Sharia screening on holdings…',
  'Normalizing portfolio weights…',
  'Computing risk, ratios & Sharia score…',
];

export function LoadingState() {
  const [visible, setVisible] = useState(0);
  useEffect(() => {
    const timers = STEPS.map((_, i) =>
      setTimeout(() => setVisible((v) => Math.max(v, i + 1)), i * 380)
    );
    return () => timers.forEach(clearTimeout);
  }, []);
  return (
    <div className="rounded-2xl border bg-card p-8 text-center" style={{ borderColor: 'var(--border)' }}>
      <div className="spinner" />
      <div className="mt-4 space-y-1.5 text-sm text-text2">
        {STEPS.map((step, i) => (
          <motion.p
            key={step}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: i < visible ? 1 : 0.2, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <span className="text-gold mr-1">{i < visible ? '✓' : '·'}</span>
            {step}
          </motion.p>
        ))}
      </div>
    </div>
  );
}
