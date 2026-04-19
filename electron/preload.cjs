const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  windowMinimize: () => ipcRenderer.send('window-minimize'),
  windowMaximize: () => ipcRenderer.send('window-maximize'),
  windowClose: () => ipcRenderer.send('window-close'),
  toggleAlwaysOnTop: (enable) => ipcRenderer.invoke('toggle-always-on-top', enable),
  getLibrary: () => ipcRenderer.invoke('get-library'),
  downloadYoutube: (url) => ipcRenderer.invoke('download-youtube', url),
  readAudioFile: (path) => ipcRenderer.invoke('read-audio-file', path),
  renameTrack: (oldPath, newName) => ipcRenderer.invoke('rename-track', oldPath, newName),
  deleteTrack: (trackPath) => ipcRenderer.invoke('delete-track', trackPath),
  openLibraryFolder: () => ipcRenderer.invoke('open-library-folder'),
  addTracks: () => ipcRenderer.invoke('add-tracks')
});
