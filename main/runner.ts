import { spawn, ChildProcess } from 'child_process';
import { app, BrowserWindow } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { DatabaseService } from './database';
import { Run } from '../shared/types';
import { IPCChannel } from '../shared/types';

interface ActiveRun {
  runId: string;
  process: ChildProcess;
  timeoutId?: NodeJS.Timeout;
  stdoutPath: string;
  stderrPath: string;
}

export class RunnerService {
  private activeRuns: Map<string, ActiveRun> = new Map();
  private logsDir: string;

  constructor(private db: DatabaseService) {
    this.logsDir = path.join(app.getPath('userData'), 'logs');
    fs.mkdirSync(this.logsDir, { recursive: true });
  }

  async executeRun(runId: string, timeoutMinutes?: number): Promise<void> {
    const run = this.db.getRun(runId);
    if (!run) {
      console.error(`[Runner] Run ${runId} not found`);
      return;
    }

    const agent = this.db.getAgent(run.agent_id);
    if (!agent) {
      console.error(`[Runner] Agent ${run.agent_id} not found`);
      this.db.updateRunStatus(runId, 'failed', {
        error_message: 'Agent not found',
      });
      return;
    }

    // Check if already running
    if (this.activeRuns.has(runId)) {
      console.warn(`[Runner] Run ${runId} is already running`);
      return;
    }

    console.log(`[Runner] Starting run ${runId} for agent ${agent.name}`);

    // Update status to running
    this.db.updateRunStatus(runId, 'running', {
      actual_start: new Date().toISOString(),
    });

    // Notify renderer
    this.notifyRenderer('run-started', run);

    // Create log files
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const stdoutPath = path.join(this.logsDir, `${runId}_${timestamp}_stdout.log`);
    const stderrPath = path.join(this.logsDir, `${runId}_${timestamp}_stderr.log`);

    const stdoutStream = fs.createWriteStream(stdoutPath);
    const stderrStream = fs.createWriteStream(stderrPath);

    // Parse command
    const [command, ...args] = this.parseCommand(agent.command, agent.prompt);

    // Spawn process
    const childProcess = spawn(command, args, {
      cwd: agent.working_directory || app.getPath('home'),
      env: {
        ...process.env,
        ...agent.env_vars,
      },
      shell: true,
    });

    // Pipe output to log files
    childProcess.stdout?.pipe(stdoutStream);
    childProcess.stderr?.pipe(stderrStream);

    // Set up timeout if specified
    let timeoutId: NodeJS.Timeout | undefined;
    if (timeoutMinutes) {
      timeoutId = setTimeout(() => {
        console.log(`[Runner] Run ${runId} timed out after ${timeoutMinutes} minutes`);
        childProcess.kill('SIGTERM');

        // Give it 5 seconds to gracefully shutdown, then force kill
        setTimeout(() => {
          if (!childProcess.killed) {
            childProcess.kill('SIGKILL');
          }
        }, 5000);

        this.completeRun(runId, 'timed_out', {
          actual_end: new Date().toISOString(),
          stdout_path: stdoutPath,
          stderr_path: stderrPath,
          error_message: `Run exceeded time limit of ${timeoutMinutes} minutes`,
        });
      }, timeoutMinutes * 60 * 1000);
    }

    // Store active run
    this.activeRuns.set(runId, {
      runId,
      process: childProcess,
      timeoutId,
      stdoutPath,
      stderrPath,
    });

    // Handle process completion
    childProcess.on('exit', (code, signal) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      stdoutStream.end();
      stderrStream.end();

      const activeRun = this.activeRuns.get(runId);
      if (!activeRun) return;

      this.activeRuns.delete(runId);

      // Don't update if already marked as timed_out
      const currentRun = this.db.getRun(runId);
      if (currentRun?.status === 'timed_out') {
        return;
      }

      const status = code === 0 ? 'succeeded' : 'failed';
      const errorMessage = signal ? `Process killed with signal ${signal}` : undefined;

      this.completeRun(runId, status, {
        actual_end: new Date().toISOString(),
        exit_code: code ?? undefined,
        stdout_path: stdoutPath,
        stderr_path: stderrPath,
        error_message: errorMessage,
      });

      console.log(`[Runner] Run ${runId} completed with status ${status}`);
    });

    childProcess.on('error', (error) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      stdoutStream.end();
      stderrStream.end();

      this.activeRuns.delete(runId);

      this.completeRun(runId, 'failed', {
        actual_end: new Date().toISOString(),
        stdout_path: stdoutPath,
        stderr_path: stderrPath,
        error_message: error.message,
      });

      console.error(`[Runner] Run ${runId} failed with error:`, error);
    });
  }

  stopRun(runId: string): boolean {
    const activeRun = this.activeRuns.get(runId);
    if (!activeRun) {
      return false;
    }

    console.log(`[Runner] Stopping run ${runId}`);

    if (activeRun.timeoutId) {
      clearTimeout(activeRun.timeoutId);
    }

    // Try graceful shutdown first
    activeRun.process.kill('SIGTERM');

    // Force kill after 5 seconds if still running
    setTimeout(() => {
      if (!activeRun.process.killed) {
        activeRun.process.kill('SIGKILL');
      }
    }, 5000);

    this.completeRun(runId, 'canceled', {
      actual_end: new Date().toISOString(),
      stdout_path: activeRun.stdoutPath,
      stderr_path: activeRun.stderrPath,
    });

    this.activeRuns.delete(runId);

    return true;
  }

  private completeRun(runId: string, status: Run['status'], updates: Partial<Run>) {
    const updated = this.db.updateRunStatus(runId, status, updates);
    if (updated) {
      this.notifyRenderer('run-completed', updated);
    }
  }

  private parseCommand(command: string, prompt: string): string[] {
    // If command contains {prompt}, replace it
    if (command.includes('{prompt}')) {
      return command.replace('{prompt}', `"${prompt.replace(/"/g, '\\"')}"`).split(' ');
    }

    // Default: assume it's claude CLI and pass prompt as argument
    if (command === 'claude' || command.startsWith('claude ')) {
      return ['claude', ...command.split(' ').slice(1), prompt];
    }

    // Otherwise, just split the command
    return command.split(' ');
  }

  private notifyRenderer(channel: string, data: any) {
    const windows = BrowserWindow.getAllWindows();
    windows.forEach(window => {
      window.webContents.send(channel, data);
    });
  }

  getActiveLogs(runId: string): { stdout: string; stderr: string } | null {
    const activeRun = this.activeRuns.get(runId);
    if (!activeRun) {
      return null;
    }

    try {
      const stdout = fs.existsSync(activeRun.stdoutPath)
        ? fs.readFileSync(activeRun.stdoutPath, 'utf-8')
        : '';
      const stderr = fs.existsSync(activeRun.stderrPath)
        ? fs.readFileSync(activeRun.stderrPath, 'utf-8')
        : '';

      return { stdout, stderr };
    } catch (error) {
      console.error('[Runner] Error reading logs:', error);
      return null;
    }
  }

  isRunning(runId: string): boolean {
    return this.activeRuns.has(runId);
  }

  getActiveRunIds(): string[] {
    return Array.from(this.activeRuns.keys());
  }
}
