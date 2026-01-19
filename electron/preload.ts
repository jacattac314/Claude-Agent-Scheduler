import { contextBridge, ipcRenderer } from 'electron';
import type {
  Agent,
  AgentCreateInput,
  AgentUpdateInput,
  Schedule,
  ScheduleCreateInput,
  ScheduleUpdateInput,
  Run,
  ScheduledRunInfo,
  AppSettings,
} from '../shared/types';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
const api = {
  // Agent methods
  agents: {
    list: (): Promise<Agent[]> => ipcRenderer.invoke('agents:list'),
    get: (id: string): Promise<Agent | null> => ipcRenderer.invoke('agents:get', id),
    create: (input: AgentCreateInput): Promise<Agent> => ipcRenderer.invoke('agents:create', input),
    update: (id: string, input: AgentUpdateInput): Promise<Agent> => ipcRenderer.invoke('agents:update', id, input),
    delete: (id: string): Promise<boolean> => ipcRenderer.invoke('agents:delete', id),
  },

  // Schedule methods
  schedules: {
    list: (): Promise<Schedule[]> => ipcRenderer.invoke('schedules:list'),
    listForAgent: (agentId: string): Promise<Schedule[]> => ipcRenderer.invoke('schedules:listForAgent', agentId),
    get: (id: string): Promise<Schedule | null> => ipcRenderer.invoke('schedules:get', id),
    create: (input: ScheduleCreateInput): Promise<Schedule> => ipcRenderer.invoke('schedules:create', input),
    update: (id: string, input: ScheduleUpdateInput): Promise<Schedule> => ipcRenderer.invoke('schedules:update', id, input),
    delete: (id: string): Promise<boolean> => ipcRenderer.invoke('schedules:delete', id),
    toggle: (id: string, enabled: boolean): Promise<Schedule> => ipcRenderer.invoke('schedules:toggle', id, enabled),
    getNextRuns: (limit?: number): Promise<ScheduledRunInfo[]> => ipcRenderer.invoke('schedules:getNextRuns', limit),
  },

  // Run methods
  runs: {
    list: (limit?: number): Promise<Run[]> => ipcRenderer.invoke('runs:list', limit),
    listForAgent: (agentId: string, limit?: number): Promise<Run[]> => ipcRenderer.invoke('runs:listForAgent', agentId, limit),
    get: (id: string): Promise<Run | null> => ipcRenderer.invoke('runs:get', id),
    getLogs: (id: string): Promise<{ stdout: string; stderr: string }> => ipcRenderer.invoke('runs:getLogs', id),
    runNow: (agentId: string): Promise<Run> => ipcRenderer.invoke('runs:runNow', agentId),
    stop: (id: string): Promise<boolean> => ipcRenderer.invoke('runs:stop', id),
  },

  // System methods
  system: {
    getTimezones: (): Promise<string[]> => ipcRenderer.invoke('system:getTimezones'),
    getSystemTimezone: (): Promise<string> => ipcRenderer.invoke('system:getSystemTimezone'),
  },

  // Settings methods
  settings: {
    get: <K extends keyof AppSettings>(key: K): Promise<AppSettings[K] | null> => ipcRenderer.invoke('settings:get', key),
    set: <K extends keyof AppSettings>(key: K, value: AppSettings[K]): Promise<void> => ipcRenderer.invoke('settings:set', key, value),
    getAll: (): Promise<Partial<AppSettings>> => ipcRenderer.invoke('settings:getAll'),
  },

  // Event subscriptions
  on: {
    runUpdate: (callback: (run: Run) => void) => {
      const listener = (_: any, run: Run) => callback(run);
      ipcRenderer.on('run:update', listener);
      return () => ipcRenderer.removeListener('run:update', listener);
    },
    scheduleUpdate: (callback: (schedule: Schedule) => void) => {
      const listener = (_: any, schedule: Schedule) => callback(schedule);
      ipcRenderer.on('schedule:update', listener);
      return () => ipcRenderer.removeListener('schedule:update', listener);
    },
    navigate: (callback: (path: string) => void) => {
      const listener = (_: any, path: string) => callback(path);
      ipcRenderer.on('navigate', listener);
      return () => ipcRenderer.removeListener('navigate', listener);
    },
  },
};

// Expose the API to the renderer process
contextBridge.exposeInMainWorld('electronAPI', api);

// Type declaration for the renderer process
export type ElectronAPI = typeof api;
