// Agent Model
export interface Agent {
  id: string;
  name: string;
  description: string;
  prompt: string;
  command: string;
  working_directory?: string;
  env_vars?: Record<string, string>;
  tags?: string[];
  created_at: string;
  updated_at: string;
}

export interface AgentCreateInput {
  name: string;
  description: string;
  prompt: string;
  command?: string;
  working_directory?: string;
  env_vars?: Record<string, string>;
  tags?: string[];
}

export interface AgentUpdateInput {
  name?: string;
  description?: string;
  prompt?: string;
  command?: string;
  working_directory?: string;
  env_vars?: Record<string, string>;
  tags?: string[];
}

// Schedule Model
export type RecurrenceType = 'one_time' | 'daily' | 'weekly' | 'monthly';
export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6; // Sunday = 0

export interface Schedule {
  id: string;
  agent_id: string;
  name: string;
  start_datetime: string; // ISO string
  timezone: string; // IANA timezone string
  recurrence_type: RecurrenceType;
  recurrence_interval: number;
  days_of_week?: DayOfWeek[];
  day_of_month?: number;
  run_window_minutes?: number;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface ScheduleCreateInput {
  agent_id: string;
  name: string;
  start_datetime: string;
  timezone: string;
  recurrence_type: RecurrenceType;
  recurrence_interval?: number;
  days_of_week?: DayOfWeek[];
  day_of_month?: number;
  run_window_minutes?: number;
  enabled?: boolean;
}

export interface ScheduleUpdateInput {
  name?: string;
  start_datetime?: string;
  timezone?: string;
  recurrence_type?: RecurrenceType;
  recurrence_interval?: number;
  days_of_week?: DayOfWeek[];
  day_of_month?: number;
  run_window_minutes?: number;
  enabled?: boolean;
}

// Run/Execution Model
export type RunStatus = 'queued' | 'running' | 'succeeded' | 'failed' | 'canceled' | 'timed_out';

export interface Run {
  id: string;
  agent_id: string;
  schedule_id?: string;
  planned_start: string;
  actual_start?: string;
  actual_end?: string;
  status: RunStatus;
  exit_code?: number;
  stdout_path?: string;
  stderr_path?: string;
  error_message?: string;
  created_at: string;
}

export interface RunCreateInput {
  agent_id: string;
  schedule_id?: string;
  planned_start: string;
  status?: RunStatus;
}

// Calendar Event (for React Big Calendar)
export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: {
    agentId: string;
    scheduleId?: string;
    runId?: string;
    status?: RunStatus;
    type: 'scheduled' | 'run';
  };
}

// IPC Channel types
export interface IpcChannels {
  // Agents
  'agents:list': () => Agent[];
  'agents:get': (id: string) => Agent | null;
  'agents:create': (input: AgentCreateInput) => Agent;
  'agents:update': (id: string, input: AgentUpdateInput) => Agent;
  'agents:delete': (id: string) => boolean;

  // Schedules
  'schedules:list': () => Schedule[];
  'schedules:listForAgent': (agentId: string) => Schedule[];
  'schedules:get': (id: string) => Schedule | null;
  'schedules:create': (input: ScheduleCreateInput) => Schedule;
  'schedules:update': (id: string, input: ScheduleUpdateInput) => Schedule;
  'schedules:delete': (id: string) => boolean;
  'schedules:toggle': (id: string, enabled: boolean) => Schedule;
  'schedules:getNextRuns': (limit?: number) => ScheduledRunInfo[];

  // Runs
  'runs:list': (limit?: number) => Run[];
  'runs:listForAgent': (agentId: string, limit?: number) => Run[];
  'runs:get': (id: string) => Run | null;
  'runs:getLogs': (id: string) => { stdout: string; stderr: string };
  'runs:runNow': (agentId: string) => Run;
  'runs:stop': (id: string) => boolean;

  // System
  'system:getTimezones': () => string[];
}

// Scheduled run info for calendar display
export interface ScheduledRunInfo {
  scheduleId: string;
  scheduleName: string;
  agentId: string;
  agentName: string;
  nextRun: string;
  timezone: string;
  runWindowMinutes?: number;
  enabled: boolean;
}

// Agent with schedule info
export interface AgentWithSchedules extends Agent {
  schedules: Schedule[];
  nextScheduledRun?: string;
  lastRun?: Run;
}

// Settings
export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  runOverlapPolicy: 'queue' | 'skip';
  maxConcurrentRuns: number;
  logRetentionDays: number;
  startMinimized: boolean;
  showNotifications: boolean;
}

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'system',
  runOverlapPolicy: 'queue',
  maxConcurrentRuns: 3,
  logRetentionDays: 30,
  startMinimized: false,
  showNotifications: true,
};

// WebTaskRunner interface (stub for browser automation)
export interface WebTaskAction {
  type: 'navigate' | 'click' | 'type' | 'wait' | 'screenshot' | 'extract';
  target?: string; // CSS selector or URL
  value?: string;
  timeout?: number;
}

export interface WebTaskResult {
  success: boolean;
  actions: WebTaskAction[];
  logs: string[];
  error?: string;
}

export interface WebTaskRunner {
  run(actions: WebTaskAction[]): Promise<WebTaskResult>;
  isAvailable(): boolean;
}
