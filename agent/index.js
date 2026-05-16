import { watchProjectFiles } from './watcher/index.js';
import { createSocketAgent } from './socket/index.js';
import { createCache } from './cache/index.js';
import { readGitStatus } from './git/index.js';
import { gatherContext } from './context/index.js';

export function initializeAgent({ mainWindow, secureChannels }) {
  const cache = createCache();
  const socketAgent = createSocketAgent({ cache, mainWindow });

  watchProjectFiles({ cache, socketAgent });
  readGitStatus({ cache, socketAgent });
  gatherContext({ cache, socketAgent });

  return { cache, socketAgent };
}
