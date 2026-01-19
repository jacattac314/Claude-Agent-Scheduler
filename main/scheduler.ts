import { Schedule, RecurrenceType } from '../shared/types';
import { DatabaseService } from './database';
import { RunnerService } from './runner';
import { zonedTimeToUtc, utcToZonedTime } from 'date-fns-tz';
import { addDays, addWeeks, addMonths, addMinutes, startOfDay, setHours, setMinutes, setSeconds, setMilliseconds, isBefore, isAfter } from 'date-fns';

interface ScheduledJob {
  scheduleId: string;
  nextRun: Date;
  timeoutId?: NodeJS.Timeout;
}

export class SchedulerService {
  private jobs: Map<string, ScheduledJob> = new Map();
  private checkInterval?: NodeJS.Timeout;

  constructor(
    private db: DatabaseService,
    private runner: RunnerService
  ) {}

  start() {
    console.log('[Scheduler] Starting scheduler service');
    this.loadSchedules();

    // Check for new/updated schedules every minute
    this.checkInterval = setInterval(() => {
      this.loadSchedules();
    }, 60000);
  }

  stop() {
    console.log('[Scheduler] Stopping scheduler service');
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }

    // Clear all pending jobs
    this.jobs.forEach(job => {
      if (job.timeoutId) {
        clearTimeout(job.timeoutId);
      }
    });
    this.jobs.clear();
  }

  loadSchedules() {
    const schedules = this.db.getEnabledSchedules();

    // Remove jobs for schedules that no longer exist or are disabled
    this.jobs.forEach((job, scheduleId) => {
      if (!schedules.find(s => s.id === scheduleId)) {
        if (job.timeoutId) {
          clearTimeout(job.timeoutId);
        }
        this.jobs.delete(scheduleId);
      }
    });

    // Add or update jobs for enabled schedules
    schedules.forEach(schedule => {
      this.scheduleNext(schedule);
    });
  }

  scheduleNext(schedule: Schedule) {
    const now = new Date();
    const nextRun = this.calculateNextRun(schedule, now);

    if (!nextRun) {
      // One-time schedule in the past
      return;
    }

    const existingJob = this.jobs.get(schedule.id);

    // If already scheduled for the same time, skip
    if (existingJob && existingJob.nextRun.getTime() === nextRun.getTime()) {
      return;
    }

    // Clear existing timeout
    if (existingJob?.timeoutId) {
      clearTimeout(existingJob.timeoutId);
    }

    const delay = nextRun.getTime() - now.getTime();

    if (delay < 0) {
      // Should run immediately
      this.executeSchedule(schedule);
      // Schedule the next occurrence
      this.scheduleNext(schedule);
      return;
    }

    // Schedule the run
    const timeoutId = setTimeout(() => {
      this.executeSchedule(schedule);
      // Schedule the next occurrence
      this.scheduleNext(schedule);
    }, Math.min(delay, 2147483647)); // Max setTimeout value

    this.jobs.set(schedule.id, {
      scheduleId: schedule.id,
      nextRun,
      timeoutId,
    });

    console.log(`[Scheduler] Scheduled ${schedule.id} for ${nextRun.toISOString()}`);
  }

  private executeSchedule(schedule: Schedule) {
    console.log(`[Scheduler] Executing schedule ${schedule.id}`);

    const agent = this.db.getAgent(schedule.agent_id);
    if (!agent) {
      console.error(`[Scheduler] Agent ${schedule.agent_id} not found`);
      return;
    }

    // Create run record
    const run = this.db.createRun({
      agent_id: agent.id,
      schedule_id: schedule.id,
      planned_start: new Date().toISOString(),
    });

    // Execute the run
    this.runner.executeRun(run.id, schedule.run_window_minutes);
  }

  calculateNextRun(schedule: Schedule, fromDate: Date = new Date()): Date | null {
    const scheduleStartInTZ = utcToZonedTime(new Date(schedule.start_datetime), schedule.timezone);
    const nowInTZ = utcToZonedTime(fromDate, schedule.timezone);

    let nextRunInTZ: Date;

    switch (schedule.recurrence_type) {
      case 'one_time':
        if (isBefore(scheduleStartInTZ, nowInTZ)) {
          return null; // One-time schedule in the past
        }
        nextRunInTZ = scheduleStartInTZ;
        break;

      case 'daily':
        nextRunInTZ = this.calculateDailyNextRun(scheduleStartInTZ, nowInTZ, schedule.recurrence_interval);
        break;

      case 'weekly':
        nextRunInTZ = this.calculateWeeklyNextRun(scheduleStartInTZ, nowInTZ, schedule.recurrence_interval, schedule.days_of_week);
        break;

      case 'monthly':
        nextRunInTZ = this.calculateMonthlyNextRun(scheduleStartInTZ, nowInTZ, schedule.recurrence_interval, schedule.day_of_month);
        break;

      default:
        return null;
    }

    // Convert back to UTC
    return zonedTimeToUtc(nextRunInTZ, schedule.timezone);
  }

  private calculateDailyNextRun(scheduleStart: Date, now: Date, interval: number): Date {
    // Get the time from schedule start
    const hour = scheduleStart.getHours();
    const minute = scheduleStart.getMinutes();

    // Start with today at the scheduled time
    let candidate = setMilliseconds(setSeconds(setMinutes(setHours(startOfDay(now), hour), minute), 0), 0);

    // If already passed today, start from tomorrow
    if (isBefore(candidate, now) || candidate.getTime() === now.getTime()) {
      candidate = addDays(candidate, interval);
    }

    return candidate;
  }

  private calculateWeeklyNextRun(scheduleStart: Date, now: Date, interval: number, daysOfWeek?: number[]): Date {
    const hour = scheduleStart.getHours();
    const minute = scheduleStart.getMinutes();
    const targetDays = daysOfWeek && daysOfWeek.length > 0 ? daysOfWeek : [scheduleStart.getDay()];

    let candidate = setMilliseconds(setSeconds(setMinutes(setHours(startOfDay(now), hour), minute), 0), 0);

    // Find the next matching day of week
    for (let i = 0; i < 14; i++) { // Check up to 2 weeks ahead
      const dayOfWeek = candidate.getDay();
      if (targetDays.includes(dayOfWeek) && isAfter(candidate, now)) {
        return candidate;
      }
      candidate = addDays(candidate, 1);
    }

    return candidate;
  }

  private calculateMonthlyNextRun(scheduleStart: Date, now: Date, interval: number, dayOfMonth?: number): Date {
    const hour = scheduleStart.getHours();
    const minute = scheduleStart.getMinutes();
    const targetDay = dayOfMonth || scheduleStart.getDate();

    let candidate = setMilliseconds(setSeconds(setMinutes(setHours(startOfDay(now), hour), minute), 0), 0);

    // Set to target day of month
    candidate.setDate(Math.min(targetDay, new Date(candidate.getFullYear(), candidate.getMonth() + 1, 0).getDate()));

    // If already passed this month, go to next month
    if (isBefore(candidate, now) || candidate.getTime() === now.getTime()) {
      candidate = addMonths(candidate, interval);
      candidate.setDate(Math.min(targetDay, new Date(candidate.getFullYear(), candidate.getMonth() + 1, 0).getDate()));
    }

    return candidate;
  }

  getNextRun(scheduleId: string): Date | null {
    const job = this.jobs.get(scheduleId);
    return job ? job.nextRun : null;
  }

  getAllNextRuns(): Map<string, Date> {
    const result = new Map<string, Date>();
    this.jobs.forEach((job, scheduleId) => {
      result.set(scheduleId, job.nextRun);
    });
    return result;
  }

  reschedule(scheduleId: string) {
    const schedule = this.db.getSchedule(scheduleId);
    if (schedule && schedule.enabled) {
      this.scheduleNext(schedule);
    } else {
      // Remove if disabled or not found
      const job = this.jobs.get(scheduleId);
      if (job?.timeoutId) {
        clearTimeout(job.timeoutId);
      }
      this.jobs.delete(scheduleId);
    }
  }
}
