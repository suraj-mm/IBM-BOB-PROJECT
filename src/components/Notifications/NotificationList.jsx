import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOverlayStore } from '../../store/useOverlayStore.js';
import { severityStyles } from '../../utils/constants.js';

function NotificationList({ notifications }) {
  const removeNotification = useOverlayStore((state) => state.removeNotification);

  useEffect(() => {
    const timers = notifications.map((item) =>
      setTimeout(() => removeNotification(item.id), 6000)
    );

    return () => {
      timers.forEach(clearTimeout);
    };
  }, [notifications, removeNotification]);

  return (
    <div className="fixed right-6 top-6 z-50 flex w-[320px] flex-col gap-3">
      <AnimatePresence initial={false}>
        {notifications.map((item) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.22 }}
            className={`rounded-3xl border border-white/10 p-4 shadow-xl shadow-black/25 backdrop-blur-xl ${severityStyles[item.severity || 'Low']}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-white">{item.title}</p>
                <p className="mt-1 text-xs leading-5 text-slate-400">{item.message || 'Review the latest engineering alert.'}</p>
              </div>
              <button
                type="button"
                className="text-slate-400 transition hover:text-white"
                onClick={() => removeNotification(item.id)}
              >
                ×
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

export default NotificationList;
