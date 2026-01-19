import Database from 'better-sqlite3';
import { app } from 'electron';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { runMigrations } from './migrations';
import type {
  Agent,
  AgentCreateInput,
  AgentUpdateInput,
  Schedule,
  ScheduleCreateInput,
  ScheduleUpdateInput,
  Run,
  RunCreateInput,
  RunStatus,
  AppSettings,
  DEFAULT_SETTINGS,
} from '../../shared/types';

let db: Database.Database | null = null;

export function getDatabase(): Database.Database {
  if (db) return db;

  const userDataPath = app.getPath('userData');
  const dbPath = path.join(userDataPath, 'claude-agent-scheduler.db');
  const logsPath = path.join(userDataPath, 'logs');

  // Ensure logs directory exists
  if (!fs.existsSync(logsPath)) {
    fs.mkdirSync(logsPath, { recursive: true });
  }

  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  runMigrations(db);

  return db;
}

export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
  }
}

export function getLogsPath(): string {
  return path.join(app.getPath('userData'), 'logs');
}

// Agent operations
export const agentOps = {
  list(): Agent[] {
    const db = getDatabase();
    const rows = db.prepare('SELECT * FROM agents ORDER BY created_at DESC').all() as any[];
    return rows.map(parseAgentRow);
  },

  get(id: string): Agent | null {
    const db = getDatabase();
    const row = db.prepare('SELECT * FROM agents WHERE id = ?').get(id) as any;
    return row ? parseAgentRow(row) : null;
  },

  create(input: AgentCreateInput): Agent {
    const db = getDatabase();
    const id = uuidv4();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO agents (id, name, description, prompt, command, working_directory, env_vars, tags, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      input.name,
      input.description,
      input.prompt,
      input.command || 'claude',
      input.working_directory || null,
      input.env_vars ? JSON.stringify(input.env_vars) : null,
      input.tags ? JSON.stringify(input.tags) : null,
      now,
      now
    );

    return agentOps.get(id)!;
  },

  update(id: string, input: AgentUpdateInput): Agent {
    const db = getDatabase();
    const agent = agentOps.get(id);
    if (!agent) throw new Error(`Agent not found: ${id}`);

    const updates: string[] = [];
    const values: any[] = [];

    if (input.name !== undefined) {
      updates.push('name = ?');
      values.push(input.name);
    }
    if (input.description !== undefined) {
      updates.push('description = ?');
      values.push(input.description);
    }
    if (input.prompt !== undefined) {
      updates.push('prompt = ?');
      values.push(input.prompt);
    }
    if (input.command !== undefined) {
      updates.push('command = ?');
      values.push(input.command);
    }
    if (input.working_directory !== undefined) {
      updates.push('working_directory = ?');
      values.push(input.working_directory || null);
    }
    if (input.env_vars !== undefined) {
      updates.push('env_vars = ?');
      values.push(input.env_vars ? JSON.stringify(input.env_vars) : null);
    }
    if (input.tags !== undefined) {
      updates.push('tags = ?');
      values.push(input.tags ? JSON.stringify(input.tags) : null);
    }

    if (updates.length > 0) {
      updates.push('updated_at = ?');
      values.push(new Date().toISOString());
      values.push(id);

      db.prepare(`UPDATE agents SET ${updates.join(', ')} WHERE id = ?`).run(...values);
    }

    return agentOps.get(id)!;
  },

  delete(id: string): boolean {
    const db = getDatabase();
    const result = db.prepare('DELETE FROM agents WHERE id = ?').run(id);
    return result.changes > 0;
  },
};

// Schedule operations
export const scheduleOps = {
  list(): Schedule[] {
    const db = getDatabase();
    const rows = db.prepare('SELECT * FROM schedules ORDER BY created_at DESC').all() as any[];
    return rows.map(parseScheduleRow);
  },

  listForAgent(agentId: string): Schedule[] {
    const db = getDatabase();
    const rows = db.prepare('SELECT * FROM schedules WHERE agent_id = ? ORDER BY created_at DESC').all(agentId) as any[];
    return rows.map(parseScheduleRow);
  },

  listEnabled(): Schedule[] {
    const db = getDatabase();
    const rows = db.prepare('SELECT * FROM schedules WHERE enabled = 1 ORDER BY start_datetime').all() as any[];
    return rows.map(parseScheduleRow);
  },

  get(id: string): Schedule | null {
    const db = getDatabase();
    const row = db.prepare('SELECT * FROM schedules WHERE id = ?').get(id) as any;
    return row ? parseScheduleRow(row) : null;
  },

  create(input: ScheduleCreateInput): Schedule {
    const db = getDatabase();
    const id = uuidv4();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO schedules (id, agent_id, name, start_datetime, timezone, recurrence_type, recurrence_interval, days_of_week, day_of_month, run_window_minutes, enabled, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      input.agent_id,
      input.name,
      input.start_datetime,
      input.timezone,
      input.recurrence_type,
      input.recurrence_interval || 1,
      input.days_of_week ? JSON.stringify(input.days_of_week) : null,
      input.day_of_month || null,
      input.run_window_minutes || null,
      input.enabled !== false ? 1 : 0,
      now,
      now
    );

    return scheduleOps.get(id)!;
  },

  update(id: string, input: ScheduleUpdateInput): Schedule {
    const db = getDatabase();
    const schedule = scheduleOps.get(id);
    if (!schedule) throw new Error(`Schedule not found: ${id}`);

    const updates: string[] = [];
    const values: any[] = [];

    if (input.name !== undefined) {
      updates.push('name = ?');
      values.push(input.name);
    }
    if (input.start_datetime !== undefined) {
      updates.push('start_datetime = ?');
      values.push(input.start_datetime);
    }
    if (input.timezone !== undefined) {
      updates.push('timezone = ?');
      values.push(input.timezone);
    }
    if (input.recurrence_type !== undefined) {
      updates.push('recurrence_type = ?');
      values.push(input.recurrence_type);
    }
    if (input.recurrence_interval !== undefined) {
      updates.push('recurrence_interval = ?');
      values.push(input.recurrence_interval);
    }
    if (input.days_of_week !== undefined) {
      updates.push('days_of_week = ?');
      values.push(input.days_of_week ? JSON.stringify(input.days_of_week) : null);
    }
    if (input.day_of_month !== undefined) {
      updates.push('day_of_month = ?');
      values.push(input.day_of_month || null);
    }
    if (input.run_window_minutes !== undefined) {
      updates.push('run_window_minutes = ?');
      values.push(input.run_window_minutes || null);
    }
    if (input.enabled !== undefined) {
      updates.push('enabled = ?');
      values.push(input.enabled ? 1 : 0);
    }

    if (updates.length > 0) {
      updates.push('updated_at = ?');
      values.push(new Date().toISOString());
      values.push(id);

      db.prepare(`UPDATE schedules SET ${updates.join(', ')} WHERE id = ?`).run(...values);
    }

    return scheduleOps.get(id)!;
  },

  delete(id: string): boolean {
    const db = getDatabase();
    const result = db.prepare('DELETE FROM schedules WHERE id = ?').run(id);
    return result.changes > 0;
  },

  toggle(id: string, enabled: boolean): Schedule {
    return scheduleOps.update(id, { enabled });
  },
};

// Run operations
export const runOps = {
  list(limit: number = 50): Run[] {
    const db = getDatabase();
    const rows = db.prepare('SELECT * FROM runs ORDER BY created_at DESC LIMIT ?').all(limit) as any[];
    return rows.map(parseRunRow);
  },

  listForAgent(agentId: string, limit: number = 50): Run[] {
    const db = getDatabase();
    const rows = db.prepare('SELECT * FROM runs WHERE agent_id = ? ORDER BY created_at DESC LIMIT ?').all(agentId, limit) as any[];
    return rows.map(parseRunRow);
  },

  listQueued(): Run[] {
    const db = getDatabase();
    const rows = db.prepare("SELECT * FROM runs WHERE status = 'queued' ORDER BY planned_start").all() as any[];
    return rows.map(parseRunRow);
  },

  listRunning(): Run[] {
    const db = getDatabase();
    const rows = db.prepare("SELECT * FROM runs WHERE status = 'running'").all() as any[];
    return rows.map(parseRunRow);
  },

  get(id: string): Run | null {
    const db = getDatabase();
    const row = db.prepare('SELECT * FROM runs WHERE id = ?').get(id) as any;
    return row ? parseRunRow(row) : null;
  },

  create(input: RunCreateInput): Run {
    const db = getDatabase();
    const id = uuidv4();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO runs (id, agent_id, schedule_id, planned_start, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      id,
      input.agent_id,
      input.schedule_id || null,
      input.planned_start,
      input.status || 'queued',
      now
    );

    return runOps.get(id)!;
  },

  updateStatus(id: string, status: RunStatus, extra?: {
    actual_start?: string;
    actual_end?: string;
    exit_code?: number;
    stdout_path?: string;
    stderr_path?: string;
    error_message?: string;
  }): Run {
    const db = getDatabase();
    const updates: string[] = ['status = ?'];
    const values: any[] = [status];

    if (extra?.actual_start) {
      updates.push('actual_start = ?');
      values.push(extra.actual_start);
    }
    if (extra?.actual_end) {
      updates.push('actual_end = ?');
      values.push(extra.actual_end);
    }
    if (extra?.exit_code !== undefined) {
      updates.push('exit_code = ?');
      values.push(extra.exit_code);
    }
    if (extra?.stdout_path) {
      updates.push('stdout_path = ?');
      values.push(extra.stdout_path);
    }
    if (extra?.stderr_path) {
      updates.push('stderr_path = ?');
      values.push(extra.stderr_path);
    }
    if (extra?.error_message) {
      updates.push('error_message = ?');
      values.push(extra.error_message);
    }

    values.push(id);
    db.prepare(`UPDATE runs SET ${updates.join(', ')} WHERE id = ?`).run(...values);

    return runOps.get(id)!;
  },

  getLastForAgent(agentId: string): Run | null {
    const db = getDatabase();
    const row = db.prepare('SELECT * FROM runs WHERE agent_id = ? ORDER BY created_at DESC LIMIT 1').get(agentId) as any;
    return row ? parseRunRow(row) : null;
  },

  cleanOldRuns(olderThanDays: number): number {
    const db = getDatabase();
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - olderThanDays);
    const result = db.prepare("DELETE FROM runs WHERE created_at < ? AND status NOT IN ('queued', 'running')").run(cutoff.toISOString());
    return result.changes;
  },
};

// Settings operations
export const settingsOps = {
  get<K extends keyof AppSettings>(key: K): AppSettings[K] | null {
    const db = getDatabase();
    const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key) as { value: string } | undefined;
    if (row) {
      try {
        return JSON.parse(row.value);
      } catch {
        return row.value as any;
      }
    }
    return null;
  },

  set<K extends keyof AppSettings>(key: K, value: AppSettings[K]): void {
    const db = getDatabase();
    db.prepare(`
      INSERT INTO settings (key, value) VALUES (?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `).run(key, JSON.stringify(value));
  },

  getAll(): Partial<AppSettings> {
    const db = getDatabase();
    const rows = db.prepare('SELECT key, value FROM settings').all() as { key: string; value: string }[];
    const settings: Partial<AppSettings> = {};
    for (const row of rows) {
      try {
        (settings as any)[row.key] = JSON.parse(row.value);
      } catch {
        (settings as any)[row.key] = row.value;
      }
    }
    return settings;
  },
};

// Helper functions
function parseAgentRow(row: any): Agent {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    prompt: row.prompt,
    command: row.command,
    working_directory: row.working_directory || undefined,
    env_vars: row.env_vars ? JSON.parse(row.env_vars) : undefined,
    tags: row.tags ? JSON.parse(row.tags) : undefined,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function parseScheduleRow(row: any): Schedule {
  return {
    id: row.id,
    agent_id: row.agent_id,
    name: row.name,
    start_datetime: row.start_datetime,
    timezone: row.timezone,
    recurrence_type: row.recurrence_type,
    recurrence_interval: row.recurrence_interval,
    days_of_week: row.days_of_week ? JSON.parse(row.days_of_week) : undefined,
    day_of_month: row.day_of_month || undefined,
    run_window_minutes: row.run_window_minutes || undefined,
    enabled: row.enabled === 1,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function parseRunRow(row: any): Run {
  return {
    id: row.id,
    agent_id: row.agent_id,
    schedule_id: row.schedule_id || undefined,
    planned_start: row.planned_start,
    actual_start: row.actual_start || undefined,
    actual_end: row.actual_end || undefined,
    status: row.status,
    exit_code: row.exit_code,
    stdout_path: row.stdout_path || undefined,
    stderr_path: row.stderr_path || undefined,
    error_message: row.error_message || undefined,
    created_at: row.created_at,
  };
}
