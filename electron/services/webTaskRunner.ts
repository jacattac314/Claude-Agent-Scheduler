import type { WebTaskAction, WebTaskResult, WebTaskRunner } from '../../shared/types';

/**
 * Stub implementation of WebTaskRunner
 * This logs intended actions without performing them.
 *
 * To implement real browser automation:
 * 1. Install playwright: npm install playwright
 * 2. Create a new class implementing WebTaskRunner
 * 3. Replace StubWebTaskRunner with the real implementation
 */
export class StubWebTaskRunner implements WebTaskRunner {
  private logs: string[] = [];

  /**
   * Check if browser automation is available
   * Always returns false for the stub implementation
   */
  isAvailable(): boolean {
    return false;
  }

  /**
   * Run a series of web automation actions
   * In this stub, it just logs what would happen
   */
  async run(actions: WebTaskAction[]): Promise<WebTaskResult> {
    this.logs = [];
    const executedActions: WebTaskAction[] = [];

    this.log('=== WebTaskRunner Stub ===');
    this.log('The following actions would be executed with real browser automation:');
    this.log('');

    for (const action of actions) {
      try {
        await this.executeStubAction(action);
        executedActions.push(action);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        this.log(`ERROR: ${errorMessage}`);
        return {
          success: false,
          actions: executedActions,
          logs: this.logs,
          error: errorMessage,
        };
      }
    }

    this.log('');
    this.log('=== End of Stub Execution ===');

    return {
      success: true,
      actions: executedActions,
      logs: this.logs,
    };
  }

  /**
   * Simulate executing an action (just logs it)
   */
  private async executeStubAction(action: WebTaskAction): Promise<void> {
    // Simulate some processing time
    await new Promise(resolve => setTimeout(resolve, 100));

    switch (action.type) {
      case 'navigate':
        this.log(`[NAVIGATE] Would navigate to: ${action.target}`);
        break;

      case 'click':
        this.log(`[CLICK] Would click element: ${action.target}`);
        break;

      case 'type':
        this.log(`[TYPE] Would type "${action.value}" into: ${action.target}`);
        break;

      case 'wait':
        this.log(`[WAIT] Would wait ${action.timeout || 1000}ms`);
        break;

      case 'screenshot':
        this.log(`[SCREENSHOT] Would take screenshot: ${action.target || 'unnamed'}`);
        break;

      case 'extract':
        this.log(`[EXTRACT] Would extract data from: ${action.target}`);
        break;

      default:
        this.log(`[UNKNOWN] Unknown action type: ${(action as any).type}`);
    }
  }

  private log(message: string): void {
    console.log(`[WebTaskRunner] ${message}`);
    this.logs.push(message);
  }
}

/**
 * Factory function to get the appropriate WebTaskRunner
 * Currently returns the stub implementation
 *
 * To use real browser automation, check for playwright availability
 * and return a PlaywrightWebTaskRunner instead
 */
export function createWebTaskRunner(): WebTaskRunner {
  // In the future, this could check for playwright and return a real implementation:
  // try {
  //   require('playwright');
  //   return new PlaywrightWebTaskRunner();
  // } catch {
  //   return new StubWebTaskRunner();
  // }

  return new StubWebTaskRunner();
}

/**
 * Example of how a real Playwright implementation would look
 * (not implemented, just for documentation)
 */
/*
export class PlaywrightWebTaskRunner implements WebTaskRunner {
  private browser: Browser | null = null;

  isAvailable(): boolean {
    try {
      require('playwright');
      return true;
    } catch {
      return false;
    }
  }

  async run(actions: WebTaskAction[]): Promise<WebTaskResult> {
    const { chromium } = require('playwright');
    this.browser = await chromium.launch({ headless: true });
    const page = await this.browser.newPage();

    // ... implement actual browser automation

    await this.browser.close();
    return { success: true, actions, logs: [] };
  }
}
*/
