import { motion } from 'framer-motion';
import { useRef } from 'react';
import { BUBBLE_VARIANTS, pulseMotion } from '../../animations/motionVariants.js';

function Bubble({ expanded, onToggle, risk, notifications }) {
  const unread = notifications.length;
  const pulse = risk > 65;
  const pointerState = useRef({ x: 0, y: 0, moved: false, dragging: false });

  const handlePointerDown = (event) => {
    pointerState.current = {
      x: event.clientX,
      y: event.clientY,
      moved: false,
      dragging: true
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event) => {
    if (!pointerState.current.dragging) {
      return;
    }
    const deltaX = event.clientX - pointerState.current.x;
    const deltaY = event.clientY - pointerState.current.y;

    if (Math.abs(deltaX) > 4 || Math.abs(deltaY) > 4) {
      pointerState.current.moved = true;
    }

    pointerState.current.x = event.clientX;
    pointerState.current.y = event.clientY;

    window.desktopBridge?.send('window-drag', { deltaX, deltaY });
  };

  const handlePointerUp = (event) => {
    if (pointerState.current.dragging) {
      pointerState.current.dragging = false;
      event.currentTarget.releasePointerCapture(event.pointerId);
      window.desktopBridge?.send('window-snap');
    }
  };

  const handleClick = () => {
    if (!pointerState.current.moved) {
      onToggle();
    }
  };

  return (
    <motion.button
      type="button"
      onClick={handleClick}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      whileHover="hover"
      animate={pulse ? 'active' : 'idle'}
      variants={BUBBLE_VARIANTS}
      className="pointer-events-auto fixed right-6 bottom-6 z-50 flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-slate-900/90 text-white shadow-xl shadow-violet-500/10 backdrop-blur-xl"
      style={{ WebkitAppRegion: 'no-drag' }}
    >
      <span className="absolute inset-0 rounded-full bg-gradient-to-br from-slate-500/10 via-transparent to-transparent" />
      <span className="relative flex h-full w-full items-center justify-center">
        <span className="absolute inset-0 rounded-full bg-slate-800/70" />
        <span className="relative text-lg font-semibold">AI</span>
      </span>
      {unread > 0 && (
        <motion.span
          className="absolute right-0 top-0 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-rose-500 text-[11px] font-semibold text-white"
          {...(pulse ? pulseMotion : {})}
        >
          {unread}
        </motion.span>
      )}
    </motion.button>
  );
}

export default Bubble;
