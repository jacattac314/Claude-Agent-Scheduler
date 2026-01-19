# Claude Agent Scheduler

A polished, Apple-style desktop application for creating, scheduling, and managing AI agents. Built with Electron, Next.js, and SQLite.

![Claude Agent Scheduler](./screenshots/placeholder-main.png)

## Features

- **Agent Management**: Create and configure AI agents with custom prompts and commands
- **Flexible Scheduling**: Schedule agents to run one-time, daily, weekly, or monthly
- **Run Windows**: Set time limits for agent execution (e.g., run for 30 minutes max)
- **Calendar View**: Visualize scheduled runs on a beautiful calendar interface
- **Real-time Logs**: Monitor agent output in real-time during execution
- **System Tray**: Runs in the background, continues executing even when window is closed
- **Local-First**: All data stored locally in SQLite, no cloud dependencies

## Tech Stack

- **Electron** - Desktop application framework
- **Next.js + React + TypeScript** - UI framework
- **Tailwind CSS** - Styling with Apple-inspired design system
- **SQLite (better-sqlite3)** - Local database
- **React Big Calendar** - Calendar visualization
- **date-fns + date-fns-tz** - Timezone-aware date handling

## Getting Started

### Prerequisites

- Node.js 18 or higher
- npm or yarn
- Claude CLI installed (for default agent execution)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/claude-agent-scheduler.git
cd claude-agent-scheduler

# Install dependencies
npm install

# Build the Electron main process
npm run build:electron

# Start in development mode
npm run dev
```

### Development Scripts

```bash
# Start development (Next.js + Electron)
npm run dev

# Build for production
npm run build

# Run linting
npm run lint

# Run tests
npm run test

# Package for distribution
npm run package
```

## How It Works

### Agents

An agent is a configurable unit that executes a command with a prompt. By default, agents use the `claude` CLI, but you can customize the command.

**Agent Properties:**
- **Name**: Display name for the agent
- **Description**: Brief description of what the agent does
- **Prompt**: The instructions sent to the AI
- **Command**: The executable to run (default: `claude`)
- **Working Directory**: Where to execute the command
- **Environment Variables**: Custom env vars for execution

### Schedules

Schedules define when agents run. Each schedule has:

- **Recurrence Type**: One-time, daily, weekly, or monthly
- **Time**: The time of day to execute
- **Timezone**: IANA timezone for accurate scheduling across DST
- **Run Window**: Optional maximum duration (agent is terminated after)
- **Days of Week**: For weekly schedules, which days to run

### Runs

A run is a single execution of an agent. The system tracks:

- Planned vs actual start times
- Duration and exit codes
- stdout/stderr captured to log files
- Status: queued, running, succeeded, failed, canceled, timed_out

### Scheduler Engine

The scheduler runs in the Electron main process and:

1. Loads enabled schedules on app launch
2. Calculates next run times with timezone awareness
3. Triggers executions at the right moment
4. Handles run windows (terminates after duration)
5. Manages concurrent run limits
6. Continues working even when the UI is closed

### Overlap Policy

When a scheduled run occurs while another is running:

- **Queue** (default): Wait until a slot is available
- **Skip**: Don't run if the same agent is already running

## Template Agent: Night Shift Job Hunter

The app includes a template agent demonstrating scheduled automation:

- **Purpose**: Search and apply for jobs during off-hours
- **Schedule**: Daily at 1:00 AM, 30-minute run window
- **Status**: Disabled by default (enable after configuration)

**Important**: This is a template only. Browser automation is stubbed - the `WebTaskRunner` interface is defined but uses a placeholder that only logs intended actions. Real browser automation requires implementing a Playwright runner.

## Browser Automation (Stub)

The app defines a `WebTaskRunner` interface for browser automation:

```typescript
interface WebTaskRunner {
  run(actions: WebTaskAction[]): Promise<WebTaskResult>;
  isAvailable(): boolean;
}
```

Currently, a `StubWebTaskRunner` logs actions without executing them. To implement real automation:

1. Install Playwright: `npm install playwright`
2. Create a `PlaywrightWebTaskRunner` class
3. Replace the stub in `electron/services/webTaskRunner.ts`

## Project Structure

```
claude-agent-scheduler/
├── electron/                 # Electron main process
│   ├── main.ts              # App entry point
│   ├── preload.ts           # IPC bridge
│   ├── database/            # SQLite layer
│   │   ├── index.ts         # DB operations
│   │   ├── migrations.ts    # Schema migrations
│   │   └── templates.ts     # Default agents
│   ├── scheduler/           # Scheduling engine
│   │   ├── index.ts         # Main scheduler
│   │   └── recurrence.ts    # Date calculations
│   └── services/            # Services
│       ├── execution.ts     # Process runner
│       └── webTaskRunner.ts # Browser automation stub
├── renderer/                # React components
│   ├── components/          # UI components
│   │   └── ui/             # Reusable UI primitives
│   ├── hooks/              # React hooks
│   └── styles/             # Global styles
├── pages/                   # Next.js pages
│   ├── index.tsx           # Calendar view
│   ├── agents/             # Agent management
│   ├── runs/               # Run history
│   ├── schedules/          # Schedule wizard
│   └── settings/           # App settings
├── shared/                  # Shared types
│   └── types/              # TypeScript definitions
└── package.json
```

## Demo Script (1-2 minutes)

Follow these steps to demonstrate the app:

### 1. First Launch (~20 seconds)
- Launch the app
- Notice the "Night Shift Job Hunter" template agent already created
- The calendar shows the next scheduled run (disabled by default)

### 2. Create an Agent (~30 seconds)
- Click "New Agent" in the top bar
- Select the "Blank Agent" template
- Enter name: "Daily Report"
- Enter description: "Generate a daily summary"
- Enter prompt: "Generate a brief summary of today's date and time"
- Click "Create Agent"

### 3. Schedule the Agent (~30 seconds)
- On the agent detail page, click "Add Schedule"
- Enter name: "Morning Report"
- Select frequency: "Daily"
- Set time to the current time + 2 minutes
- Click "Create Schedule"

### 4. Run Manually (~20 seconds)
- Click "Run Now" on the agent detail page
- Watch the status change to "Running"
- Navigate to "Runs" in the sidebar
- Click the run to see the live output

### 5. View Calendar (~10 seconds)
- Navigate to "Calendar" in the sidebar
- See the scheduled run appear
- Click the event to see details

## Roadmap

- [ ] Real Playwright browser automation
- [ ] Agent chaining (output → next agent)
- [ ] Email/Slack notifications
- [ ] Run history analytics
- [ ] Cloud sync (optional)
- [ ] Plugin system for custom runners
- [ ] Dark mode

## License

MIT

---

Built with care for AI automation enthusiasts.
