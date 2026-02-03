const { app, BrowserWindow, net, ipcMain } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs/promises');
const fsSync = require('fs');

const SERVER_URL = process.env.TEXTGEN_URL || 'http://127.0.0.1:7860/?__theme=dark';
const WAIT_TIMEOUT_MS = 120000;
const POLL_INTERVAL_MS = 1000;
const AUTO_START_SERVER = (process.env.TEXTGEN_AUTO_START || '0') === '1';
const PYTHON_CMD = process.env.TEXTGEN_PYTHON || 'python';
const SERVER_ARGS = (process.env.TEXTGEN_SERVER_ARGS || '').split(' ').filter(Boolean);
let serverProcess = null;
let launcherWindow = null;
let webUiWindow = null;

// Get the correct repository root path
const getRepoRoot = () => {
  // HARDCODED PATH - Edit this line with your actual path
  return 'D:\\_src\\2026\\electron-fiddle\\text-gen-webui\\text-generation-webui';
};

const startServer = () => {
  if (!AUTO_START_SERVER || serverProcess) {
    return;
  }

  const repoRoot = getRepoRoot();
  serverProcess = spawn(PYTHON_CMD, ['server.py', ...SERVER_ARGS], {
    cwd: repoRoot,
    stdio: 'inherit',
    shell: true,
  });

  serverProcess.on('exit', () => {
    serverProcess = null;
  });
};

const waitForServer = () =>
  new Promise((resolve, reject) => {
    const startTime = Date.now();

    const probe = () => {
      const request = net.request(SERVER_URL);
      request.on('response', () => resolve());
      request.on('error', () => {
        if (Date.now() - startTime >= WAIT_TIMEOUT_MS) {
          reject(new Error('Timed out waiting for server'));
          return;
        }
        setTimeout(probe, POLL_INTERVAL_MS);
      });
      request.end();
    };

    probe();
  });

const createLauncherWindow = () => {
  launcherWindow = new BrowserWindow({
    width: 1100,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  launcherWindow.loadFile(path.join(__dirname, 'index.html'));
};

const createWebUiWindow = async () => {
  if (webUiWindow && !webUiWindow.isDestroyed()) {
    webUiWindow.focus();
    return;
  }

  webUiWindow = new BrowserWindow({
    width: 1280,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  await waitForServer();
  await webUiWindow.loadURL(SERVER_URL);
};

app.whenReady().then(() => {
  createLauncherWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createLauncherWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  if (serverProcess && !serverProcess.killed) {
    serverProcess.kill();
  }
});

ipcMain.handle('start-server', async () => {
  if (serverProcess) {
    return { success: true, message: 'Server already running' };
  }

  try {
    const repoRoot = getRepoRoot();
    const serverPath = path.join(repoRoot, 'server.py');
    
    console.log('Checking for server.py at:', serverPath);
    
    await fs.access(serverPath);
    
    serverProcess = spawn(PYTHON_CMD, ['server.py', ...SERVER_ARGS], {
      cwd: repoRoot,
      stdio: 'inherit',
      shell: true,
    });

    serverProcess.on('exit', (code) => {
      serverProcess = null;
    });

    serverProcess.on('error', (error) => {
      serverProcess = null;
      throw error;
    });

    return { success: true, message: 'Server started' };
  } catch (error) {
    const repoRoot = getRepoRoot();
    const serverPath = path.join(repoRoot, 'server.py');
    return { 
      success: false, 
      message: `${error.message}. Looking for server.py at: ${serverPath}` 
    };
  }
});

ipcMain.handle('open-web-ui', async () => {
  try {
    if (!serverProcess) {
      const repoRoot = getRepoRoot();
      const serverPath = path.join(repoRoot, 'server.py');
      
      console.log('Checking for server.py at:', serverPath);
      
      await fs.access(serverPath);
      
      serverProcess = spawn(PYTHON_CMD, ['server.py', ...SERVER_ARGS], {
        cwd: repoRoot,
        stdio: 'inherit',
        shell: true,
      });

      serverProcess.on('exit', () => {
        serverProcess = null;
      });

      serverProcess.on('error', (error) => {
        serverProcess = null;
        throw error;
      });
    }

    await createWebUiWindow();
    return { success: true, message: 'Web UI opened' };
  } catch (error) {
    const repoRoot = getRepoRoot();
    const serverPath = path.join(repoRoot, 'server.py');
    return { 
      success: false, 
      message: `${error.message}. Looking for server.py at: ${serverPath}` 
    };
  }
});

ipcMain.handle('download-model', async (event, modelId) => {
  if (!modelId || typeof modelId !== 'string' || !modelId.trim()) {
    throw new Error('Valid model id is required');
  }

  const repoRoot = getRepoRoot();
  const modelsDir = path.join(repoRoot, 'models');
  
  try {
    await fs.access(modelsDir);
  } catch (error) {
    if (error.code === 'ENOENT') {
      await fs.mkdir(modelsDir, { recursive: true });
    }
  }

  return new Promise((resolve, reject) => {
    const downloadScript = path.join(repoRoot, 'download-model.py');
    const proc = spawn(PYTHON_CMD, [downloadScript, modelId.trim()], {
      cwd: repoRoot,
      shell: true,
    });

    proc.stdout.on('data', (data) => {
      if (event.sender && !event.sender.isDestroyed()) {
        event.sender.send('download-output', data.toString());
      }
    });
    proc.stderr.on('data', (data) => {
      if (event.sender && !event.sender.isDestroyed()) {
        event.sender.send('download-output', data.toString());
      }
    });
    proc.on('error', (err) => reject(err));
    proc.on('close', (code) => {
      if (code === 0) {
        resolve(code);
      } else {
        reject(new Error(`Download process exited with code ${code}`));
      }
    });
  });
});

ipcMain.handle('list-local-models', async () => {
  const repoRoot = getRepoRoot();
  const modelsDir = path.join(repoRoot, 'models');
  try {
    await fs.access(modelsDir);
    const entries = await fs.readdir(modelsDir, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort((a, b) => a.localeCompare(b));
  } catch (error) {
    if (error.code === 'ENOENT') {
      return [];
    }
    throw error;
  }
});
