import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import isDev from 'electron-is-dev';
import { DatabaseService } from './database';
import { SchedulerService } from './scheduler';
import { RunnerService } from './runner';
import { seedDatabase } from './seeder';
import { IPCChannel, IPCResponse } from '../shared/types';
import { listTimeZones } from 'date-fns-tz';

let mainWindow: BrowserWindow | null = null;
let db: DatabaseService;
let runner: RunnerService;
let scheduler: SchedulerService;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 600,
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#ffffff',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  const startURL = isDev
    ? 'http://localhost:3000'
    : `file://${path.join(__dirname, '../renderer/out/index.html')}`;

  mainWindow.loadURL(startURL);

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function setupIPC() {
  // Agent handlers
  ipcMain.handle(IPCChannel.GET_AGENTS, async (): Promise<IPCResponse> => {
    try {
      const agents = db.getAllAgents();
      return { success: true, data: agents };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle(IPCChannel.GET_AGENT, async (_, id: string): Promise<IPCResponse> => {
    try {
      const agent = db.getAgent(id);
      if (!agent) {
        return { success: false, error: 'Agent not found' };
      }
      return { success: true, data: agent };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle(IPCChannel.CREATE_AGENT, async (_, input): Promise<IPCResponse> => {
    try {
      const agent = db.createAgent(input);
      return { success: true, data: agent };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle(IPCChannel.UPDATE_AGENT, async (_, input): Promise<IPCResponse> => {
    try {
      const agent = db.updateAgent(input);
      if (!agent) {
        return { success: false, error: 'Agent not found' };
      }
      return { success: true, data: agent };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle(IPCChannel.DELETE_AGENT, async (_, id: string): Promise<IPCResponse> => {
    try {
      const success = db.deleteAgent(id);
      return { success, error: success ? undefined : 'Agent not found' };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  // Schedule handlers
  ipcMain.handle(IPCChannel.GET_SCHEDULES, async (): Promise<IPCResponse> => {
    try {
      const schedules = db.getAllSchedules();
      return { success: true, data: schedules };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle(IPCChannel.GET_SCHEDULE, async (_, id: string): Promise<IPCResponse> => {
    try {
      const schedule = db.getSchedule(id);
      if (!schedule) {
        return { success: false, error: 'Schedule not found' };
      }
      return { success: true, data: schedule };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle(IPCChannel.CREATE_SCHEDULE, async (_, input): Promise<IPCResponse> => {
    try {
      const schedule = db.createSchedule(input);
      scheduler.reschedule(schedule.id);
      return { success: true, data: schedule };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle(IPCChannel.UPDATE_SCHEDULE, async (_, input): Promise<IPCResponse> => {
    try {
      const schedule = db.updateSchedule(input);
      if (!schedule) {
        return { success: false, error: 'Schedule not found' };
      }
      scheduler.reschedule(schedule.id);
      return { success: true, data: schedule };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle(IPCChannel.DELETE_SCHEDULE, async (_, id: string): Promise<IPCResponse> => {
    try {
      const success = db.deleteSchedule(id);
      if (success) {
        scheduler.reschedule(id); // This will remove it from scheduler
      }
      return { success, error: success ? undefined : 'Schedule not found' };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle(IPCChannel.TOGGLE_SCHEDULE, async (_, id: string): Promise<IPCResponse> => {
    try {
      const schedule = db.toggleSchedule(id);
      if (!schedule) {
        return { success: false, error: 'Schedule not found' };
      }
      scheduler.reschedule(id);
      return { success: true, data: schedule };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  // Run handlers
  ipcMain.handle(IPCChannel.GET_RUNS, async (_, limit?: number): Promise<IPCResponse> => {
    try {
      const runs = db.getAllRuns(limit);
      return { success: true, data: runs };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle(IPCChannel.GET_RUN, async (_, id: string): Promise<IPCResponse> => {
    try {
      const run = db.getRun(id);
      if (!run) {
        return { success: false, error: 'Run not found' };
      }
      return { success: true, data: run };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle(IPCChannel.RUN_NOW, async (_, agentId: string): Promise<IPCResponse> => {
    try {
      const agent = db.getAgent(agentId);
      if (!agent) {
        return { success: false, error: 'Agent not found' };
      }

      const run = db.createRun({
        agent_id: agentId,
        planned_start: new Date().toISOString(),
      });

      runner.executeRun(run.id);

      return { success: true, data: run };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle(IPCChannel.STOP_RUN, async (_, runId: string): Promise<IPCResponse> => {
    try {
      const success = runner.stopRun(runId);
      return { success, error: success ? undefined : 'Run not found or not running' };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle(IPCChannel.GET_RUN_LOGS, async (_, runId: string): Promise<IPCResponse> => {
    try {
      const run = db.getRun(runId);
      if (!run) {
        return { success: false, error: 'Run not found' };
      }

      let stdout = '';
      let stderr = '';

      // Check if run is active
      if (runner.isRunning(runId)) {
        const logs = runner.getActiveLogs(runId);
        if (logs) {
          stdout = logs.stdout;
          stderr = logs.stderr;
        }
      } else if (run.stdout_path || run.stderr_path) {
        // Read from saved log files
        if (run.stdout_path && fs.existsSync(run.stdout_path)) {
          stdout = fs.readFileSync(run.stdout_path, 'utf-8');
        }
        if (run.stderr_path && fs.existsSync(run.stderr_path)) {
          stderr = fs.readFileSync(run.stderr_path, 'utf-8');
        }
      }

      return { success: true, data: { stdout, stderr } };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  // Calendar handlers
  ipcMain.handle(IPCChannel.GET_CALENDAR_EVENTS, async (_, startDate: string, endDate: string): Promise<IPCResponse> => {
    try {
      const schedules = db.getEnabledSchedules();
      const events = [];

      for (const schedule of schedules) {
        const agent = db.getAgent(schedule.agent_id);
        if (!agent) continue;

        // Calculate occurrences within date range
        const start = new Date(startDate);
        const end = new Date(endDate);
        const occurrences = calculateOccurrences(schedule, start, end);

        for (const occurrence of occurrences) {
          events.push({
            id: `${schedule.id}-${occurrence.getTime()}`,
            title: agent.name,
            start: occurrence,
            end: schedule.run_window_minutes
              ? new Date(occurrence.getTime() + schedule.run_window_minutes * 60000)
              : new Date(occurrence.getTime() + 3600000), // Default 1 hour
            resource: {
              schedule,
              agent,
            },
          });
        }
      }

      return { success: true, data: events };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  // System handlers
  ipcMain.handle(IPCChannel.GET_TIMEZONES, async (): Promise<IPCResponse> => {
    try {
      const timezones = listTimeZones();
      return { success: true, data: timezones };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });
}

function calculateOccurrences(schedule: any, start: Date, end: Date): Date[] {
  const occurrences: Date[] = [];
  let current = scheduler.calculateNextRun(schedule, start);

  while (current && current <= end) {
    occurrences.push(new Date(current));
    // Get next occurrence after this one
    current = scheduler.calculateNextRun(schedule, new Date(current.getTime() + 60000));

    // Safety limit
    if (occurrences.length > 100) break;
  }

  return occurrences;
}

app.whenReady().then(() => {
  // Initialize services
  db = new DatabaseService();
  runner = new RunnerService(db);
  scheduler = new SchedulerService(db, runner);

  // Seed database with template agent if first run
  seedDatabase(db);

  // Set up IPC handlers
  setupIPC();

  // Start scheduler
  scheduler.start();

  // Create window
  createWindow();

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

app.on('before-quit', () => {
  scheduler.stop();
  db.close();
});
