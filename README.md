# Claude Agent Scheduler

A beautiful, local-first desktop application for scheduling and managing AI agents with an intuitive calendar interface. Built with Apple's design principles in mind: clarity, deference, and depth.

![Claude Agent Scheduler](docs/screenshot-placeholder.png)

## What is it?

Claude Agent Scheduler lets you create AI-powered automation agents and schedule them to run automatically on your local machine. Think of it as a sophisticated cron job system, but designed specifically for AI agents with a beautiful, user-friendly interface.

### Key Features

- **Visual Calendar Interface**: See all your scheduled agents at a glance in month, week, or day views
- **Flexible Scheduling**: One-time, daily, weekly, or monthly schedules with timezone support
- **Run Windows**: Set maximum durations to prevent agents from running too long
- **Real-time Monitoring**: Watch agents execute in real-time with live log streaming
- **Local-First**: All data stored locally in SQLite - your agents and schedules never leave your machine
- **Template Agents**: Get started quickly with pre-built templates like "Night Shift Job Hunter"

## Quick Start

### Prerequisites

- Node.js 18 or later
- npm or yarn
- macOS, Windows, or Linux

### Installation

1. Clone the repository:
```bash
git clone https://github.com/anthropics/claude-agent-scheduler.git
cd claude-agent-scheduler
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

This will start both the Next.js dev server (for the renderer) and the Electron app.

### Building for Production

```bash
npm run build
npm run package
```

The packaged app will be in the `release` directory.

## How It Works

### Architecture

Claude Agent Scheduler consists of three main components:

1. **Electron Main Process** (Backend)
   - SQLite database for persistent storage
   - Scheduler engine that calculates and triggers runs
   - Runner service that executes agents as child processes
   - IPC handlers for communication with the UI

2. **Next.js Renderer** (Frontend)
   - React components with Tailwind CSS styling
   - React Big Calendar for schedule visualization
   - Real-time updates via Electron IPC

3. **Shared Types**
   - TypeScript definitions shared between main and renderer processes

### Scheduling System

The scheduler uses a sophisticated algorithm to calculate next run times:

- **Timezone-Aware**: All schedules are stored with IANA timezone identifiers (e.g., `America/Chicago`)
- **DST Handling**: Correctly handles Daylight Saving Time transitions using `date-fns-tz`
- **Recurrence Types**:
  - **One-time**: Run once at a specific date/time
  - **Daily**: Run every N days at a specific time
  - **Weekly**: Run on specific days of the week
  - **Monthly**: Run on a specific day of each month

The scheduler runs continuously in the background, even when the UI is closed (as long as the app is running). It checks for due runs and executes them automatically.

### Run Windows

Run windows provide automatic timeout protection. If you set a run window of 30 minutes:

1. The agent starts executing
2. A timer is set for 30 minutes
3. If the agent completes before 30 minutes, the run is marked as succeeded/failed based on exit code
4. If the agent is still running after 30 minutes, it receives SIGTERM
5. If it doesn't exit gracefully within 5 seconds, it receives SIGKILL
6. The run is marked as `timed_out`

### Agent Execution

Agents are executed as child processes using Node's `spawn` API:

- **Command**: By default, agents run using the `claude` CLI, but you can specify any command
- **Prompt Injection**: The agent's prompt is passed to the command
- **Environment**: Custom environment variables and working directory can be specified
- **Logging**: stdout and stderr are captured to files and displayed in the UI

## User Guide

### Creating an Agent

1. Click **"New Agent"** from the Agents view
2. Fill in:
   - **Name**: Short, descriptive name (e.g., "Daily Report Generator")
   - **Description**: One-line explanation of what it does
   - **Prompt**: Detailed instructions for the AI agent
3. (Optional) Configure advanced settings:
   - **Command**: Custom command to execute (default: `claude`)
   - **Working Directory**: Where the agent should run
   - **Tags**: Organize your agents

### Scheduling an Agent

1. From the agent detail page, click **"New Schedule"**
2. **Step 1 - When**:
   - Choose frequency (one-time, daily, weekly, monthly)
   - Set date and time
   - Select timezone
   - For weekly: choose days of week
   - For monthly: choose day of month
3. **Step 2 - Duration**:
   - (Optional) Set maximum run duration in minutes
4. **Step 3 - Review**:
   - Confirm your settings
   - Click **"Create Schedule"**

### Running an Agent Manually

1. Navigate to the agent in the Agents view
2. Click **"Run Now"**
3. Watch it execute in the Runs view

### Viewing Logs

1. Go to the **Runs** view
2. Click on any run to see its logs
3. For running agents, logs update in real-time
4. Completed runs show final stdout/stderr

### Pausing/Resuming Schedules

From the Calendar view:
1. Click on a scheduled event
2. Click **"Pause"** or **"Resume"**

Or from the Agent detail view, you'll see all schedules with their status.

## Template: Night Shift Job Hunter

The app includes a pre-configured template agent that demonstrates scheduling capabilities:

- **What it does**: Simulates searching and applying to jobs on a job board
- **Schedule**: Daily at 1:00 AM (America/Chicago timezone)
- **Run window**: 30 minutes
- **Status**: Disabled by default (so it won't actually run)

This template shows:
- How to structure a complex agent prompt
- Using run windows to limit execution time
- Scheduling for off-hours (night time)
- The stub WebTaskRunner interface (no actual browser automation)

To try it:
1. Go to **Agents** view
2. Click on **"Night Shift Job Hunter"**
3. Enable the schedule or click **"Run Now"** to test

**Note**: The browser automation is stubbed. Real job applications would require implementing the WebTaskRunner interface with Playwright or Puppeteer.

## Browser Automation (Stub)

The app includes a `WebTaskRunner` interface for browser-based agent tasks. Currently, this is a **stub implementation** that logs intended actions without performing them.

### Why Stubbed?

- Demonstrates the architecture without requiring heavy dependencies
- Lets you explore scheduling without actual automation
- Provides a clear integration point for future implementation

### Implementing Real Browser Automation

To add actual browser automation:

1. Install Playwright or Puppeteer:
```bash
npm install playwright
# or
npm install puppeteer
```

2. Create a real implementation in `main/web-task-runner.ts`:
```typescript
export class PlaywrightWebTaskRunner implements WebTaskRunner {
  private browser?: Browser;
  private page?: Page;

  async initialize() {
    this.browser = await chromium.launch();
    this.page = await this.browser.newPage();
  }

  async navigate(url: string) {
    await this.page.goto(url);
    return { success: true };
  }

  // ... implement other methods
}
```

3. Update the factory function to return your implementation
4. Add configuration to enable/disable per agent

See `main/web-task-runner.ts` for the complete interface.

## Project Structure

```
claude-agent-scheduler/
├── main/                     # Electron main process
│   ├── index.ts             # App entry point
│   ├── database.ts          # SQLite service
│   ├── scheduler.ts         # Scheduling engine
│   ├── runner.ts            # Agent execution
│   ├── seeder.ts            # Database initialization
│   ├── preload.ts           # IPC bridge
│   └── web-task-runner.ts   # Browser automation stub
├── renderer/                 # Next.js renderer process
│   ├── app/
│   │   ├── page.tsx         # Main app component
│   │   ├── layout.tsx       # Root layout
│   │   ├── globals.css      # Global styles
│   │   └── components/      # React components
│   │       ├── Sidebar.tsx
│   │       ├── CalendarView.tsx
│   │       ├── AgentsView.tsx
│   │       ├── AgentDetail.tsx
│   │       ├── AgentForm.tsx
│   │       ├── ScheduleForm.tsx
│   │       ├── RunsView.tsx
│   │       └── SettingsView.tsx
├── shared/                   # Shared TypeScript types
│   └── types.ts
├── package.json
├── tsconfig.json
├── tsconfig.main.json
├── next.config.js
├── tailwind.config.js
└── README.md
```

## Development

### Available Scripts

- `npm run dev` - Start development mode (Next.js + Electron)
- `npm run dev:next` - Start only Next.js dev server
- `npm run dev:electron` - Start only Electron
- `npm run build` - Build for production
- `npm run build:next` - Build Next.js renderer
- `npm run build:main` - Compile TypeScript for main process
- `npm start` - Start production build
- `npm run package` - Package app for distribution
- `npm run lint` - Run ESLint
- `npm test` - Run tests

### Database Location

The SQLite database is stored in your system's app data directory:

- **macOS**: `~/Library/Application Support/claude-agent-scheduler/`
- **Windows**: `%APPDATA%/claude-agent-scheduler/`
- **Linux**: `~/.config/claude-agent-scheduler/`

### Logs

Agent execution logs are stored in the same directory under `logs/`.

## Design Philosophy

This app follows Apple's Human Interface Guidelines:

### Clarity
- Clear, concise labels throughout
- Plain language, no technical jargon in the UI
- Status indicators use familiar colors (green = success, red = error)

### Deference
- Content-first design with minimal chrome
- Subtle shadows and borders (shadow-apple utility)
- White space to let content breathe
- Calendar takes center stage on main view

### Depth
- Sidebar + main content hierarchy
- Cards elevate on hover
- Smooth transitions and animations
- Modal overlays with backdrop blur

## Roadmap

Future enhancements we're considering:

- [ ] Agent templates marketplace
- [ ] Run history analytics and charts
- [ ] Email/Slack notifications for run completion
- [ ] Agent chaining (trigger one agent after another)
- [ ] Cloud sync option (while keeping local-first approach)
- [ ] Real browser automation integration
- [ ] Multi-step agent workflows with branching logic
- [ ] Import/export agents and schedules
- [ ] Dark mode

## Demo Script

Follow these steps to demonstrate the app (1-2 minutes):

1. **Launch the app**: `npm run dev`
   - Wait for both Next.js and Electron to start

2. **Show the Calendar** (10 seconds):
   - The app opens to the Calendar view
   - Point out the clean, minimal interface
   - Note the template agent's schedule (if visible for next day)

3. **Show the Template Agent** (20 seconds):
   - Click **Agents** in the sidebar
   - Click the **"Night Shift Job Hunter"** card
   - Scroll through the prompt to show the detailed instructions
   - Point out the schedule: "Daily at 1:00 AM, 30-minute window"

4. **Run an Agent** (30 seconds):
   - Click **"Run Now"**
   - Navigate to **Runs** view
   - Click on the running/completed run
   - Show the live logs appearing (or final logs)
   - Point out the status badge and duration

5. **Create a New Agent** (30 seconds):
   - Go back to **Agents**
   - Click **"New Agent"**
   - Fill in:
     - Name: "Morning Summary"
     - Description: "Generate a daily summary of news"
     - Prompt: "Summarize today's top tech news in 3 bullet points"
   - Click **"Create Agent"**

6. **Schedule the Agent** (30 seconds):
   - From the agent detail page, click **"New Schedule"**
   - Step 1: Choose "Daily", set time to 9:00 AM, keep current timezone
   - Step 2: Set run window to 5 minutes
   - Step 3: Review and **"Create Schedule"**

7. **View on Calendar** (10 seconds):
   - Go to **Calendar** view
   - Show the new schedule appearing on the calendar
   - Click on it to show the event details drawer

**Total time**: ~2 minutes

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT

## Support

For issues and questions, please file an issue on the GitHub repository.

---

Built with ❤️ using Claude, Electron, Next.js, and React Big Calendar
