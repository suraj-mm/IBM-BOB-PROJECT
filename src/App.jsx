import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useOverlayStore } from './store/useOverlayStore.js';
import Bubble from './components/Bubble/Bubble.jsx';
import OverlayPanel from './components/Overlay/OverlayPanel.jsx';
import NotificationList from './components/Notifications/NotificationList.jsx';
import { useSocketClient } from './services/socketClient.js';
import { PANEL_VARIANTS } from './animations/motionVariants.js';

function App() {
  const { expanded, setExpanded, notifications, addNotification, activeContext } = useOverlayStore();
  useSocketClient({ addNotification });

  useEffect(() => {
    const unsubscribe = window.desktopBridge?.receive('agent:event', (event) => {
      if (!event?.type) return;

      const payload = event.payload || {};
      switch (event.type) {
        case 'MERGE_RISK':
          addNotification({ title: 'Merge risk detected', severity: 'High', message: payload.summary });
          break;
        case 'API_CHANGED':
          addNotification({ title: 'API changed', severity: 'Medium', message: payload.detail || payload.module });
          break;
        case 'DEPENDENCY_WARNING':
          addNotification({ title: 'Dependency warning', severity: 'Medium', message: payload.message });
          break;
        case 'TEAM_OVERLAP':
          addNotification({ title: 'Team overlap', severity: 'High', message: payload.detail });
          break;
        case 'ARCHITECTURE_ALERT':
          addNotification({ title: 'Architecture alert', severity: 'Low', message: payload.suggestion });
          break;
        default:
          break;
      }
    });

    return () => unsubscribe?.();
  }, [addNotification]);

  useEffect(() => {
    if (!expanded) {
      return undefined;
    }

    const timeout = setTimeout(() => {
      setExpanded(false);
    }, 22000);

    return () => clearTimeout(timeout);
  }, [expanded, setExpanded]);

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      <AnimatePresence>
        <Bubble
          expanded={expanded}
          onToggle={() => setExpanded(!expanded)}
          risk={activeContext.riskScore}
          notifications={notifications}
        />
      </AnimatePresence>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={PANEL_VARIANTS}
            className="pointer-events-auto fixed right-6 top-6 w-[380px] rounded-3xl border border-white/10 bg-surface/95 p-4 shadow-panel backdrop-blur-xl"
          >
            <OverlayPanel />
          </motion.div>
        )}
      </AnimatePresence>

      <NotificationList notifications={notifications} />
    </div>
  );
}

export default App;
