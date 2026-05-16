export function getLocalContextPayload(cache) {
  const gitStatus = cache.get('gitStatus') || {};
  return {
    branch: gitStatus.branch || 'unknown',
    changedFiles: gitStatus.files || [],
    activeFile: cache.get('activeFile') || 'src/App.jsx',
    projectContext: cache.get('projectContext') || {},
    timestamp: Date.now()
  };
}
