import Database from 'better-sqlite3';

export interface Migration {
  version: number;
  name: string;
  up: (db: Database.Database) => void;
}

export const migrations: Migration[] = [
  {
    version: 1,
    name: 'create_agents_table',
    up: (db) => {
      db.exec(`
        CREATE TABLE IF NOT EXISTS agents (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT NOT NULL DEFAULT '',
          prompt TEXT NOT NULL,
          command TEXT NOT NULL DEFAULT 'claude',
          working_directory TEXT,
          env_vars TEXT,
          tags TEXT,
          created_at TEXT NOT NULL DEFAULT (datetime('now')),
          updated_at TEXT NOT NULL DEFAULT (datetime('now'))
        )
      `);
    },
  },
  {
    version: 2,
    name: 'create_schedules_table',
    up: (db) => {
      db.exec(`
        CREATE TABLE IF NOT EXISTS schedules (
          id TEXT PRIMARY KEY,
          agent_id TEXT NOT NULL,
          name TEXT NOT NULL,
          start_datetime TEXT NOT NULL,
          timezone TEXT NOT NULL DEFAULT 'UTC',
          recurrence_type TEXT NOT NULL DEFAULT 'one_time',
          recurrence_interval INTEGER NOT NULL DEFAULT 1,
          days_of_week TEXT,
          day_of_month INTEGER,
          run_window_minutes INTEGER,
          enabled INTEGER NOT NULL DEFAULT 1,
          created_at TEXT NOT NULL DEFAULT (datetime('now')),
          updated_at TEXT NOT NULL DEFAULT (datetime('now')),
          FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE
        )
      `);

      db.exec(`
        CREATE INDEX IF NOT EXISTS idx_schedules_agent_id ON schedules(agent_id);
        CREATE INDEX IF NOT EXISTS idx_schedules_enabled ON schedules(enabled);
        CREATE INDEX IF NOT EXISTS idx_schedules_start_datetime ON schedules(start_datetime);
      `);
    },
  },
  {
    version: 3,
    name: 'create_runs_table',
    up: (db) => {
      db.exec(`
        CREATE TABLE IF NOT EXISTS runs (
          id TEXT PRIMARY KEY,
          agent_id TEXT NOT NULL,
          schedule_id TEXT,
          planned_start TEXT NOT NULL,
          actual_start TEXT,
          actual_end TEXT,
          status TEXT NOT NULL DEFAULT 'queued',
          exit_code INTEGER,
          stdout_path TEXT,
          stderr_path TEXT,
          error_message TEXT,
          created_at TEXT NOT NULL DEFAULT (datetime('now')),
          FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE,
          FOREIGN KEY (schedule_id) REFERENCES schedules(id) ON DELETE SET NULL
        )
      `);

      db.exec(`
        CREATE INDEX IF NOT EXISTS idx_runs_agent_id ON runs(agent_id);
        CREATE INDEX IF NOT EXISTS idx_runs_schedule_id ON runs(schedule_id);
        CREATE INDEX IF NOT EXISTS idx_runs_status ON runs(status);
        CREATE INDEX IF NOT EXISTS idx_runs_planned_start ON runs(planned_start);
      `);
    },
  },
  {
    version: 4,
    name: 'create_settings_table',
    up: (db) => {
      db.exec(`
        CREATE TABLE IF NOT EXISTS settings (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL
        )
      `);
    },
  },
  {
    version: 5,
    name: 'create_migrations_table',
    up: (db) => {
      db.exec(`
        CREATE TABLE IF NOT EXISTS _migrations (
          version INTEGER PRIMARY KEY,
          name TEXT NOT NULL,
          applied_at TEXT NOT NULL DEFAULT (datetime('now'))
        )
      `);
    },
  },
];

export function runMigrations(db: Database.Database): void {
  // First ensure migrations table exists
  db.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
      version INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      applied_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  // Get applied migrations
  const appliedVersions = new Set<number>();
  const rows = db.prepare('SELECT version FROM _migrations').all() as { version: number }[];
  for (const row of rows) {
    appliedVersions.add(row.version);
  }

  // Run pending migrations
  const insertMigration = db.prepare(
    'INSERT INTO _migrations (version, name) VALUES (?, ?)'
  );

  for (const migration of migrations) {
    if (!appliedVersions.has(migration.version)) {
      console.log(`Running migration ${migration.version}: ${migration.name}`);
      db.transaction(() => {
        migration.up(db);
        insertMigration.run(migration.version, migration.name);
      })();
    }
  }
}
