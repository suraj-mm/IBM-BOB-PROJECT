export const PANEL_VARIANTS = {
  hidden: { opacity: 0, scale: 0.96, y: -16 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.24, ease: 'easeOut' } },
  exit: { opacity: 0, scale: 0.94, y: -12, transition: { duration: 0.18 } }
};

export const BUBBLE_VARIANTS = {
  idle: { scale: 1, opacity: 0.88 },
  hover: { scale: 1.05, opacity: 1 },
  active: { scale: 1.08, boxShadow: '0 0 28px rgba(124,92,255,0.28)' }
};

export const pulseMotion = {
  animate: { scale: [1, 1.05, 1], opacity: [0.9, 1, 0.9] },
  transition: { duration: 2, repeat: Infinity, ease: 'easeInOut' }
};
