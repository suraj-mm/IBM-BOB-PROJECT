import chokidar from 'chokidar';
import { debounce } from '../../src/utils/debounce.js';

export function watchProjectFiles({ cache, socketAgent }) {
  const watcher = chokidar.watch(['src', 'package.json'], {
    ignored: ['**/node_modules/**', '**/.git/**'],
    ignoreInitial: true,
    depth: 4
  });

  const emitChange = debounce((pathName) => {
    const event = { type: 'FILE_UPDATED', payload: { path: pathName, timestamp: Date.now() } };
    cache.set('lastFileEvent', event);
    socketAgent.send(event.type, event.payload);
  }, 300);

  watcher.on('all', (eventName, pathName) => {
    if (pathName) {
      emitChange(pathName);
    }
  });

  watcher.on('error', (error) => {
    console.error('Watcher failed', error);
  });
}
