const { app, BrowserWindow, Menu, dialog, ipcMain, shell } = require('electron');
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

// Create splash screen
function createSplashWindow() {
  splashWindow = new BrowserWindow({
    width: 500,
    height: 400,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    skipTaskbar: true,
    icon: path.join(__dirname, 'public/icon.png'),
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
  mainWindow = new BrowserWindow({
    width: 1600,
    height: 900,
    minWidth: 1024,
    minHeight: 768,
    icon: path.join(__dirname, 'public/icon.png'),
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
  });

  // Create application menu
  const menuTemplate = [
    {
      label: 'Dosya',
      submenu: [
        { label: 'Yenile', role: 'reload' },
        { label: 'Zorla Yenile', role: 'forceReload' },
        { type: 'separator' },
        { label: 'Çıkış', role: 'quit' }
      ]
    },
    {
      label: 'Görünüm',
      submenu: [
        { label: 'Yakınlaştırmayı Sıfırla', role: 'resetZoom' },
        { label: 'Yakınlaştır', role: 'zoomIn' },
        { label: 'Uzaklaştır', role: 'zoomOut' },
        { type: 'separator' },
        { label: 'Tam Ekran', role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Yardım',
      submenu: [
        {
          label: 'Hakkında',
          click: async () => {
            const updateInfo = await checkForUpdates();
            const updateStatus = updateInfo.updateAvailable 
              ? `⚠️ Yeni sürüm mevcut: v${updateInfo.latestVersion}`
              : '✅ Uygulama güncel';
            
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'Hakkında',
              message: APP_NAME,
              detail: `Sürüm: v${APP_VERSION}\n${updateStatus}\n\nOluşturan: ${CREATOR}\n\n© 2026 Barida Makina\nEndüstriyel Çözümler`,
              buttons: ['Tamam']
            });
          }
        },
        {
          label: 'Güncellemeleri Kontrol Et',
          click: async () => {
            const updateInfo = await checkForUpdates();
            if (updateInfo.updateAvailable) {
              const result = await dialog.showMessageBox(mainWindow, {
                type: 'info',
                title: 'Güncelleme Mevcut',
                message: `Yeni sürüm mevcut: v${updateInfo.latestVersion}`,
                detail: `Mevcut sürüm: v${APP_VERSION}\n\nGüncelleme için web sitesini ziyaret edin.`,
                buttons: ['Web Sitesini Aç', 'Daha Sonra']
              });
              if (result.response === 0) {
                shell.openExternal('https://github.com/77x30/eymen-web-recipe/releases');
              }
            } else {
              dialog.showMessageBox(mainWindow, {
                type: 'info',
                title: 'Güncelleme Yok',
                message: 'Uygulama güncel!',
                detail: `Mevcut sürüm: v${APP_VERSION}`,
                buttons: ['Tamam']
              });
            }
          }
        },
        { type: 'separator' },
        {
          label: 'GitHub',
          click: () => shell.openExternal('https://github.com/77x30/eymen-web-recipe')
        },
        {
          label: 'Barida Makina',
          click: () => shell.openExternal('https://www.baridamakina.com')
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(menuTemplate);
  Menu.setApplicationMenu(menu);

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
