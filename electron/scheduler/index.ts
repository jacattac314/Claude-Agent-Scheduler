import { EventEmitter } from 'events';
import { scheduleOps, runOps, agentOps, settingsOps } from '../database';
import { calculateNextRun } from './recurrence';
import { ExecutionService } from '../services/execution';
import type { Schedule, Run, ScheduledRunInfo, AppSettings } from '../../shared/types';

interface SchedulerEvents {
  'run:queued': (run: Run) => void;
  'run:started': (run: Run) => void;
  'run:completed': (run: Run) => void;
  'run:failed': (run: Run, error: string) => void;
  'run:timeout': (run: Run) => void;
  'schedule:updated': (schedule: Schedule) => void;
}

export class SchedulerService extends EventEmitter {
  private checkInterval: NodeJS.Timeout | null = null;
  private executionService: ExecutionService;
  private isRunning = false;
  private scheduledJobs = new Map<string, { nextRun: Date; timer: NodeJS.Timeout | null }>();

  constructor() {
    super();
    this.executionService = new ExecutionService();
    this.executionService.on('run:started', (run) => this.emit('run:started', run));
    this.executionService.on('run:completed', (run) => this.emit('run:completed', run));
    this.executionService.on('run:failed', (run, error) => this.emit('run:failed', run, error));
    this.executionService.on('run:timeout', (run) => this.emit('run:timeout', run));
  }

  /**
   * Start the scheduler service
   */
  start(): void {
    if (this.isRunning) return;
    this.isRunning = true;

    console.log('[Scheduler] Starting scheduler service...');

    // Load all enabled schedules and calculate next runs
    this.refreshSchedules();

    // Check every 30 seconds for schedules that need to run
    this.checkInterval = setInterval(() => this.checkAndRun(), 30000);

    // Also check immediately
    this.checkAndRun();

    // Check for any queued runs that should be started
    this.processQueuedRuns();

    console.log('[Scheduler] Scheduler service started');
  }

  /**
   * Stop the scheduler service
   */
  stop(): void {
    if (!this.isRunning) return;

    console.log('[Scheduler] Stopping scheduler service...');

    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }

    // Clear all scheduled timers
    for (const [, job] of this.scheduledJobs) {
      if (job.timer) {
        clearTimeout(job.timer);
      }
    }
    this.scheduledJobs.clear();

    this.isRunning = false;
    console.log('[Scheduler] Scheduler service stopped');
  }

  /**
   * Refresh all schedules from the database
   */
  refreshSchedules(): void {
    // Clear existing scheduled jobs
    for (const [, job] of this.scheduledJobs) {
      if (job.timer) {
        clearTimeout(job.timer);
      }
    }
    this.scheduledJobs.clear();

    // Load enabled schedules
    const schedules = scheduleOps.listEnabled();
    const now = new Date();

    for (const schedule of schedules) {
      const nextRun = calculateNextRun(schedule, now);
      if (nextRun) {
        this.scheduleJob(schedule, nextRun);
      }
    }

    console.log(`[Scheduler] Loaded ${this.scheduledJobs.size} scheduled jobs`);
  }

  /**
   * Schedule a specific job
   */
  private scheduleJob(schedule: Schedule, nextRun: Date): void {
    const msUntilRun = nextRun.getTime() - Date.now();

    // Only set a timer if the run is within the next hour
    // Otherwise, the periodic check will handle it
    let timer: NodeJS.Timeout | null = null;
    if (msUntilRun > 0 && msUntilRun < 3600000) {
      timer = setTimeout(() => this.triggerRun(schedule.id), msUntilRun);
    }

    this.scheduledJobs.set(schedule.id, { nextRun, timer });
    console.log(`[Scheduler] Scheduled ${schedule.name} for ${nextRun.toISOString()}`);
  }

  /**
   * Check for due schedules and run them
   */
  private checkAndRun(): void {
    const now = new Date();
    const tolerance = 60000; // 1 minute tolerance

    for (const [scheduleId, job] of this.scheduledJobs) {
      if (job.nextRun.getTime() <= now.getTime() + tolerance) {
        this.triggerRun(scheduleId);
      }
    }
  }

  /**
   * Trigger a scheduled run
   */
  private async triggerRun(scheduleId: string): Promise<void> {
    const schedule = scheduleOps.get(scheduleId);
    if (!schedule || !schedule.enabled) {
      this.scheduledJobs.delete(scheduleId);
      return;
    }

    const agent = agentOps.get(schedule.agent_id);
    if (!agent) {
      console.error(`[Scheduler] Agent not found for schedule ${scheduleId}`);
      this.scheduledJobs.delete(scheduleId);
      return;
    }

    // Check overlap policy
    const settings = settingsOps.getAll() as Partial<AppSettings>;
    const overlapPolicy = settings.runOverlapPolicy || 'queue';
    const maxConcurrent = settings.maxConcurrentRuns || 3;

    const runningRuns = runOps.listRunning();
    const runningForAgent = runningRuns.filter(r => r.agent_id === agent.id);

    if (overlapPolicy === 'skip' && runningForAgent.length > 0) {
      console.log(`[Scheduler] Skipping run for ${agent.name} - already running`);
    } else if (runningRuns.length >= maxConcurrent) {
      // Queue the run
      const run = runOps.create({
        agent_id: agent.id,
        schedule_id: schedule.id,
        planned_start: new Date().toISOString(),
        status: 'queued',
      });
      console.log(`[Scheduler] Queued run for ${agent.name} - max concurrent reached`);
      this.emit('run:queued', run);
    } else {
      // Start the run immediately
      await this.startRun(agent.id, schedule.id, schedule.run_window_minutes);
    }

    // Calculate and schedule next run
    const nextRun = calculateNextRun(schedule, new Date());
    if (nextRun) {
      this.scheduleJob(schedule, nextRun);
    } else {
      this.scheduledJobs.delete(scheduleId);
    }
  }

  /**
   * Start a run for an agent
   */
  async startRun(agentId: string, scheduleId?: string, runWindowMinutes?: number): Promise<Run> {
    const run = runOps.create({
      agent_id: agentId,
      schedule_id: scheduleId,
      planned_start: new Date().toISOString(),
      status: 'queued',
    });

    this.emit('run:queued', run);

    // Execute the run
    await this.executionService.execute(run, runWindowMinutes);

    return run;
  }

  /**
   * Run an agent immediately (manual trigger)
   */
  async runNow(agentId: string): Promise<Run> {
    const agent = agentOps.get(agentId);
    if (!agent) {
      throw new Error(`Agent not found: ${agentId}`);
    }

    return this.startRun(agentId);
  }

  /**
   * Stop a running execution
   */
  stopRun(runId: string): boolean {
    return this.executionService.stop(runId);
  }

  /**
   * Process queued runs
   */
  private async processQueuedRuns(): Promise<void> {
    const settings = settingsOps.getAll() as Partial<AppSettings>;
    const maxConcurrent = settings.maxConcurrentRuns || 3;

    const queuedRuns = runOps.listQueued();
    const runningRuns = runOps.listRunning();

    const availableSlots = maxConcurrent - runningRuns.length;

    for (let i = 0; i < Math.min(availableSlots, queuedRuns.length); i++) {
      const run = queuedRuns[i];
      const schedule = run.schedule_id ? scheduleOps.get(run.schedule_id) : null;
      await this.executionService.execute(run, schedule?.run_window_minutes);
    }
  }

  /**
   * Get upcoming scheduled runs
   */
  getNextRuns(limit: number = 10): ScheduledRunInfo[] {
    const schedules = scheduleOps.listEnabled();
    const now = new Date();
    const runs: ScheduledRunInfo[] = [];

    for (const schedule of schedules) {
      const agent = agentOps.get(schedule.agent_id);
      if (!agent) continue;

      const nextRun = calculateNextRun(schedule, now);
      if (nextRun) {
        runs.push({
          scheduleId: schedule.id,
          scheduleName: schedule.name,
          agentId: agent.id,
          agentName: agent.name,
          nextRun: nextRun.toISOString(),
          timezone: schedule.timezone,
          runWindowMinutes: schedule.run_window_minutes,
          enabled: schedule.enabled,
        });
      }
    }

    // Sort by next run time and limit
    runs.sort((a, b) => new Date(a.nextRun).getTime() - new Date(b.nextRun).getTime());
    return runs.slice(0, limit);
  }

  /**
   * Notify scheduler of schedule changes
   */
  onScheduleChanged(scheduleId: string): void {
    const schedule = scheduleOps.get(scheduleId);

    // Clear existing timer if any
    const existing = this.scheduledJobs.get(scheduleId);
    if (existing?.timer) {
      clearTimeout(existing.timer);
    }

    if (schedule && schedule.enabled) {
      const nextRun = calculateNextRun(schedule, new Date());
      if (nextRun) {
        this.scheduleJob(schedule, nextRun);
        this.emit('schedule:updated', schedule);
        return;
      }
    }

    this.scheduledJobs.delete(scheduleId);
    if (schedule) {
      this.emit('schedule:updated', schedule);
    }
  }
}

// Singleton instance
let schedulerInstance: SchedulerService | null = null;

export function getScheduler(): SchedulerService {
  if (!schedulerInstance) {
    schedulerInstance = new SchedulerService();
  }
  return schedulerInstance;
}
