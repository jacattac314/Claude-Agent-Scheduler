import { agentOps, scheduleOps, settingsOps } from './index';

const TEMPLATES_INITIALIZED_KEY = 'templates_initialized';

/**
 * Night Shift Job Hunter template
 * A template agent that demonstrates scheduled job application automation
 */
const nightShiftJobHunterAgent = {
  name: 'Night Shift Job Hunter',
  description: 'Searches for job postings and applies automatically during nighttime hours',
  prompt: `You are a job application assistant. Your task is to:

1. Navigate to the specified job board URL
2. Search for positions matching the provided keywords
3. Filter results by location and experience level
4. For each matching position:
   - Review the job description
   - Determine if it's a good fit based on the criteria
   - If suitable, prepare and submit an application
5. Log all actions and results

Configuration (REPLACE THESE PLACEHOLDERS):
- Target URL: https://example-job-board.com/jobs
- Keywords: software engineer, developer
- Location: Remote, San Francisco
- Experience Level: Mid-level, Senior
- Resume Path: ~/Documents/resume.pdf

IMPORTANT NOTES:
- This is a TEMPLATE agent. Replace the placeholder values above with your actual configuration before running.
- Browser automation is currently STUBBED. The WebTaskRunner interface is defined but uses a placeholder implementation that only logs intended actions.
- When a real Playwright implementation is added, this agent will be able to perform actual browser automation.
- DO NOT include any real credentials, passwords, or sensitive information in this prompt.

Example workflow (simulated):
1. [STUB] Navigate to job board
2. [STUB] Enter search keywords
3. [STUB] Apply filters
4. [STUB] Iterate through results
5. [STUB] Submit applications
6. Log summary of actions taken

Output format:
- Summary of jobs found
- List of applications submitted (or would be submitted)
- Any errors or issues encountered`,
  command: 'claude',
  tags: ['template', 'job-search', 'automation'],
};

const nightShiftJobHunterSchedule = {
  name: 'Nightly Job Search',
  timezone: 'America/Chicago',
  recurrence_type: 'daily' as const,
  recurrence_interval: 1,
  run_window_minutes: 30,
  enabled: false, // Disabled by default for safety
};

/**
 * Initialize template agents on first run
 */
export async function initializeTemplates(): Promise<void> {
  // Check if templates have already been initialized
  const initialized = settingsOps.get('templates_initialized' as any);
  if (initialized) {
    console.log('[Templates] Templates already initialized, skipping');
    return;
  }

  console.log('[Templates] Initializing default templates...');

  try {
    // Create Night Shift Job Hunter agent
    const agent = agentOps.create(nightShiftJobHunterAgent);
    console.log(`[Templates] Created agent: ${agent.name}`);

    // Create schedule for the agent (1 AM)
    const scheduleDate = new Date();
    scheduleDate.setHours(1, 0, 0, 0); // 1:00 AM

    const schedule = scheduleOps.create({
      agent_id: agent.id,
      name: nightShiftJobHunterSchedule.name,
      start_datetime: scheduleDate.toISOString(),
      timezone: nightShiftJobHunterSchedule.timezone,
      recurrence_type: nightShiftJobHunterSchedule.recurrence_type,
      recurrence_interval: nightShiftJobHunterSchedule.recurrence_interval,
      run_window_minutes: nightShiftJobHunterSchedule.run_window_minutes,
      enabled: nightShiftJobHunterSchedule.enabled,
    });
    console.log(`[Templates] Created schedule: ${schedule.name}`);

    // Mark templates as initialized
    settingsOps.set('templates_initialized' as any, true);
    console.log('[Templates] Template initialization complete');
  } catch (error) {
    console.error('[Templates] Failed to initialize templates:', error);
  }
}
