import { contextBridge, ipcRenderer } from 'electron';
import { IPCChannel, IPCResponse } from '../shared/types';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Agents
  getAgents: () => ipcRenderer.invoke(IPCChannel.GET_AGENTS),
  getAgent: (id: string) => ipcRenderer.invoke(IPCChannel.GET_AGENT, id),
  createAgent: (input: any) => ipcRenderer.invoke(IPCChannel.CREATE_AGENT, input),
  updateAgent: (input: any) => ipcRenderer.invoke(IPCChannel.UPDATE_AGENT, input),
  deleteAgent: (id: string) => ipcRenderer.invoke(IPCChannel.DELETE_AGENT, id),

  // Schedules
  getSchedules: () => ipcRenderer.invoke(IPCChannel.GET_SCHEDULES),
  getSchedule: (id: string) => ipcRenderer.invoke(IPCChannel.GET_SCHEDULE, id),
  createSchedule: (input: any) => ipcRenderer.invoke(IPCChannel.CREATE_SCHEDULE, input),
  updateSchedule: (input: any) => ipcRenderer.invoke(IPCChannel.UPDATE_SCHEDULE, input),
  deleteSchedule: (id: string) => ipcRenderer.invoke(IPCChannel.DELETE_SCHEDULE, id),
  toggleSchedule: (id: string) => ipcRenderer.invoke(IPCChannel.TOGGLE_SCHEDULE, id),

  // Runs
  getRuns: (limit?: number) => ipcRenderer.invoke(IPCChannel.GET_RUNS, limit),
  getRun: (id: string) => ipcRenderer.invoke(IPCChannel.GET_RUN, id),
  runNow: (agentId: string) => ipcRenderer.invoke(IPCChannel.RUN_NOW, agentId),
  stopRun: (runId: string) => ipcRenderer.invoke(IPCChannel.STOP_RUN, runId),
  getRunLogs: (runId: string) => ipcRenderer.invoke(IPCChannel.GET_RUN_LOGS, runId),

  // Calendar
  getCalendarEvents: (startDate: string, endDate: string) => ipcRenderer.invoke(IPCChannel.GET_CALENDAR_EVENTS, startDate, endDate),

  // Analytics
  getAnalytics: () => ipcRenderer.invoke(IPCChannel.GET_ANALYTICS),

  // System
  getTimezones: () => ipcRenderer.invoke(IPCChannel.GET_TIMEZONES),

  // Event listeners
  onRunStarted: (callback: (run: any) => void) => {
    ipcRenderer.on('run-started', (_, run) => callback(run));
  },
  onRunCompleted: (callback: (run: any) => void) => {
    ipcRenderer.on('run-completed', (_, run) => callback(run));
  },
});

// Type declarations for TypeScript
declare global {
  interface Window {
    electronAPI: {
      getAgents: () => Promise<IPCResponse>;
      getAgent: (id: string) => Promise<IPCResponse>;
      createAgent: (input: any) => Promise<IPCResponse>;
      updateAgent: (input: any) => Promise<IPCResponse>;
      deleteAgent: (id: string) => Promise<IPCResponse>;
      getSchedules: () => Promise<IPCResponse>;
      getSchedule: (id: string) => Promise<IPCResponse>;
      createSchedule: (input: any) => Promise<IPCResponse>;
      updateSchedule: (input: any) => Promise<IPCResponse>;
      deleteSchedule: (id: string) => Promise<IPCResponse>;
      toggleSchedule: (id: string) => Promise<IPCResponse>;
      getRuns: (limit?: number) => Promise<IPCResponse>;
      getRun: (id: string) => Promise<IPCResponse>;
      runNow: (agentId: string) => Promise<IPCResponse>;
      stopRun: (runId: string) => Promise<IPCResponse>;
      getRunLogs: (runId: string) => Promise<IPCResponse>;
      getCalendarEvents: (startDate: string, endDate: string) => Promise<IPCResponse>;
      getAnalytics: () => Promise<IPCResponse>;
      getTimezones: () => Promise<IPCResponse>;
      onRunStarted: (callback: (run: any) => void) => void;
      onRunCompleted: (callback: (run: any) => void) => void;
    };
  }
}
