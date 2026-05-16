import { useOverlayStore } from '../../store/useOverlayStore.js';

function RiskPanel() {
  const { activeContext } = useOverlayStore();
  const risk = activeContext.riskScore || 18;
  const level = risk > 75 ? 'Critical' : risk > 45 ? 'High' : 'Medium';

  return (
    <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Merge risk</p>
          <h3 className="mt-2 text-2xl font-semibold text-white">{risk}%</h3>
        </div>
        <span className="rounded-full bg-violet-500/15 px-3 py-1 text-xs font-semibold text-violet-300">{level}</span>
      </div>
      <div className="mt-4 space-y-2 text-sm text-slate-300">
        <div className="rounded-2xl bg-slate-900/80 p-3">Overlapping teammate work in reducer modules.</div>
        <div className="rounded-2xl bg-slate-900/80 p-3">Potential conflict in API gateway and contract layer.</div>
      </div>
    </div>
  );
}

export default RiskPanel;
