import { DatabaseService } from './database';

export function seedDatabase(db: DatabaseService) {
  const agents = db.getAllAgents();

  // Only seed if database is empty
  if (agents.length > 0) {
    return;
  }

  console.log('[Seeder] Initializing database with template agent...');

  // Create Night Shift Job Hunter template agent
  const agent = db.createAgent({
    name: 'Night Shift Job Hunter',
    description: 'Automated job application agent that searches and applies to jobs during off-hours',
    prompt: `You are a job application assistant. Your task is to:

1. Visit the job search website: https://example-jobs.com (placeholder - replace with actual site)
2. Search for jobs matching these criteria:
   - Keywords: "software engineer", "developer"
   - Location: Remote or [Your City]
   - Experience level: Mid-level
3. Review the top 10 matching job postings
4. For each suitable position:
   - Read the job description carefully
   - Check if the requirements match the candidate profile
   - If it's a good match, proceed with application
5. Log all actions taken and results

IMPORTANT: This is a template agent. The actual job site integration and application submission are stubbed and will not perform real actions. This demonstrates the scheduling capability.

Profile to match:
- 5 years of software development experience
- Proficient in: JavaScript, TypeScript, React, Node.js
- Bachelor's degree in Computer Science
- Looking for: Remote or hybrid positions

Please proceed with your search and log what you find.`,
    command: 'claude',
    tags: ['automation', 'jobs', 'template'],
  });

  // Create a sample daily schedule for 1:00 AM
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(1, 0, 0, 0);

  db.createSchedule({
    agent_id: agent.id,
    start_datetime: tomorrow.toISOString(),
    timezone: 'America/Chicago',
    recurrence_type: 'daily',
    recurrence_interval: 1,
    run_window_minutes: 30,
    enabled: false, // Disabled by default so it doesn't actually run
  });

  console.log('[Seeder] Template agent created successfully!');
}
