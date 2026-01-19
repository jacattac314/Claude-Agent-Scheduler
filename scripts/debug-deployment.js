#!/usr/bin/env node

/**
 * Production Debugging Utility for Vercel Deployments
 *
 * This script provides comprehensive debugging capabilities for production deployments,
 * including log analysis, performance metrics, and error reporting.
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs').promises;
const path = require('path');

const execAsync = promisify(exec);

class DeploymentDebugger {
  constructor() {
    this.colors = {
      reset: '\x1b[0m',
      red: '\x1b[31m',
      green: '\x1b[32m',
      yellow: '\x1b[33m',
      blue: '\x1b[34m',
      magenta: '\x1b[35m',
      cyan: '\x1b[36m',
    };
  }

  log(message, color = 'reset') {
    console.log(`${this.colors[color]}${message}${this.colors.reset}`);
  }

  async getLatestDeployment() {
    try {
      const { stdout } = await execAsync('vercel ls --limit 1');
      const lines = stdout.trim().split('\n');
      if (lines.length < 2) {
        throw new Error('No deployments found');
      }
      // Parse the deployment ID from the output
      const deploymentLine = lines[1];
      const deploymentId = deploymentLine.trim().split(/\s+/)[0];
      return deploymentId;
    } catch (error) {
      throw new Error(`Failed to get latest deployment: ${error.message}`);
    }
  }

  async getDeploymentInfo(deploymentId) {
    try {
      const { stdout } = await execAsync(`vercel inspect ${deploymentId}`);
      return stdout;
    } catch (error) {
      throw new Error(`Failed to get deployment info: ${error.message}`);
    }
  }

  async getDeploymentLogs(deploymentId) {
    try {
      const { stdout } = await execAsync(`vercel logs ${deploymentId}`);
      return stdout;
    } catch (error) {
      throw new Error(`Failed to get deployment logs: ${error.message}`);
    }
  }

  parseDeploymentInfo(info) {
    const parsed = {
      status: null,
      url: null,
      created: null,
      buildTime: null,
      regions: [],
    };

    const statusMatch = info.match(/status:\s+(\w+)/i);
    if (statusMatch) parsed.status = statusMatch[1];

    const urlMatch = info.match(/url:\s+(https?:\/\/[^\s]+)/i);
    if (urlMatch) parsed.url = urlMatch[1];

    const createdMatch = info.match(/created:\s+(.+)/i);
    if (createdMatch) parsed.created = createdMatch[1];

    return parsed;
  }

  analyzeLogs(logs) {
    const analysis = {
      errors: [],
      warnings: [],
      performance: [],
      summary: '',
    };

    const lines = logs.split('\n');

    lines.forEach((line) => {
      // Check for errors
      if (line.match(/error|failed|exception/i)) {
        analysis.errors.push(line);
      }

      // Check for warnings
      if (line.match(/warn|warning/i)) {
        analysis.warnings.push(line);
      }

      // Check for performance issues
      if (line.match(/slow|timeout|memory|performance/i)) {
        analysis.performance.push(line);
      }
    });

    // Generate summary
    analysis.summary = `
Found:
  - ${analysis.errors.length} error(s)
  - ${analysis.warnings.length} warning(s)
  - ${analysis.performance.length} performance issue(s)
    `;

    return analysis;
  }

  async generateDebugReport(deploymentId) {
    this.log('\n🔍 Generating Debug Report...', 'cyan');
    this.log('━'.repeat(50), 'cyan');

    try {
      // Get deployment info
      this.log('\n📊 Fetching Deployment Info...', 'blue');
      const info = await this.getDeploymentInfo(deploymentId);
      const parsed = this.parseDeploymentInfo(info);

      this.log('\n✅ Deployment Details:', 'green');
      console.log(info);

      // Get and analyze logs
      this.log('\n📝 Fetching Deployment Logs...', 'blue');
      const logs = await this.getDeploymentLogs(deploymentId);
      const analysis = this.analyzeLogs(logs);

      // Display analysis
      this.log('\n📈 Log Analysis:', 'magenta');
      console.log(analysis.summary);

      if (analysis.errors.length > 0) {
        this.log('\n❌ Errors Found:', 'red');
        analysis.errors.forEach((error) => {
          console.log(`  ${error}`);
        });
      }

      if (analysis.warnings.length > 0) {
        this.log('\n⚠️  Warnings Found:', 'yellow');
        analysis.warnings.forEach((warning) => {
          console.log(`  ${warning}`);
        });
      }

      if (analysis.performance.length > 0) {
        this.log('\n⏱️  Performance Issues:', 'yellow');
        analysis.performance.forEach((issue) => {
          console.log(`  ${issue}`);
        });
      }

      // Recommendations
      this.log('\n💡 Recommendations:', 'cyan');
      if (analysis.errors.length > 0) {
        this.log('  • Review and fix errors before next deployment', 'yellow');
      }
      if (analysis.warnings.length > 0) {
        this.log('  • Address warnings to improve deployment quality', 'yellow');
      }
      if (analysis.performance.length > 0) {
        this.log('  • Optimize performance issues for better user experience', 'yellow');
      }
      if (
        analysis.errors.length === 0 &&
        analysis.warnings.length === 0 &&
        analysis.performance.length === 0
      ) {
        this.log('  ✅ No issues found! Deployment looks healthy.', 'green');
      }

      // Save report
      const reportPath = await this.saveReport({
        deploymentId,
        info: parsed,
        analysis,
        timestamp: new Date().toISOString(),
      });

      this.log(`\n💾 Report saved to: ${reportPath}`, 'green');
      this.log('━'.repeat(50), 'cyan');
    } catch (error) {
      this.log(`\n❌ Error generating report: ${error.message}`, 'red');
      throw error;
    }
  }

  async saveReport(report) {
    const reportsDir = path.join(process.cwd(), 'debug-reports');
    try {
      await fs.mkdir(reportsDir, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }

    const filename = `debug-${report.deploymentId}-${Date.now()}.json`;
    const filepath = path.join(reportsDir, filename);

    await fs.writeFile(filepath, JSON.stringify(report, null, 2));
    return filepath;
  }

  async run() {
    try {
      this.log('\n🚀 Vercel Deployment Debugger', 'cyan');
      this.log('━'.repeat(50), 'cyan');

      // Get deployment ID from command line or use latest
      const deploymentId = process.argv[2];

      if (deploymentId) {
        this.log(`\n🎯 Debugging deployment: ${deploymentId}`, 'blue');
        await this.generateDebugReport(deploymentId);
      } else {
        this.log('\n🔎 No deployment ID provided, using latest deployment...', 'yellow');
        const latestId = await this.getLatestDeployment();
        this.log(`📍 Latest deployment: ${latestId}`, 'blue');
        await this.generateDebugReport(latestId);
      }

      this.log('\n✅ Debug complete!\n', 'green');
    } catch (error) {
      this.log(`\n❌ Debug failed: ${error.message}\n`, 'red');
      process.exit(1);
    }
  }
}

// Run the debugger
const debugger = new DeploymentDebugger();
debugger.run();
