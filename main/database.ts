import Database from 'better-sqlite3';
import { app } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import {
  Agent,
  CreateAgentInput,
  UpdateAgentInput,
  Schedule,
  CreateScheduleInput,
  UpdateScheduleInput,
  Run,
  CreateRunInput,
  RunStatus,
} from '../shared/types';

export class DatabaseService {
  private db: Database.Database;

  constructor() {
    const userDataPath = app.getPath('userData');
    const dbPath = path.join(userDataPath, 'scheduler.db');

    // Ensure directory exists
    fs.mkdirSync(userDataPath, { recursive: true });

    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL');
    this.initialize();
  }

  private initialize() {
    // Create tables
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS agents (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        prompt TEXT NOT NULL,
        command TEXT NOT NULL DEFAULT 'claude',
        working_directory TEXT,
        env_vars TEXT,
        tags TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS schedules (
        id TEXT PRIMARY KEY,
        agent_id TEXT NOT NULL,
        start_datetime TEXT NOT NULL,
        timezone TEXT NOT NULL,
        recurrence_type TEXT NOT NULL,
        recurrence_interval INTEGER NOT NULL DEFAULT 1,
        days_of_week TEXT,
        day_of_month INTEGER,
        run_window_minutes INTEGER,
        enabled INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS runs (
        id TEXT PRIMARY KEY,
        agent_id TEXT NOT NULL,
        schedule_id TEXT,
        planned_start TEXT NOT NULL,
        actual_start TEXT,
        actual_end TEXT,
        status TEXT NOT NULL,
        exit_code INTEGER,
        stdout_path TEXT,
        stderr_path TEXT,
        error_message TEXT,
        FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE,
        FOREIGN KEY (schedule_id) REFERENCES schedules(id) ON DELETE SET NULL
      );

      CREATE INDEX IF NOT EXISTS idx_schedules_agent_id ON schedules(agent_id);
      CREATE INDEX IF NOT EXISTS idx_schedules_enabled ON schedules(enabled);
      CREATE INDEX IF NOT EXISTS idx_runs_agent_id ON runs(agent_id);
      CREATE INDEX IF NOT EXISTS idx_runs_schedule_id ON runs(schedule_id);
      CREATE INDEX IF NOT EXISTS idx_runs_status ON runs(status);
      CREATE INDEX IF NOT EXISTS idx_runs_planned_start ON runs(planned_start);
    `);
  }

  // Agent methods
  createAgent(input: CreateAgentInput): Agent {
    const id = uuidv4();
    const now = new Date().toISOString();
    const agent: Agent = {
      id,
      name: input.name,
      description: input.description,
      prompt: input.prompt,
      command: input.command || 'claude',
      working_directory: input.working_directory,
      env_vars: input.env_vars,
      tags: input.tags,
      created_at: now,
      updated_at: now,
    };

    const stmt = this.db.prepare(`
      INSERT INTO agents (id, name, description, prompt, command, working_directory, env_vars, tags, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      agent.id,
      agent.name,
      agent.description,
      agent.prompt,
      agent.command,
      agent.working_directory,
      agent.env_vars ? JSON.stringify(agent.env_vars) : null,
      agent.tags ? JSON.stringify(agent.tags) : null,
      agent.created_at,
      agent.updated_at
    );

    return agent;
  }

  getAgent(id: string): Agent | null {
    const stmt = this.db.prepare('SELECT * FROM agents WHERE id = ?');
    const row: any = stmt.get(id);
    return row ? this.rowToAgent(row) : null;
  }

  getAllAgents(): Agent[] {
    const stmt = this.db.prepare('SELECT * FROM agents ORDER BY created_at DESC');
    const rows: any[] = stmt.all();
    return rows.map(row => this.rowToAgent(row));
  }

  updateAgent(input: UpdateAgentInput): Agent | null {
    const existing = this.getAgent(input.id);
    if (!existing) return null;

    const updated: Agent = {
      ...existing,
      ...input,
      updated_at: new Date().toISOString(),
    };

    const stmt = this.db.prepare(`
      UPDATE agents
      SET name = ?, description = ?, prompt = ?, command = ?, working_directory = ?, env_vars = ?, tags = ?, updated_at = ?
      WHERE id = ?
    `);

    stmt.run(
      updated.name,
      updated.description,
      updated.prompt,
      updated.command,
      updated.working_directory,
      updated.env_vars ? JSON.stringify(updated.env_vars) : null,
      updated.tags ? JSON.stringify(updated.tags) : null,
      updated.updated_at,
      updated.id
    );

    return updated;
  }

  deleteAgent(id: string): boolean {
    const stmt = this.db.prepare('DELETE FROM agents WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  // Schedule methods
  createSchedule(input: CreateScheduleInput): Schedule {
    const id = uuidv4();
    const now = new Date().toISOString();
    const schedule: Schedule = {
      id,
      agent_id: input.agent_id,
      start_datetime: input.start_datetime,
      timezone: input.timezone,
      recurrence_type: input.recurrence_type,
      recurrence_interval: input.recurrence_interval || 1,
      days_of_week: input.days_of_week,
      day_of_month: input.day_of_month,
      run_window_minutes: input.run_window_minutes,
      enabled: input.enabled !== false,
      created_at: now,
      updated_at: now,
    };

    const stmt = this.db.prepare(`
      INSERT INTO schedules (id, agent_id, start_datetime, timezone, recurrence_type, recurrence_interval, days_of_week, day_of_month, run_window_minutes, enabled, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      schedule.id,
      schedule.agent_id,
      schedule.start_datetime,
      schedule.timezone,
      schedule.recurrence_type,
      schedule.recurrence_interval,
      schedule.days_of_week ? JSON.stringify(schedule.days_of_week) : null,
      schedule.day_of_month,
      schedule.run_window_minutes,
      schedule.enabled ? 1 : 0,
      schedule.created_at,
      schedule.updated_at
    );

    return schedule;
  }

  getSchedule(id: string): Schedule | null {
    const stmt = this.db.prepare('SELECT * FROM schedules WHERE id = ?');
    const row: any = stmt.get(id);
    return row ? this.rowToSchedule(row) : null;
  }

  getAllSchedules(): Schedule[] {
    const stmt = this.db.prepare('SELECT * FROM schedules ORDER BY created_at DESC');
    const rows: any[] = stmt.all();
    return rows.map(row => this.rowToSchedule(row));
  }

  getSchedulesForAgent(agentId: string): Schedule[] {
    const stmt = this.db.prepare('SELECT * FROM schedules WHERE agent_id = ? ORDER BY created_at DESC');
    const rows: any[] = stmt.all(agentId);
    return rows.map(row => this.rowToSchedule(row));
  }

  getEnabledSchedules(): Schedule[] {
    const stmt = this.db.prepare('SELECT * FROM schedules WHERE enabled = 1');
    const rows: any[] = stmt.all();
    return rows.map(row => this.rowToSchedule(row));
  }

  updateSchedule(input: UpdateScheduleInput): Schedule | null {
    const existing = this.getSchedule(input.id);
    if (!existing) return null;

    const updated: Schedule = {
      ...existing,
      ...input,
      updated_at: new Date().toISOString(),
    };

    const stmt = this.db.prepare(`
      UPDATE schedules
      SET agent_id = ?, start_datetime = ?, timezone = ?, recurrence_type = ?, recurrence_interval = ?, days_of_week = ?, day_of_month = ?, run_window_minutes = ?, enabled = ?, updated_at = ?
      WHERE id = ?
    `);

    stmt.run(
      updated.agent_id,
      updated.start_datetime,
      updated.timezone,
      updated.recurrence_type,
      updated.recurrence_interval,
      updated.days_of_week ? JSON.stringify(updated.days_of_week) : null,
      updated.day_of_month,
      updated.run_window_minutes,
      updated.enabled ? 1 : 0,
      updated.updated_at,
      updated.id
    );

    return updated;
  }

  toggleSchedule(id: string): Schedule | null {
    const schedule = this.getSchedule(id);
    if (!schedule) return null;

    return this.updateSchedule({ id, enabled: !schedule.enabled });
  }

  deleteSchedule(id: string): boolean {
    const stmt = this.db.prepare('DELETE FROM schedules WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  // Run methods
  createRun(input: CreateRunInput): Run {
    const id = uuidv4();
    const run: Run = {
      id,
      agent_id: input.agent_id,
      schedule_id: input.schedule_id,
      planned_start: input.planned_start,
      status: 'queued',
    };

    const stmt = this.db.prepare(`
      INSERT INTO runs (id, agent_id, schedule_id, planned_start, status)
      VALUES (?, ?, ?, ?, ?)
    `);

    stmt.run(run.id, run.agent_id, run.schedule_id, run.planned_start, run.status);

    return run;
  }

  getRun(id: string): Run | null {
    const stmt = this.db.prepare('SELECT * FROM runs WHERE id = ?');
    const row: any = stmt.get(id);
    return row ? this.rowToRun(row) : null;
  }

  getAllRuns(limit: number = 100): Run[] {
    const stmt = this.db.prepare('SELECT * FROM runs ORDER BY planned_start DESC LIMIT ?');
    const rows: any[] = stmt.all(limit);
    return rows.map(row => this.rowToRun(row));
  }

  getRunsForAgent(agentId: string, limit: number = 50): Run[] {
    const stmt = this.db.prepare('SELECT * FROM runs WHERE agent_id = ? ORDER BY planned_start DESC LIMIT ?');
    const rows: any[] = stmt.all(agentId, limit);
    return rows.map(row => this.rowToRun(row));
  }

  getRunsForSchedule(scheduleId: string, limit: number = 50): Run[] {
    const stmt = this.db.prepare('SELECT * FROM runs WHERE schedule_id = ? ORDER BY planned_start DESC LIMIT ?');
    const rows: any[] = stmt.all(scheduleId, limit);
    return rows.map(row => this.rowToRun(row));
  }

  getRunningRuns(): Run[] {
    const stmt = this.db.prepare('SELECT * FROM runs WHERE status = ?');
    const rows: any[] = stmt.all('running');
    return rows.map(row => this.rowToRun(row));
  }

  updateRunStatus(id: string, status: RunStatus, updates?: Partial<Run>): Run | null {
    const existing = this.getRun(id);
    if (!existing) return null;

    const updated: Run = {
      ...existing,
      status,
      ...updates,
    };

    const stmt = this.db.prepare(`
      UPDATE runs
      SET status = ?, actual_start = ?, actual_end = ?, exit_code = ?, stdout_path = ?, stderr_path = ?, error_message = ?
      WHERE id = ?
    `);

    stmt.run(
      updated.status,
      updated.actual_start || null,
      updated.actual_end || null,
      updated.exit_code ?? null,
      updated.stdout_path || null,
      updated.stderr_path || null,
      updated.error_message || null,
      updated.id
    );

    return updated;
  }

  // Helper methods
  private rowToAgent(row: any): Agent {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      prompt: row.prompt,
      command: row.command,
      working_directory: row.working_directory,
      env_vars: row.env_vars ? JSON.parse(row.env_vars) : undefined,
      tags: row.tags ? JSON.parse(row.tags) : undefined,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }

  private rowToSchedule(row: any): Schedule {
    return {
      id: row.id,
      agent_id: row.agent_id,
      start_datetime: row.start_datetime,
      timezone: row.timezone,
      recurrence_type: row.recurrence_type,
      recurrence_interval: row.recurrence_interval,
      days_of_week: row.days_of_week ? JSON.parse(row.days_of_week) : undefined,
      day_of_month: row.day_of_month,
      run_window_minutes: row.run_window_minutes,
      enabled: row.enabled === 1,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }

  private rowToRun(row: any): Run {
    return {
      id: row.id,
      agent_id: row.agent_id,
      schedule_id: row.schedule_id,
      planned_start: row.planned_start,
      actual_start: row.actual_start,
      actual_end: row.actual_end,
      status: row.status,
      exit_code: row.exit_code,
      stdout_path: row.stdout_path,
      stderr_path: row.stderr_path,
      error_message: row.error_message,
    };
  }

  close() {
    this.db.close();
  }
}
