import { useEffect } from 'react';
import { useOverlayStore } from '../../store/useOverlayStore.js';
import RiskPanel from '../RiskPanel/RiskPanel.jsx';
import TeamEvents from '../TeamEvents/TeamEvents.jsx';

function OverlayPanel() {
  const { activeContext } = useOverlayStore();

  useEffect(() => {
    const payload = {
      currentBranch: activeContext.currentBranch,
      activeFile: activeContext.activeFile,
      changedFiles: activeContext.changedFiles || []
    };
    window.desktopBridge?.send('agent:context', payload);
  }, [activeContext.currentBranch, activeContext.activeFile, activeContext.changedFiles]);

  return (
    <div className="space-y-4 text-slate-100">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-4 shadow-inner">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Project context</p>
            <h2 className="mt-2 text-lg font-semibold">{activeContext.currentBranch}</h2>
          </div>
          <span className="rounded-2xl bg-violet-500/15 px-3 py-1 text-xs text-violet-300">{activeContext.activeFile}</span>
        </div>
        <p className="mt-3 text-sm text-slate-400">{activeContext.changedFiles?.length ? `${activeContext.changedFiles.length} files changed` : 'Working tree is clean'}</p>
      </div>

      <RiskPanel />

      <div className="grid gap-3">
        <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-4">
          <h3 className="text-sm font-semibold text-slate-200">Dependency alerts</h3>
          <p className="mt-2 text-sm leading-6 text-slate-400">Package mismatch, outdated libraries, and unsafe dependency updates detected in real time.</p>
          <ul className="mt-3 space-y-2 text-sm text-slate-300">
            <li className="rounded-2xl bg-slate-900/70 p-3">react@18.3.1 vs peer 18.2.0</li>
            <li className="rounded-2xl bg-slate-900/70 p-3">tailwindcss flagged insecure version range</li>
          </ul>
        </div>

        <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-4">
          <h3 className="text-sm font-semibold text-slate-200">Architecture suggestions</h3>
          <p className="mt-2 text-sm leading-6 text-slate-400">A modular domain layer and shared validation contract would improve scaling and test isolation.</p>
          <ul className="mt-3 space-y-2 text-sm text-slate-300">
            <li className="rounded-2xl bg-slate-900/70 p-3">Extract shared socket events into /services/socket</li>
            <li className="rounded-2xl bg-slate-900/70 p-3">Move agent metadata to context/cache boundary</li>
          </ul>
        </div>
      </div>

      <TeamEvents teamEvents={activeContext.teamEvents} />
    </div>
  );
}

export default OverlayPanel;
