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

export interface CreateAgentInput {
  name: string;
  description: string;
  prompt: string;
  command?: string;
  working_directory?: string;
  env_vars?: Record<string, string>;
  tags?: string[];
}

export interface UpdateAgentInput extends Partial<CreateAgentInput> {
  id: string;
}

// Schedule Model
export type RecurrenceType = 'one_time' | 'daily' | 'weekly' | 'monthly';

export interface Schedule {
  id: string;
  agent_id: string;
  start_datetime: string;
  timezone: string;
  recurrence_type: RecurrenceType;
  recurrence_interval: number;
  days_of_week?: number[]; // 0 = Sunday, 6 = Saturday
  day_of_month?: number;
  run_window_minutes?: number;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateScheduleInput {
  agent_id: string;
  start_datetime: string;
  timezone: string;
  recurrence_type: RecurrenceType;
  recurrence_interval?: number;
  days_of_week?: number[];
  day_of_month?: number;
  run_window_minutes?: number;
  enabled?: boolean;
}

export interface UpdateScheduleInput extends Partial<CreateScheduleInput> {
  id: string;
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
}

export interface CreateRunInput {
  agent_id: string;
  schedule_id?: string;
  planned_start: string;
}

// Combined types for UI
export interface AgentWithSchedules extends Agent {
  schedules: Schedule[];
  nextRun?: {
    schedule: Schedule;
    plannedStart: Date;
  };
  lastRun?: Run;
}

export interface ScheduleWithAgent extends Schedule {
  agent: Agent;
}

export interface RunWithDetails extends Run {
  agent: Agent;
  schedule?: Schedule;
}

// Calendar event
export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: {
    run?: Run;
    schedule: Schedule;
    agent: Agent;
  };
}

// Analytics types
export interface RunStats {
  total: number;
  succeeded: number;
  failed: number;
  running: number;
  canceled: number;
  timed_out: number;
}

export interface AgentStats {
  agent_id: string;
  agent_name: string;
  total_runs: number;
  successful_runs: number;
  failed_runs: number;
  average_duration_seconds: number;
  last_run?: string;
}

export interface DailyRunData {
  date: string;
  total: number;
  succeeded: number;
  failed: number;
  timed_out: number;
}

export interface StatusBreakdown {
  status: RunStatus;
  count: number;
  percentage: number;
}

export interface Analytics {
  overview: RunStats;
  statusBreakdown: StatusBreakdown[];
  dailyRuns: DailyRunData[];
  agentPerformance: AgentStats[];
  recentActivity: Run[];
}

// IPC channels
export enum IPCChannel {
  // Agents
  GET_AGENTS = 'get-agents',
  GET_AGENT = 'get-agent',
  CREATE_AGENT = 'create-agent',
  UPDATE_AGENT = 'update-agent',
  DELETE_AGENT = 'delete-agent',

  // Schedules
  GET_SCHEDULES = 'get-schedules',
  GET_SCHEDULE = 'get-schedule',
  CREATE_SCHEDULE = 'create-schedule',
  UPDATE_SCHEDULE = 'update-schedule',
  DELETE_SCHEDULE = 'delete-schedule',
  TOGGLE_SCHEDULE = 'toggle-schedule',

  // Runs
  GET_RUNS = 'get-runs',
  GET_RUN = 'get-run',
  CREATE_RUN = 'create-run',
  RUN_NOW = 'run-now',
  STOP_RUN = 'stop-run',
  GET_RUN_LOGS = 'get-run-logs',

  // Calendar
  GET_CALENDAR_EVENTS = 'get-calendar-events',

  // Analytics
  GET_ANALYTICS = 'get-analytics',

  // System
  GET_TIMEZONES = 'get-timezones',

  // Events (renderer <- main)
  RUN_STARTED = 'run-started',
  RUN_UPDATED = 'run-updated',
  RUN_COMPLETED = 'run-completed',
}

// IPC response wrapper
export interface IPCResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}
