import { app, BrowserWindow, ipcMain, screen, Tray, nativeImage } from 'electron';
import path from 'path';
import { initializeAgent } from '../agent/index.js';
import { secureChannels, isAllowedChannel } from './ipc/index.js';

let mainWindow;
let tray;
let agentController;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 380,
    height: 520,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    hasShadow: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(app.getAppPath(), 'electron', 'preload.js')
    }
  });

  const devUrl = 'http://127.0.0.1:5173';
  const prodUrl = `file://${path.join(app.getAppPath(), 'dist', 'index.html')}`;
  const targetUrl = process.env.NODE_ENV === 'production' ? prodUrl : devUrl;

  mainWindow.loadURL(targetUrl);
  mainWindow.setAlwaysOnTop(true, 'screen-saver');
  mainWindow.setVisibleOnAllWorkspaces(true);
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function createTray() {
  const icon = nativeImage.createEmpty();
  tray = new Tray(icon);
  tray.setToolTip('Floating AI Assistant');
}

app.whenReady().then(() => {
  createWindow();
  createTray();
  agentController = initializeAgent({ mainWindow, secureChannels });
});

ipcMain.on('agent:context', (_, payload) => {
  if (!agentController?.socketAgent) {
    return;
  }
  agentController.socketAgent.send('LOCAL_CONTEXT', payload);
});

ipcMain.on('agent:update', (_, payload) => {
  agentController?.socketAgent?.send('FILE_UPDATED', payload);
});

ipcMain.on('window-drag', (_, movement) => {
  if (!mainWindow || !movement) {
    return;
  }
  const bounds = mainWindow.getBounds();
  mainWindow.setBounds({
    x: bounds.x + movement.deltaX,
    y: bounds.y + movement.deltaY,
    width: bounds.width,
    height: bounds.height
  });
});

ipcMain.on('window-snap', () => {
  if (!mainWindow) {
    return;
  }
  const bounds = mainWindow.getBounds();
  const display = screen.getDisplayMatching(bounds);
  const margin = 16;
  const snapX = bounds.x + bounds.width / 2 > display.workArea.x + display.workArea.width / 2
    ? display.workArea.x + display.workArea.width - bounds.width - margin
    : display.workArea.x + margin;
  const snapY = bounds.y < display.workArea.y + display.workArea.height / 2
    ? display.workArea.y + margin
    : Math.min(display.workArea.y + display.workArea.height - bounds.height - margin, bounds.y);

  mainWindow.setBounds({ x: snapX, y: snapY, width: bounds.width, height: bounds.height });
});

ipcMain.handle('get-window-bounds', () => mainWindow?.getBounds());

ipcMain.handle('get-agent-status', () => ({
  connected: agentController?.socketAgent?.status() ?? false,
  socketStatus: agentController?.cache?.get('socketStatus')
}));

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

ipcMain.handle('app-ready', () => true);
