const { app, BrowserWindow } = require('electron');
const path = require('path');
const { exec } = require('child_process');

let mainWindow;
let previousApps = new Map(); // Store app names with their PIDs as keys

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1000,
        height: 800,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        }
    });

    mainWindow.loadFile('index.html');
}

// Get running applications on Windows
function getRunningApps() {
    return new Promise((resolve, reject) => {
        exec('tasklist /FO CSV /NH', { encoding: 'utf8' }, (error, stdout) => {
            if (error) {
                reject(error);
                return;
            }

            try {
                const apps = stdout.split('\n')
                    .map(line => line.trim().replace(/"/g, '').split(','))
                    .filter(parts => parts.length > 1 && parts[0].toLowerCase().endsWith('.exe'))
                    .map(parts => ({
                        name: parts[0],
                        pid: parts[1],
                        memoryUsage: parts[4]
                    }));

                resolve(apps);
            } catch (err) {
                reject(err);
            }
        });
    });
}

async function checkRunningApps() {
    try {
        const currentApps = await getRunningApps();
        const currentAppMap = new Map(currentApps.map(app => [app.pid, app]));

        // Detect new apps
        const newApps = currentApps.filter(app => !previousApps.has(app.pid));

        // Detect closed apps
        const closedAppPIDs = Array.from(previousApps.keys()).filter(pid => !currentAppMap.has(pid));

        // Update previousApps map
        previousApps = currentAppMap;

        // Send updates to the renderer
        if (mainWindow) {
            mainWindow.webContents.send('update-apps', currentApps);
            if (newApps.length > 0) {
                mainWindow.webContents.send('apps-started', newApps);
            }
            if (closedAppPIDs.length > 0) {
                mainWindow.webContents.send('apps-closed', closedAppPIDs);
            }
        }
    } catch (error) {
        console.error('Error checking running apps:', error);
    }
}

app.whenReady().then(() => {
    createWindow();

    // Initial check and start monitoring
    checkRunningApps();
    setInterval(checkRunningApps, 2000); // Check every 2 seconds
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});