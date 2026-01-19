import { app, BrowserWindow, ipcMain, Menu, Tray, nativeImage } from 'electron';
import path from 'path';
import { getDatabase, closeDatabase, agentOps, scheduleOps, runOps, settingsOps } from './database';
import { initializeTemplates } from './database/templates';
import { getScheduler } from './scheduler';
import { ExecutionService } from './services/execution';
import { getCommonTimezones, getSystemTimezone } from './scheduler/recurrence';
import type {
  AgentCreateInput,
  AgentUpdateInput,
  ScheduleCreateInput,
  ScheduleUpdateInput,
} from '../shared/types';

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
const executionService = new ExecutionService();

const isDev = process.env.NODE_ENV === 'development';

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 20, y: 20 },
    backgroundColor: '#ffffff',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Load the Next.js app
  if (isDev) {
    mainWindow.loadURL('http://localhost:3456');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../.next/server/pages/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Minimize to tray instead of closing
  mainWindow.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      mainWindow?.hide();
    }
  });
}

function createTray() {
  // Create a simple tray icon
  const icon = nativeImage.createFromDataURL(
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAAdgAAAHYBTnsmCAAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAADJSURBVDiN7ZIxCsJAEEV/FltBPIKFhY2NjYW9rZ3XsLGzsba29gKeQbyBhY2NhYWFqIgIsbDYhN1kE0Xwg4Fhd+bPMDO7sJSIyABYAVZAHaiJSDNh7wDngBewA9SAeyANXCZw3wEHwLWStwM9oBJxlIA7/wS0gD7QCH6LQKbUBrgBHaAevD0AxwbwW3g1wBPoAjXgyrm3y8AYaAIP4BY4L+NflQKqQBW4j9kPQBm4AqPIZwGoA41I9zqQAqbAJOafBIbALNK+AJ/Q+QbnPe8kAAAAAElFTkSuQmCC'
  );

  tray = new Tray(icon);
  tray.setToolTip('Claude Agent Scheduler');

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Open',
      click: () => {
        mainWindow?.show();
      },
    },
    {
      label: 'Run Status',
      submenu: [
        {
          label: 'View Running Jobs',
          click: () => {
            mainWindow?.show();
            mainWindow?.webContents.send('navigate', '/runs');
          },
        },
      ],
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        app.isQuitting = true;
        app.quit();
      },
    },
  ]);

  tray.setContextMenu(contextMenu);

  tray.on('click', () => {
    mainWindow?.show();
  });
}

function setupIpcHandlers() {
  // Agent handlers
  ipcMain.handle('agents:list', () => agentOps.list());
  ipcMain.handle('agents:get', (_, id: string) => agentOps.get(id));
  ipcMain.handle('agents:create', (_, input: AgentCreateInput) => agentOps.create(input));
  ipcMain.handle('agents:update', (_, id: string, input: AgentUpdateInput) => agentOps.update(id, input));
  ipcMain.handle('agents:delete', (_, id: string) => agentOps.delete(id));

  // Schedule handlers
  ipcMain.handle('schedules:list', () => scheduleOps.list());
  ipcMain.handle('schedules:listForAgent', (_, agentId: string) => scheduleOps.listForAgent(agentId));
  ipcMain.handle('schedules:get', (_, id: string) => scheduleOps.get(id));
  ipcMain.handle('schedules:create', (_, input: ScheduleCreateInput) => {
    const schedule = scheduleOps.create(input);
    getScheduler().onScheduleChanged(schedule.id);
    return schedule;
  });
  ipcMain.handle('schedules:update', (_, id: string, input: ScheduleUpdateInput) => {
    const schedule = scheduleOps.update(id, input);
    getScheduler().onScheduleChanged(id);
    return schedule;
  });
  ipcMain.handle('schedules:delete', (_, id: string) => {
    const result = scheduleOps.delete(id);
    getScheduler().onScheduleChanged(id);
    return result;
  });
  ipcMain.handle('schedules:toggle', (_, id: string, enabled: boolean) => {
    const schedule = scheduleOps.toggle(id, enabled);
    getScheduler().onScheduleChanged(id);
    return schedule;
  });
  ipcMain.handle('schedules:getNextRuns', (_, limit?: number) => {
    return getScheduler().getNextRuns(limit);
  });

  // Run handlers
  ipcMain.handle('runs:list', (_, limit?: number) => runOps.list(limit));
  ipcMain.handle('runs:listForAgent', (_, agentId: string, limit?: number) => runOps.listForAgent(agentId, limit));
  ipcMain.handle('runs:get', (_, id: string) => runOps.get(id));
  ipcMain.handle('runs:getLogs', (_, id: string) => executionService.getLogs(id));
  ipcMain.handle('runs:runNow', async (_, agentId: string) => {
    return getScheduler().runNow(agentId);
  });
  ipcMain.handle('runs:stop', (_, id: string) => {
    return getScheduler().stopRun(id);
  });

  // System handlers
  ipcMain.handle('system:getTimezones', () => getCommonTimezones());
  ipcMain.handle('system:getSystemTimezone', () => getSystemTimezone());

  // Settings handlers
  ipcMain.handle('settings:get', (_, key: string) => settingsOps.get(key as any));
  ipcMain.handle('settings:set', (_, key: string, value: any) => settingsOps.set(key as any, value));
  ipcMain.handle('settings:getAll', () => settingsOps.getAll());
}

function setupSchedulerEvents() {
  const scheduler = getScheduler();

  scheduler.on('run:queued', (run) => {
    mainWindow?.webContents.send('run:update', run);
  });

  scheduler.on('run:started', (run) => {
    mainWindow?.webContents.send('run:update', run);
  });

  scheduler.on('run:completed', (run) => {
    mainWindow?.webContents.send('run:update', run);
  });

  scheduler.on('run:failed', (run) => {
    mainWindow?.webContents.send('run:update', run);
  });

  scheduler.on('run:timeout', (run) => {
    mainWindow?.webContents.send('run:update', run);
  });

  scheduler.on('schedule:updated', (schedule) => {
    mainWindow?.webContents.send('schedule:update', schedule);
  });
}

// App lifecycle
app.whenReady().then(async () => {
  // Initialize database
  getDatabase();

  // Initialize templates (creates default agents on first run)
  await initializeTemplates();

  // Setup IPC handlers
  setupIpcHandlers();

  // Create window
  createWindow();

  // Create tray
  createTray();

  // Start scheduler
  getScheduler().start();

  // Setup scheduler event forwarding
  setupSchedulerEvents();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    } else {
      mainWindow?.show();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  app.isQuitting = true;
  getScheduler().stop();
  closeDatabase();
});

// Extend app type
declare global {
  namespace Electron {
    interface App {
      isQuitting?: boolean;
    }
  }
}
