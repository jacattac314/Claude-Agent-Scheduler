#!/usr/bin/env node

/**
 * Vercel MCP Server
 *
 * This server implements the Model Context Protocol (MCP) for Vercel integration,
 * providing AI-powered deployment management, production debugging, and monitoring.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { exec } from 'child_process';
import { promisify } from 'util';
import dotenv from 'dotenv';

dotenv.config();

const execAsync = promisify(exec);

class VercelMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: 'vercel-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.vercelToken = process.env.VERCEL_API_TOKEN;
    this.setupTools();
    this.setupHandlers();
  }

  setupTools() {
    this.tools = [
      {
        name: 'deploy',
        description: 'Deploy the project to Vercel (production or preview)',
        inputSchema: {
          type: 'object',
          properties: {
            environment: {
              type: 'string',
              enum: ['production', 'preview'],
              description: 'Deployment environment',
              default: 'preview',
            },
            force: {
              type: 'boolean',
              description: 'Force deployment even if tests fail',
              default: false,
            },
          },
        },
      },
      {
        name: 'list_deployments',
        description: 'List recent deployments with status',
        inputSchema: {
          type: 'object',
          properties: {
            limit: {
              type: 'number',
              description: 'Number of deployments to retrieve',
              default: 10,
            },
          },
        },
      },
      {
        name: 'get_deployment_logs',
        description: 'Retrieve logs from a specific deployment for debugging',
        inputSchema: {
          type: 'object',
          properties: {
            deploymentId: {
              type: 'string',
              description: 'Deployment ID',
            },
          },
          required: ['deploymentId'],
        },
      },
      {
        name: 'inspect_deployment',
        description: 'Get detailed information about a deployment including failure reasons',
        inputSchema: {
          type: 'object',
          properties: {
            deploymentId: {
              type: 'string',
              description: 'Deployment ID to inspect',
            },
          },
          required: ['deploymentId'],
        },
      },
      {
        name: 'analyze_failure',
        description: 'AI-powered analysis of deployment failures with suggested fixes',
        inputSchema: {
          type: 'object',
          properties: {
            deploymentId: {
              type: 'string',
              description: 'Failed deployment ID',
            },
          },
          required: ['deploymentId'],
        },
      },
      {
        name: 'get_env_vars',
        description: 'List environment variables for the project',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'get_project_info',
        description: 'Get project information and settings',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
    ];
  }

  setupHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: this.tools,
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        const { name, arguments: args } = request.params;

        switch (name) {
          case 'deploy':
            return await this.handleDeploy(args);
          case 'list_deployments':
            return await this.handleListDeployments(args);
          case 'get_deployment_logs':
            return await this.handleGetLogs(args);
          case 'inspect_deployment':
            return await this.handleInspectDeployment(args);
          case 'analyze_failure':
            return await this.handleAnalyzeFailure(args);
          case 'get_env_vars':
            return await this.handleGetEnvVars();
          case 'get_project_info':
            return await this.handleGetProjectInfo();
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error.message}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  async handleDeploy(args) {
    const isProd = args.environment === 'production';
    const cmd = isProd ? 'vercel --prod' : 'vercel';

    try {
      const { stdout, stderr } = await execAsync(cmd);
      return {
        content: [
          {
            type: 'text',
            text: `Deployment started:\n${stdout}\n${stderr}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Deployment failed: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }

  async handleListDeployments(args) {
    const limit = args.limit || 10;
    try {
      const { stdout } = await execAsync(`vercel ls --limit ${limit}`);
      return {
        content: [
          {
            type: 'text',
            text: stdout,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Failed to list deployments: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }

  async handleGetLogs(args) {
    const { deploymentId } = args;
    try {
      const { stdout } = await execAsync(`vercel logs ${deploymentId}`);
      return {
        content: [
          {
            type: 'text',
            text: stdout,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Failed to retrieve logs: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }

  async handleInspectDeployment(args) {
    const { deploymentId } = args;
    try {
      const { stdout } = await execAsync(`vercel inspect ${deploymentId}`);
      return {
        content: [
          {
            type: 'text',
            text: stdout,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Failed to inspect deployment: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }

  async handleAnalyzeFailure(args) {
    const { deploymentId } = args;
    try {
      // Get deployment details and logs
      const { stdout: details } = await execAsync(`vercel inspect ${deploymentId}`);
      const { stdout: logs } = await execAsync(`vercel logs ${deploymentId}`);

      // AI-powered analysis (placeholder - would integrate with actual AI service)
      const analysis = this.analyzeDeploymentFailure(details, logs);

      return {
        content: [
          {
            type: 'text',
            text: `Deployment Analysis:\n\n${analysis}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Failed to analyze deployment: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }

  analyzeDeploymentFailure(details, logs) {
    // Simple pattern matching analysis
    let analysis = 'Deployment Failure Analysis:\n\n';

    if (logs.includes('ENOENT') || logs.includes('not found')) {
      analysis += '❌ Missing files or dependencies detected\n';
      analysis += '💡 Suggestion: Check if all required files are committed and dependencies are installed\n\n';
    }

    if (logs.includes('syntax error') || logs.includes('SyntaxError')) {
      analysis += '❌ Syntax errors found in code\n';
      analysis += '💡 Suggestion: Review recent code changes and run local tests\n\n';
    }

    if (logs.includes('build failed') || logs.includes('Build error')) {
      analysis += '❌ Build process failed\n';
      analysis += '💡 Suggestion: Try building locally with npm run build or verify build configuration\n\n';
    }

    if (logs.includes('timeout') || logs.includes('timed out')) {
      analysis += '❌ Deployment timed out\n';
      analysis += '💡 Suggestion: Optimize build process or increase timeout settings\n\n';
    }

    if (logs.includes('memory') || logs.includes('out of memory')) {
      analysis += '❌ Memory issues detected\n';
      analysis += '💡 Suggestion: Optimize memory usage or upgrade deployment plan\n\n';
    }

    analysis += 'Logs:\n' + logs;

    return analysis;
  }

  async handleGetEnvVars() {
    try {
      const { stdout } = await execAsync('vercel env ls');
      return {
        content: [
          {
            type: 'text',
            text: stdout,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Failed to retrieve environment variables: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }

  async handleGetProjectInfo() {
    try {
      const { stdout } = await execAsync('vercel project ls');
      return {
        content: [
          {
            type: 'text',
            text: stdout,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Failed to retrieve project info: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }

  async start() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Vercel MCP Server running on stdio');
  }
}

// Start the server
const server = new VercelMCPServer();
server.start().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});
