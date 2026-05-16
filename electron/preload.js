import { contextBridge, ipcRenderer } from 'electron';

const validChannels = ['agent:context', 'agent:update', 'window-drag', 'window-snap', 'notification:add', 'request-context', 'agent:event', 'agent:status'];

contextBridge.exposeInMainWorld('desktopBridge', {
  send: (channel, payload) => {
    if (validChannels.includes(channel)) {
      ipcRenderer.send(channel, payload);
    }
  },
  receive: (channel, callback) => {
    if (validChannels.includes(channel)) {
      const listener = (event, data) => callback(data);
      ipcRenderer.on(channel, listener);
      return () => ipcRenderer.removeListener(channel, listener);
    }
    return () => {};
  },
  invoke: async (channel, payload) => {
    if (validChannels.includes(channel)) {
      return ipcRenderer.invoke(channel, payload);
    }
    return null;
  }
});
