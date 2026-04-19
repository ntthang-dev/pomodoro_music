import { app, BrowserWindow, ipcMain, Tray, Menu, shell, dialog } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import ytdlp from 'yt-dlp-exec';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow;
let tray = null;
const isDev = process.env.NODE_ENV === 'development';

const appDataPath = app.getPath('userData');
const audioLibraryPath = path.join(appDataPath, 'Library');

// Ensure library directory exists
if (!fs.existsSync(audioLibraryPath)) {
  fs.mkdirSync(audioLibraryPath, { recursive: true });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 650,
    minWidth: 400,
    minHeight: 500,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    frame: false, // For custom glassmorphism titlebar
    transparent: true,
    icon: path.join(__dirname, '../public/icon.png')
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    // mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // Handle minimize to tray behavior
  mainWindow.on('minimize', (event) => {
    event.preventDefault();
    mainWindow.hide();
  });
}

function createTray() {
  // Using a simple icon path for tray (will need an actual icon)
  // For now, create a dummy or use a native image
  const iconPath = path.join(__dirname, isDev ? '../public/tray-icon.png' : '../dist/tray-icon.png');
  // Just catching error if icon doesn't exist
  try {
    tray = new Tray(iconPath);
    const contextMenu = Menu.buildFromTemplate([
      { label: 'Show App', click: () => mainWindow.show() },
      { label: 'Quit', click: () => { app.isQuiting = true; app.quit(); } }
    ]);
    tray.setToolTip('Pomodoro & Audio Player');
    tray.setContextMenu(contextMenu);
    tray.on('click', () => {
      mainWindow.show();
    });
  } catch(e) {
    console.log('Tray icon not found, skipping tray creation');
  }
}

app.whenReady().then(() => {
  createWindow();
  createTray();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC Handlers

ipcMain.on('window-minimize', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) win.minimize();
});

ipcMain.on('window-maximize', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (!win) return;
  win.isMaximized() ? win.unmaximize() : win.maximize();
});

ipcMain.on('window-close', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) win.hide(); // Hide instead of close to keep in tray
});

ipcMain.handle('toggle-always-on-top', (event, enable) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (!win) return;
  win.setAlwaysOnTop(enable);
  if (enable) {
    win.setSize(350, 450);
  } else {
    win.setSize(900, 650);
  }
});

ipcMain.handle('get-library', async () => {
  try {
    const files = fs.readdirSync(audioLibraryPath);
    return files.filter(f => f.endsWith('.mp3') || f.endsWith('.wav') || f.endsWith('.m4a') || f.endsWith('.webm') || f.endsWith('.opus'))
                .map(f => ({ name: f, path: path.join(audioLibraryPath, f) }));
  } catch (e) {
    console.error(e);
    return [];
  }
});

ipcMain.handle('rename-track', async (event, oldPath, newName) => {
  try {
    const parsed = path.parse(oldPath);
    const ext = parsed.ext;
    // ensure new name ends with the same extension if user didn't type it
    const finalName = newName.endsWith(ext) ? newName : `${newName}${ext}`;
    const newPath = path.join(audioLibraryPath, finalName);
    fs.renameSync(oldPath, newPath);
    return { success: true, newPath };
  } catch (error) {
    console.error(error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('delete-track', async (event, trackPath) => {
  try {
    fs.unlinkSync(trackPath);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('open-library-folder', async () => {
  await shell.openPath(audioLibraryPath);
});

ipcMain.handle('add-tracks', async (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  const { canceled, filePaths } = await dialog.showOpenDialog(win, {
    properties: ['openFile', 'multiSelections'],
    filters: [{ name: 'Audio Files', extensions: ['mp3', 'wav', 'm4a', 'ogg', 'webm', 'opus'] }]
  });
  
  if (canceled) return { success: false, canceled: true };
  
  try {
    for (const file of filePaths) {
      const fileName = path.basename(file);
      const dest = path.join(audioLibraryPath, fileName);
      if (!fs.existsSync(dest)) {
        fs.copyFileSync(file, dest);
      }
    }
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('download-youtube', async (event, url) => {
  try {
    const outputTemplate = path.join(audioLibraryPath, '%(title)s.%(ext)s');
    
    // Simple download without converting to mp3 to avoid ffmpeg dependency issues initially
    await ytdlp(url, {
      extractAudio: true,
      audioFormat: 'mp3',
      output: outputTemplate
    });
    
    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false, error: error.message || error.toString() };
  }
});

// Read file as base64 for playing in browser
ipcMain.handle('read-audio-file', async (event, filePath) => {
  try {
    const buffer = fs.readFileSync(filePath);
    return `data:audio/mp3;base64,${buffer.toString('base64')}`;
  } catch (e) {
    console.error(e);
    return null;
  }
});
