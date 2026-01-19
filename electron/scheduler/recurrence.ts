import {
  addDays,
  addWeeks,
  addMonths,
  setDate,
  setHours,
  setMinutes,
  setSeconds,
  getDay,
  isBefore,
  isAfter,
  startOfDay,
  parseISO,
} from 'date-fns';
import { toZonedTime, fromZonedTime, format as formatTz } from 'date-fns-tz';
import type { Schedule, DayOfWeek } from '../../shared/types';

/**
 * Calculate the next run time for a schedule, accounting for timezone and DST
 */
export function calculateNextRun(schedule: Schedule, after?: Date): Date | null {
  if (!schedule.enabled) return null;

  const now = after || new Date();
  const scheduleStart = parseISO(schedule.start_datetime);
  const timezone = schedule.timezone;

  // Convert 'now' to the schedule's timezone
  const nowInTz = toZonedTime(now, timezone);

  // For one-time schedules, if start is in the past, no next run
  if (schedule.recurrence_type === 'one_time') {
    if (isAfter(now, scheduleStart)) {
      return null;
    }
    return scheduleStart;
  }

  // Get the time components from the original schedule start
  const startInTz = toZonedTime(scheduleStart, timezone);
  const targetHours = startInTz.getHours();
  const targetMinutes = startInTz.getMinutes();

  let candidate: Date;

  switch (schedule.recurrence_type) {
    case 'daily':
      candidate = calculateNextDaily(nowInTz, targetHours, targetMinutes, schedule.recurrence_interval);
      break;

    case 'weekly':
      candidate = calculateNextWeekly(
        nowInTz,
        targetHours,
        targetMinutes,
        schedule.recurrence_interval,
        schedule.days_of_week || [getDay(startInTz) as DayOfWeek]
      );
      break;

    case 'monthly':
      candidate = calculateNextMonthly(
        nowInTz,
        targetHours,
        targetMinutes,
        schedule.recurrence_interval,
        schedule.day_of_month || startInTz.getDate()
      );
      break;

    default:
      return null;
  }

  // Convert back from timezone to UTC
  return fromZonedTime(candidate, timezone);
}

function calculateNextDaily(
  nowInTz: Date,
  targetHours: number,
  targetMinutes: number,
  interval: number
): Date {
  // Start with today at target time
  let candidate = setSeconds(setMinutes(setHours(nowInTz, targetHours), targetMinutes), 0);

  // If today's run time has passed, move to next interval
  if (isBefore(candidate, nowInTz)) {
    candidate = addDays(candidate, interval);
  }

  return candidate;
}

function calculateNextWeekly(
  nowInTz: Date,
  targetHours: number,
  targetMinutes: number,
  interval: number,
  daysOfWeek: DayOfWeek[]
): Date {
  if (daysOfWeek.length === 0) {
    daysOfWeek = [getDay(nowInTz) as DayOfWeek];
  }

  const sortedDays = [...daysOfWeek].sort((a, b) => a - b);
  const currentDay = getDay(nowInTz) as DayOfWeek;

  // Set time to target time
  let todayAtTargetTime = setSeconds(setMinutes(setHours(nowInTz, targetHours), targetMinutes), 0);

  // Check if today is a valid day and the time hasn't passed
  if (sortedDays.includes(currentDay) && isAfter(todayAtTargetTime, nowInTz)) {
    return todayAtTargetTime;
  }

  // Find next valid day this week
  for (const day of sortedDays) {
    if (day > currentDay) {
      const daysUntil = day - currentDay;
      return addDays(todayAtTargetTime, daysUntil);
    }
  }

  // No valid day this week, go to first day of next week(s)
  const daysUntilFirstDay = 7 - currentDay + sortedDays[0];
  let nextCandidate = addDays(todayAtTargetTime, daysUntilFirstDay);

  // Apply interval (if interval > 1, skip weeks)
  if (interval > 1) {
    nextCandidate = addWeeks(nextCandidate, interval - 1);
  }

  return nextCandidate;
}

function calculateNextMonthly(
  nowInTz: Date,
  targetHours: number,
  targetMinutes: number,
  interval: number,
  dayOfMonth: number
): Date {
  // Handle day of month (capped at 28 for safety with all months)
  const safeDay = Math.min(dayOfMonth, 28);

  // Start with this month
  let candidate = setSeconds(
    setMinutes(
      setHours(setDate(startOfDay(nowInTz), safeDay), targetHours),
      targetMinutes
    ),
    0
  );

  // If this month's run has passed, move to next month
  if (isBefore(candidate, nowInTz)) {
    candidate = addMonths(candidate, interval);
    candidate = setDate(candidate, safeDay);
  }

  return candidate;
}

/**
 * Get all scheduled runs in a date range
 */
export function getScheduledRunsInRange(
  schedule: Schedule,
  rangeStart: Date,
  rangeEnd: Date,
  maxOccurrences: number = 100
): Date[] {
  if (!schedule.enabled) return [];

  const runs: Date[] = [];
  let current = calculateNextRun(schedule, rangeStart);

  while (current && isBefore(current, rangeEnd) && runs.length < maxOccurrences) {
    runs.push(current);

    // Calculate next run after this one
    const afterCurrent = new Date(current.getTime() + 1000); // Add 1 second
    current = calculateNextRun(schedule, afterCurrent);

    // Prevent infinite loop for one-time schedules
    if (schedule.recurrence_type === 'one_time') break;
  }

  return runs;
}

/**
 * Format a date in a specific timezone
 */
export function formatInTimezone(date: Date, timezone: string, formatStr: string = 'PPpp'): string {
  const zonedDate = toZonedTime(date, timezone);
  return formatTz(zonedDate, formatStr, { timeZone: timezone });
}

/**
 * Get list of common IANA timezones
 */
export function getCommonTimezones(): string[] {
  return [
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'America/Anchorage',
    'Pacific/Honolulu',
    'America/Toronto',
    'America/Vancouver',
    'America/Mexico_City',
    'America/Sao_Paulo',
    'Europe/London',
    'Europe/Paris',
    'Europe/Berlin',
    'Europe/Rome',
    'Europe/Madrid',
    'Europe/Amsterdam',
    'Europe/Moscow',
    'Asia/Dubai',
    'Asia/Kolkata',
    'Asia/Bangkok',
    'Asia/Singapore',
    'Asia/Hong_Kong',
    'Asia/Shanghai',
    'Asia/Tokyo',
    'Asia/Seoul',
    'Australia/Sydney',
    'Australia/Melbourne',
    'Australia/Perth',
    'Pacific/Auckland',
    'UTC',
  ];
}

/**
 * Get the user's system timezone
 */
export function getSystemTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}
