import { EventEmitter } from 'events';
import { spawn, ChildProcess } from 'child_process';
import fs from 'fs';
import path from 'path';
import { app } from 'electron';
import { runOps, agentOps, getLogsPath } from '../database';
import type { Run, Agent } from '../../shared/types';

interface ExecutionProcess {
  run: Run;
  process: ChildProcess;
  timeoutTimer?: NodeJS.Timeout;
  stdoutPath: string;
  stderrPath: string;
}

export class ExecutionService extends EventEmitter {
  private runningProcesses = new Map<string, ExecutionProcess>();

  constructor() {
    super();
  }

  /**
   * Execute a run
   */
  async execute(run: Run, runWindowMinutes?: number): Promise<void> {
    const agent = agentOps.get(run.agent_id);
    if (!agent) {
      runOps.updateStatus(run.id, 'failed', {
        error_message: 'Agent not found',
        actual_end: new Date().toISOString(),
      });
      this.emit('run:failed', runOps.get(run.id), 'Agent not found');
      return;
    }

    // Create log files
    const logsPath = getLogsPath();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const stdoutPath = path.join(logsPath, `${run.id}-${timestamp}-stdout.log`);
    const stderrPath = path.join(logsPath, `${run.id}-${timestamp}-stderr.log`);

    // Ensure logs directory exists
    if (!fs.existsSync(logsPath)) {
      fs.mkdirSync(logsPath, { recursive: true });
    }

    // Open log files
    const stdoutStream = fs.createWriteStream(stdoutPath, { flags: 'a' });
    const stderrStream = fs.createWriteStream(stderrPath, { flags: 'a' });

    // Update run status to running
    const actualStart = new Date().toISOString();
    runOps.updateStatus(run.id, 'running', {
      actual_start: actualStart,
      stdout_path: stdoutPath,
      stderr_path: stderrPath,
    });

    const updatedRun = runOps.get(run.id)!;
    this.emit('run:started', updatedRun);

    // Build the command
    const { command, args, env, cwd } = this.buildCommand(agent);

    console.log(`[Execution] Starting run ${run.id} for agent ${agent.name}`);
    console.log(`[Execution] Command: ${command} ${args.join(' ')}`);

    try {
      const childProcess = spawn(command, args, {
        cwd: cwd || process.cwd(),
        env: { ...process.env, ...env },
        shell: true,
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      const execProcess: ExecutionProcess = {
        run: updatedRun,
        process: childProcess,
        stdoutPath,
        stderrPath,
      };

      // Set up timeout if run window is specified
      if (runWindowMinutes && runWindowMinutes > 0) {
        execProcess.timeoutTimer = setTimeout(() => {
          this.handleTimeout(run.id);
        }, runWindowMinutes * 60 * 1000);
      }

      this.runningProcesses.set(run.id, execProcess);

      // Capture stdout
      childProcess.stdout?.on('data', (data: Buffer) => {
        stdoutStream.write(data);
      });

      // Capture stderr
      childProcess.stderr?.on('data', (data: Buffer) => {
        stderrStream.write(data);
      });

      // Handle process exit
      childProcess.on('exit', (code, signal) => {
        this.handleExit(run.id, code, signal);
        stdoutStream.end();
        stderrStream.end();
      });

      // Handle process error
      childProcess.on('error', (error) => {
        this.handleError(run.id, error);
        stdoutStream.end();
        stderrStream.end();
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      runOps.updateStatus(run.id, 'failed', {
        actual_end: new Date().toISOString(),
        error_message: errorMessage,
      });
      this.emit('run:failed', runOps.get(run.id), errorMessage);

      stdoutStream.end();
      stderrStream.end();
    }
  }

  /**
   * Build command for execution
   */
  private buildCommand(agent: Agent): {
    command: string;
    args: string[];
    env: Record<string, string>;
    cwd?: string;
  } {
    const baseCommand = agent.command || 'claude';

    // If command is 'claude', we'll pass the prompt via --prompt flag
    if (baseCommand === 'claude' || baseCommand.endsWith('/claude')) {
      return {
        command: baseCommand,
        args: ['--print', '--prompt', agent.prompt],
        env: agent.env_vars || {},
        cwd: agent.working_directory,
      };
    }

    // For custom commands, we assume the command handles its own arguments
    // The prompt can be passed as an environment variable
    return {
      command: baseCommand,
      args: [],
      env: {
        ...agent.env_vars,
        AGENT_PROMPT: agent.prompt,
        AGENT_NAME: agent.name,
      },
      cwd: agent.working_directory,
    };
  }

  /**
   * Handle process exit
   */
  private handleExit(runId: string, code: number | null, signal: string | null): void {
    const execProcess = this.runningProcesses.get(runId);
    if (!execProcess) return;

    // Clear timeout if exists
    if (execProcess.timeoutTimer) {
      clearTimeout(execProcess.timeoutTimer);
    }

    this.runningProcesses.delete(runId);

    const status = code === 0 ? 'succeeded' : 'failed';
    const errorMessage = code !== 0 ? `Process exited with code ${code}${signal ? ` (signal: ${signal})` : ''}` : undefined;

    runOps.updateStatus(runId, status, {
      actual_end: new Date().toISOString(),
      exit_code: code ?? undefined,
      error_message: errorMessage,
    });

    const updatedRun = runOps.get(runId)!;

    if (status === 'succeeded') {
      console.log(`[Execution] Run ${runId} completed successfully`);
      this.emit('run:completed', updatedRun);
    } else {
      console.log(`[Execution] Run ${runId} failed: ${errorMessage}`);
      this.emit('run:failed', updatedRun, errorMessage);
    }
  }

  /**
   * Handle process error
   */
  private handleError(runId: string, error: Error): void {
    const execProcess = this.runningProcesses.get(runId);
    if (!execProcess) return;

    // Clear timeout if exists
    if (execProcess.timeoutTimer) {
      clearTimeout(execProcess.timeoutTimer);
    }

    this.runningProcesses.delete(runId);

    runOps.updateStatus(runId, 'failed', {
      actual_end: new Date().toISOString(),
      error_message: error.message,
    });

    const updatedRun = runOps.get(runId)!;
    console.log(`[Execution] Run ${runId} error: ${error.message}`);
    this.emit('run:failed', updatedRun, error.message);
  }

  /**
   * Handle timeout
   */
  private handleTimeout(runId: string): void {
    const execProcess = this.runningProcesses.get(runId);
    if (!execProcess) return;

    console.log(`[Execution] Run ${runId} timed out, terminating...`);

    // Kill the process
    try {
      execProcess.process.kill('SIGTERM');

      // Force kill after 5 seconds if still running
      setTimeout(() => {
        try {
          execProcess.process.kill('SIGKILL');
        } catch {
          // Process already terminated
        }
      }, 5000);
    } catch {
      // Process already terminated
    }

    this.runningProcesses.delete(runId);

    runOps.updateStatus(runId, 'timed_out', {
      actual_end: new Date().toISOString(),
      error_message: 'Run exceeded time limit',
    });

    const updatedRun = runOps.get(runId)!;
    this.emit('run:timeout', updatedRun);
  }

  /**
   * Stop a running execution
   */
  stop(runId: string): boolean {
    const execProcess = this.runningProcesses.get(runId);
    if (!execProcess) return false;

    console.log(`[Execution] Stopping run ${runId}...`);

    // Clear timeout if exists
    if (execProcess.timeoutTimer) {
      clearTimeout(execProcess.timeoutTimer);
    }

    try {
      execProcess.process.kill('SIGTERM');

      // Force kill after 5 seconds
      setTimeout(() => {
        try {
          execProcess.process.kill('SIGKILL');
        } catch {
          // Process already terminated
        }
      }, 5000);
    } catch {
      // Process already terminated
    }

    this.runningProcesses.delete(runId);

    runOps.updateStatus(runId, 'canceled', {
      actual_end: new Date().toISOString(),
      error_message: 'Run was manually stopped',
    });

    return true;
  }

  /**
   * Get logs for a run
   */
  getLogs(runId: string): { stdout: string; stderr: string } {
    const run = runOps.get(runId);
    if (!run) {
      return { stdout: '', stderr: '' };
    }

    let stdout = '';
    let stderr = '';

    if (run.stdout_path && fs.existsSync(run.stdout_path)) {
      stdout = fs.readFileSync(run.stdout_path, 'utf-8');
    }

    if (run.stderr_path && fs.existsSync(run.stderr_path)) {
      stderr = fs.readFileSync(run.stderr_path, 'utf-8');
    }

    return { stdout, stderr };
  }

  /**
   * Check if a run is currently executing
   */
  isRunning(runId: string): boolean {
    return this.runningProcesses.has(runId);
  }

  /**
   * Get count of running processes
   */
  getRunningCount(): number {
    return this.runningProcesses.size;
  }
}
