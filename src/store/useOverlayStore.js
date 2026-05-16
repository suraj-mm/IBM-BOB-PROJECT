import create from 'zustand';

export const useOverlayStore = create((set) => ({
  expanded: false,
  notifications: [],
  activeContext: {
    currentBranch: 'main',
    activeFile: 'src/App.jsx',
    changedFiles: [],
    riskScore: 12,
    teamEvents: []
  },
  toggleExpanded: () => set((state) => ({ expanded: !state.expanded })),
  setExpanded: (value) => set({ expanded: value }),
  addNotification: (payload) =>
    set((state) => ({
      notifications: [{ id: Date.now(), ...payload }, ...state.notifications].slice(0, 5)
    })),
  removeNotification: (id) =>
    set((state) => ({ notifications: state.notifications.filter((item) => item.id !== id) })),
  updateContext: (payload) => set((state) => ({ activeContext: { ...state.activeContext, ...payload } })),
  setActiveFile: (file) => set((state) => ({ activeContext: { ...state.activeContext, activeFile: file } })),
  setChangedFiles: (files) => set((state) => ({ activeContext: { ...state.activeContext, changedFiles: files } }))
}));
