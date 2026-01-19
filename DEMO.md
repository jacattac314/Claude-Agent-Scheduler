# Claude Agent Scheduler - Demo Script

This is a 2-minute demo script to showcase the key features of Claude Agent Scheduler.

## Prerequisites

Make sure you have:
- Node.js 18+ installed
- All dependencies installed (`npm install`)

## Starting the App

```bash
# Terminal 1: Start Next.js dev server
npm run dev:next

# Terminal 2 (wait for Next.js to be ready): Start Electron
npm run dev:electron
```

Or use the combined command:
```bash
npm run dev
```

Wait for both processes to start (Next.js on port 3000, then Electron window opens).

---

## Demo Walkthrough (2 minutes)

### 1. Calendar View (10 seconds)

**What to show:**
- The app opens directly to the Calendar view
- Clean, Apple-style interface with sidebar navigation
- Month view showing scheduled agents

**What to say:**
> "This is Claude Agent Scheduler - a desktop app for managing AI automation agents. The calendar gives you a visual overview of when your agents are scheduled to run."

---

### 2. Template Agent (20 seconds)

**Steps:**
1. Click **"Agents"** in the sidebar
2. Click on the **"Night Shift Job Hunter"** card
3. Scroll through the agent details

**What to show:**
- The detailed prompt
- The schedule section showing "Daily at 1:00 AM"
- The 30-minute run window
- Advanced settings (collapsed by default)

**What to say:**
> "Here's a template agent that comes pre-configured. It demonstrates a 'Night Shift' automation pattern - running at 1 AM every day with a 30-minute timeout. The prompt shows detailed instructions for the AI agent. This is disabled by default, but let me show you how easy it is to run an agent on demand."

---

### 3. Run an Agent (30 seconds)

**Steps:**
1. Click **"Run Now"**
2. Click **"Runs"** in the sidebar
3. Click on the newly created run
4. Show the logs panel

**What to show:**
- Real-time status change from "Running" to "Succeeded/Failed"
- Live log output in the terminal-style view
- Duration and exit code

**What to say:**
> "Clicking 'Run Now' executes the agent immediately. In the Runs view, we can see all execution history. Here's our agent running - the logs update in real-time. This one completes quickly, but for longer-running tasks, you could stop it manually or let the run window automatically timeout."

---

### 4. Create a New Agent (30 seconds)

**Steps:**
1. Go back to **"Agents"** view
2. Click **"New Agent"**
3. Fill in the form:
   - **Name**: "Morning News Summary"
   - **Description**: "Daily tech news digest"
   - **Prompt**: "Summarize today's top 5 tech news stories in bullet points. Focus on AI, startups, and developer tools."
4. Click **"Create Agent"**

**What to show:**
- Simple, focused form
- Advanced settings collapsed by default
- Immediate creation

**What to say:**
> "Creating a new agent is straightforward. Just give it a name, description, and detailed prompt. The advanced settings let you customize the command, working directory, and environment variables, but most agents just need the basics."

---

### 5. Schedule the Agent (30 seconds)

**Steps:**
1. From the agent detail page, click **"New Schedule"**
2. **Step 1 - When:**
   - Select **"Daily"**
   - Set time to **9:00 AM**
   - Keep default timezone
3. **Step 2 - Duration:**
   - Set **5 minutes**
4. **Step 3 - Review:**
   - Click **"Create Schedule"**

**What to show:**
- Clean 3-step wizard
- Visual step indicator
- Timezone selection
- Run window configuration

**What to say:**
> "Scheduling uses a simple 3-step wizard. Choose when it runs, set an optional timeout, and review. The scheduler handles all the complexity - timezones, DST, recurrence patterns. It runs in the background even when the UI is closed."

---

### 6. View on Calendar (10 seconds)

**Steps:**
1. Click **"Calendar"** in the sidebar
2. Navigate to show the newly created schedule
3. Click on the event

**What to show:**
- New schedule visible on calendar
- Event details drawer
- Quick actions (Run Now, Pause/Resume)

**What to say:**
> "Back on the calendar, we can see our new schedule. Clicking any event shows details and quick actions. Everything is visual and intuitive - no config files, no cron syntax, just a beautiful interface for managing your AI agents."

---

## Key Talking Points

Throughout the demo, emphasize:

1. **Local-first**: All data stays on your machine, stored in SQLite
2. **Beautiful UI**: Follows Apple design principles (clarity, deference, depth)
3. **Powerful scheduling**: Handles timezones, DST, recurrence patterns automatically
4. **Real-time monitoring**: See agents execute with live logs
5. **Run windows**: Automatic timeout protection
6. **Template agents**: Get started quickly with examples

## Common Questions & Answers

**Q: What commands can agents run?**
> By default, we use the `claude` CLI, but you can specify any command. The agent's prompt is passed as input.

**Q: Does it require internet?**
> The app itself is local-first, but your agents might need internet depending on what they do.

**Q: Can I export/backup my agents?**
> Currently, the SQLite database contains everything. Future versions may add export/import features.

**Q: What about browser automation?**
> There's a stub WebTaskRunner interface ready for Playwright/Puppeteer integration. See the README for implementation guide.

---

## Cleanup (Optional)

To reset the demo:
```bash
# Close the app
# Delete the database
rm -rf ~/Library/Application\ Support/claude-agent-scheduler/
# Restart the app - template agent will be recreated
```

---

**Total demo time: ~2 minutes**
**Files created during demo: 1 agent, 1 schedule**
**Runs executed: 1**
