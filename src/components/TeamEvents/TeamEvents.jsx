function TeamEvents({ teamEvents = [] }) {
  const events = teamEvents.length
    ? teamEvents
    : [
        { title: 'Teammate editing same reducer', detail: 'Kira is active in src/store/useOverlayStore.js' },
        { title: 'Backend contract modified', detail: 'GraphQL schema changed in /backend/server.js' }
      ];

  return (
    <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-slate-200">Real-time team events</h3>
        <span className="text-xs uppercase tracking-[0.22em] text-slate-500">Live</span>
      </div>
      <div className="mt-4 space-y-3">
        {events.map((event, index) => (
          <div key={index} className="rounded-2xl bg-slate-900/75 p-3 text-sm text-slate-300">
            <p className="font-medium text-white">{event.title}</p>
            <p className="mt-1 text-xs text-slate-500">{event.detail}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default TeamEvents;
