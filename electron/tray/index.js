import { Tray, nativeImage } from 'electron';
import path from 'path';

export function createSystemTray(app) {
  const icon = nativeImage.createFromPath(path.join(app.getAppPath(), 'assets', 'tray.png'));
  const tray = new Tray(icon);
  tray.setToolTip('Floating AI Assistant');
  return tray;
}
