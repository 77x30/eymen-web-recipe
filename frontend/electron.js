const { app, BrowserWindow, Menu, dialog, shell, nativeImage } = require('electron');
const path = require('path');
const https = require('https');

// App info
const APP_VERSION = '1.0.0';
const APP_NAME = 'Barida Recipe Management System';
const CREATOR = 'Eymen Gözel - Otomasyon ve Yazılım Sorumlusu';
const PRODUCTION_URL = 'https://barida.xyz';
const VERSION_CHECK_URL = 'https://raw.githubusercontent.com/77x30/eymen-web-recipe/main/version.json';

// Keep global references
let mainWindow;
let splashWindow;
let lastKnownVersion = APP_VERSION;

// Check for updates
function checkForUpdates() {
  return new Promise((resolve) => {
    https.get(VERSION_CHECK_URL, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const versionInfo = JSON.parse(data);
          resolve({
            currentVersion: APP_VERSION,
            latestVersion: versionInfo.version || APP_VERSION,
            updateAvailable: versionInfo.version && versionInfo.version !== APP_VERSION,
            releaseNotes: versionInfo.releaseNotes || ''
          });
        } catch (e) {
          resolve({ currentVersion: APP_VERSION, latestVersion: APP_VERSION, updateAvailable: false });
        }
      });
    }).on('error', () => {
      resolve({ currentVersion: APP_VERSION, latestVersion: APP_VERSION, updateAvailable: false });
    });
  });
}

// Check for live updates (website content changes)
function startLiveUpdateChecker() {
  setInterval(async () => {
    if (!mainWindow) return;
    
    try {
      const response = await fetch(`${PRODUCTION_URL}/api/health`);
      const data = await response.json();
      
      // Check if there's a content update (could be based on build hash, timestamp, etc.)
      if (data.buildVersion && data.buildVersion !== lastKnownVersion) {
        lastKnownVersion = data.buildVersion;
        showLiveUpdateNotification();
      }
    } catch (e) {
      // Silently fail
    }
  }, 30000); // Check every 30 seconds
}

// Show live update notification and reload
function showLiveUpdateNotification() {
  if (!mainWindow) return;
  
  // Inject live update overlay
  mainWindow.webContents.executeJavaScript(`
    (function() {
      // Remove existing overlay if any
      const existing = document.getElementById('live-update-overlay');
      if (existing) existing.remove();
      
      // Create overlay
      const overlay = document.createElement('div');
      overlay.id = 'live-update-overlay';
      overlay.innerHTML = \`
        <style>
          #live-update-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(30, 58, 138, 0.95);
            z-index: 99999;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            color: white;
            font-family: 'Segoe UI', Arial, sans-serif;
            animation: fadeIn 0.3s ease;
          }
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.1); }
          }
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          .update-icon {
            font-size: 64px;
            margin-bottom: 20px;
            animation: pulse 1s ease infinite;
          }
          .update-title {
            font-size: 28px;
            font-weight: 700;
            margin-bottom: 10px;
          }
          .update-subtitle {
            font-size: 16px;
            opacity: 0.8;
            margin-bottom: 30px;
          }
          .update-spinner {
            width: 40px;
            height: 40px;
            border: 3px solid rgba(255,255,255,0.3);
            border-top-color: white;
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }
        </style>
        <div class="update-icon">🔄</div>
        <div class="update-title">Canlı Güncelleme</div>
        <div class="update-subtitle">Yeni içerik yükleniyor...</div>
        <div class="update-spinner"></div>
      \`;
      document.body.appendChild(overlay);
      
      // Reload after animation
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    })();
  `);
}

// Create splash screen
function createSplashWindow() {
  const iconPath = path.join(__dirname, 'public', 'icon.png');
  
  splashWindow = new BrowserWindow({
    width: 500,
    height: 400,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    skipTaskbar: true,
    icon: iconPath,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  // Create splash HTML content
  const splashHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: 'Segoe UI', Arial, sans-serif;
          background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 50%, #1e40af 100%);
          height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: white;
          border-radius: 20px;
          overflow: hidden;
          user-select: none;
        }
        .logo-container {
          animation: pulse 2s ease-in-out infinite;
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.05); opacity: 0.9; }
        }
        .logo {
          font-size: 80px;
          font-weight: 900;
          text-shadow: 0 4px 20px rgba(0,0,0,0.3);
          margin-bottom: 10px;
        }
        .company {
          font-size: 24px;
          font-weight: 600;
          letter-spacing: 8px;
          text-transform: uppercase;
          margin-bottom: 5px;
        }
        .subtitle {
          font-size: 12px;
          opacity: 0.8;
          letter-spacing: 2px;
          margin-bottom: 40px;
        }
        .status {
          font-size: 14px;
          opacity: 0.9;
          margin-bottom: 15px;
        }
        .loader {
          width: 200px;
          height: 4px;
          background: rgba(255,255,255,0.2);
          border-radius: 2px;
          overflow: hidden;
        }
        .loader-bar {
          width: 40%;
          height: 100%;
          background: white;
          border-radius: 2px;
          animation: loading 1.5s ease-in-out infinite;
        }
        @keyframes loading {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(350%); }
        }
        .version {
          position: absolute;
          bottom: 20px;
          font-size: 11px;
          opacity: 0.6;
        }
        .creator {
          position: absolute;
          bottom: 35px;
          font-size: 10px;
          opacity: 0.5;
        }
      </style>
    </head>
    <body>
      <div class="logo-container">
        <div class="logo">B</div>
      </div>
      <div class="company">Barida</div>
      <div class="subtitle">Recipe Management System</div>
      <div class="status" id="status">Başlatılıyor...</div>
      <div class="loader">
        <div class="loader-bar"></div>
      </div>
      <div class="creator">${CREATOR}</div>
      <div class="version">v${APP_VERSION}</div>
      <script>
        const messages = [
          'Başlatılıyor...',
          'Güncellemeler denetleniyor...',
          'Sistem hazırlanıyor...',
          'Bağlantı kuruluyor...'
        ];
        let i = 0;
        setInterval(() => {
          document.getElementById('status').textContent = messages[i % messages.length];
          i++;
        }, 800);
      </script>
    </body>
    </html>
  `;

  splashWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(splashHTML));
}

// Create main window
function createWindow() {
  const iconPath = path.join(__dirname, 'public', 'icon.png');
  
  mainWindow = new BrowserWindow({
    width: 1600,
    height: 900,
    minWidth: 1024,
    minHeight: 768,
    icon: iconPath,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true
    },
    backgroundColor: '#1e3a8a',
    show: false,
    title: APP_NAME
  });

  // Start maximized
  mainWindow.maximize();

  // Load production URL
  mainWindow.loadURL(PRODUCTION_URL);

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    if (splashWindow) {
      splashWindow.close();
      splashWindow = null;
    }
    mainWindow.show();
    mainWindow.focus();
    
    // Start live update checker
    startLiveUpdateChecker();
  });

  // Remove menu completely (no Dosya, Görünüm, Yardım)
  Menu.setApplicationMenu(null);

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// App startup sequence
app.whenReady().then(async () => {
  // Show splash screen first
  createSplashWindow();
  
  // Wait a moment for splash to render
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Check for updates
  await checkForUpdates();
  
  // Simulate loading time for smooth experience
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Create main window
  createWindow();
});

// Quit when all windows are closed
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// Handle certificate errors
app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
  callback(false);
});
