# Pomodoro & Offline Audio Player

A minimalistic desktop productivity application built with Electron, React, and Vite, featuring a Pomodoro timer, offline media player, and YouTube audio downloading.

## Features

- **Pomodoro Timer**: Customizable Focus, Short Break, and Long Break intervals.
- **Offline Audio Library**: Play local MP3, M4A, and WAV files.
- **YouTube Downloader**: Paste a YouTube link to download audio locally.
- **Task Manager**: Simple built-in to-do list.
- **Mini Player**: Always-on-top mode for uninterrupted focus.
- **Glassmorphism UI**: Beautiful, clean Gen-Z aesthetic with mood themes (Late Night Study, Morning Cafe, Cozy Library).
- **System Tray**: Minimizes to tray to keep your taskbar clean.

## Setup & Testing Instructions

1. **Install Dependencies**
   Ensure you have Node.js installed, then run:
   ```bash
   npm install
   ```

2. **Run in Development Mode**
   Start the application locally with hot-reloading:
   ```bash
   npm run dev
   ```

3. **Debugging Tips**
   - The React DevTools can be opened in Electron using `Ctrl+Shift+I`.
   - To inspect the Electron main process, you can uncomment `mainWindow.webContents.openDevTools()` in `electron/main.js`.
   - If `yt-dlp` fails to download, ensure you have an active internet connection and that the URL is valid. `yt-dlp` automatically handles updates on its own, but if needed, you can update the NPM package `yt-dlp-exec`.

## Packaging & Building Instructions (.exe)

This project uses `electron-builder` to package the application into a standalone executable.

1. **Build the React Frontend**
   Before packaging, you must compile the Vite project:
   ```bash
   npm run build
   ```
   *Note: Our `build` script in `package.json` handles this automatically.*

2. **Generate the Executable**
   Run the build script:
   ```bash
   npm run build
   ```
   This command will:
   - Build the Vite production assets to the `dist/` directory.
   - Run `electron-builder` to package the application.

3. **Locate the `.exe`**
   Once the process finishes, navigate to the `dist/` folder (the output folder for electron-builder is usually `dist/` unless specified otherwise). You will find your installer `.exe` (e.g., `pomodoro Setup 1.0.0.exe`) and an unpacked version.
   
4. **Distribute**
   You can share the `.exe` file. Users can launch it with a single click, and it runs completely offline.

## Note on yt-dlp Executable

The `yt-dlp-exec` package automatically downloads the latest `yt-dlp` binary on the first run. For a true offline installation bundle, you can configure `electron-builder` to bundle the downloaded `yt-dlp` binary by adding it to `extraResources` in `package.json`.
