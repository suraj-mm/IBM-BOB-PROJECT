import { exec, execSync } from 'child_process';

export function readGitStatus({ cache, socketAgent }) {
  exec('git status --short', { cwd: process.cwd() }, (error, stdout) => {
    if (error) {
      return;
    }
    const files = stdout.trim().split('\n').filter(Boolean);
    const branch = getBranchName();
    cache.set('gitStatus', { branch, files, timestamp: Date.now() });
    socketAgent.send('CURRENT_BRANCH', { branch, files });
  });
}

function getBranchName() {
  try {
    const branch = execSync('git rev-parse --abbrev-ref HEAD', { cwd: process.cwd() });
    return branch.toString().trim();
  } catch {
    return 'unknown';
  }
}
