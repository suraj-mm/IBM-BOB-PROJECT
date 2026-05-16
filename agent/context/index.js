import { readFileSync } from 'fs';
import path from 'path';

export function gatherContext({ cache, socketAgent }) {
  const pkgPath = path.join(process.cwd(), 'package.json');
  const packageData = readFileSync(pkgPath, 'utf-8');
  const manifest = JSON.parse(packageData);
  const gitStatus = cache.get('gitStatus') || {};
  const context = {
    currentBranch: gitStatus.branch || 'unknown',
    projectName: manifest.name,
    activeFile: cache.get('activeFile') || 'src/App.jsx',
    changedFiles: gitStatus.files || [],
    dependencies: Object.keys(manifest.dependencies || {}),
    timestamp: Date.now()
  };

  cache.set('projectContext', context);
  cache.set('activeFile', context.activeFile);
  socketAgent.send('LOCAL_CONTEXT', context);
  socketAgent.send('ACTIVE_MODULE', { activeFile: context.activeFile, branch: context.currentBranch });
}
