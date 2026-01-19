# Vercel MCP Integration Guide

Complete guide for setting up and using Vercel MCP (Model Context Protocol) integration in this project.

## Table of Contents

- [Overview](#overview)
- [Quick Start](#quick-start)
- [Configuration](#configuration)
- [Usage](#usage)
- [Troubleshooting](#troubleshooting)
- [Advanced Features](#advanced-features)

## Overview

Vercel MCP integration provides:

- **Quick Publishing**: Deploy to the internet in seconds
- **Production Debugging**: Comprehensive debugging tools for live deployments
- **AI-Powered Analysis**: Intelligent analysis of deployment failures
- **Documentation Assistance**: Contextual documentation and help
- **Automated CI/CD**: Seamless GitHub Actions integration

## Quick Start

### 1. Install Vercel CLI

```bash
npm install -g vercel
```

### 2. Login to Vercel

```bash
vercel login
```

Follow the prompts to authenticate with your Vercel account.

### 3. Link Your Project

```bash
vercel link
```

This will:
- Create a new Vercel project (or link to existing one)
- Generate `.vercel/project.json` with your project IDs
- Set up the connection between local and Vercel

### 4. Set Up Environment Variables

```bash
# Copy the example file
cp .env.example .env

# Edit .env and add your values
nano .env
```

Required variables:
```env
VERCEL_API_TOKEN=your_token_here
VERCEL_ORG_ID=your_org_id
VERCEL_PROJECT_ID=your_project_id
```

Get your API token from: https://vercel.com/account/tokens

### 5. Install Dependencies

```bash
npm install
```

### 6. Deploy!

```bash
# Preview deployment
npm run deploy:preview

# Production deployment
npm run deploy
```

## Configuration

### Vercel Configuration (`vercel.json`)

```json
{
  "version": 2,
  "name": "claude-agent-scheduler",
  "builds": [
    {
      "src": "index.html",
      "use": "@vercel/static"
    }
  ]
}
```

Key settings:
- **version**: Vercel platform version (always 2)
- **name**: Project name
- **builds**: Build configuration for static files
- **routes**: Custom routing rules
- **headers**: Security headers for all responses

### MCP Configuration (`mcp-config.json`)

The MCP configuration defines available tools and capabilities:

- **Deployment Operations**: Deploy, list, inspect deployments
- **Log Management**: Retrieve and analyze logs
- **Environment Variables**: Manage project environment
- **AI Integration**: Enable AI-powered features

## Usage

### Deployment Commands

```bash
# Development server with hot reload
npm run vercel:dev

# Preview deployment (for testing)
npm run deploy:preview

# Production deployment
npm run deploy

# View deployment logs
npm run vercel:logs

# Inspect specific deployment
npm run vercel:inspect
```

### Production Debugging

Debug any deployment:

```bash
# Debug latest deployment
npm run debug:prod

# Debug specific deployment by ID
npm run debug:prod dpl_abc123xyz
```

The debugger analyzes:
- Deployment status and metadata
- Error patterns and warnings
- Performance issues
- Build failures

Output includes:
- Color-coded analysis report
- AI-powered recommendations
- JSON debug report saved to `debug-reports/`

### MCP Server

Start the MCP server for AI-powered deployment management:

```bash
npm run mcp:start
```

Available MCP tools:

#### `deploy`
Deploy the project to Vercel.
```json
{
  "environment": "production|preview",
  "force": false
}
```

#### `list_deployments`
List recent deployments.
```json
{
  "limit": 10
}
```

#### `get_deployment_logs`
Retrieve logs from a deployment.
```json
{
  "deploymentId": "dpl_abc123"
}
```

#### `inspect_deployment`
Get detailed deployment information.
```json
{
  "deploymentId": "dpl_abc123"
}
```

#### `analyze_failure`
AI-powered analysis of deployment failures.
```json
{
  "deploymentId": "dpl_abc123"
}
```

## GitHub Actions Integration

### Automatic Deployment

The project includes GitHub Actions workflow that:

1. **Runs Tests**: HTML validation, accessibility, visual tests
2. **Deploys to Vercel**:
   - Preview for all branches (except main)
   - Production for main branch
3. **Runs Debug Analysis**: Generates debug report for each deployment
4. **Uploads Artifacts**: Saves reports for 30 days

### Setting Up GitHub Secrets

1. Go to your GitHub repository
2. Navigate to Settings → Secrets and variables → Actions
3. Add these secrets:

```
VERCEL_TOKEN - Your Vercel API token
VERCEL_ORG_ID - From .vercel/project.json
VERCEL_PROJECT_ID - From .vercel/project.json
```

Get project IDs:
```bash
cat .vercel/project.json
```

## Troubleshooting

### Common Issues

#### 1. "Vercel CLI not found"

**Solution**: Install Vercel CLI globally
```bash
npm install -g vercel@latest
```

#### 2. "Authentication failed"

**Solution**: Re-login to Vercel
```bash
vercel logout
vercel login
```

#### 3. "Project not linked"

**Solution**: Link your project
```bash
vercel link
```

#### 4. "Deployment failed: Build timeout"

**Causes**:
- Large dependencies
- Slow build process

**Solutions**:
- Optimize dependencies
- Upgrade Vercel plan for longer timeouts
- Use caching strategies

#### 5. "Environment variables not found"

**Solution**:
```bash
# Add environment variable
vercel env add VARIABLE_NAME

# Or in Vercel dashboard:
# Project Settings → Environment Variables
```

### Debug Workflow

1. **Check deployment status**:
   ```bash
   vercel ls
   ```

2. **Inspect failed deployment**:
   ```bash
   vercel inspect <deployment-id>
   ```

3. **View deployment logs**:
   ```bash
   vercel logs <deployment-id>
   ```

4. **Run debug analysis**:
   ```bash
   npm run debug:prod <deployment-id>
   ```

5. **Check debug report**:
   ```bash
   cat debug-reports/debug-<deployment-id>-*.json
   ```

## Advanced Features

### Custom Domain Setup

1. **Add domain in Vercel**:
   ```bash
   vercel domains add example.com
   ```

2. **Configure DNS** according to Vercel instructions

3. **Verify domain**:
   ```bash
   vercel domains verify example.com
   ```

### Environment Variables Management

```bash
# List all environment variables
npm run vercel:env

# Add new variable
vercel env add API_KEY

# Remove variable
vercel env rm API_KEY

# Pull environment to local
vercel env pull .env.local
```

### Preview Deployments

Every git push creates a preview deployment:
- Unique URL for testing
- Isolated environment
- Full production parity

Access preview URLs:
1. Check GitHub Actions workflow output
2. Visit Vercel dashboard
3. Use `vercel ls` command

### Performance Optimization

**Enable caching**:
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

**Image optimization** (for future image assets):
```json
{
  "images": {
    "domains": ["your-domain.com"],
    "deviceSizes": [640, 750, 828, 1080, 1200],
    "imageSizes": [16, 32, 48, 64, 96]
  }
}
```

### Monitoring and Analytics

**Vercel Analytics** (optional):
```bash
npm install @vercel/analytics
```

**Production monitoring**:
- Real-time logs: `npm run vercel:logs`
- Debug reports: `npm run debug:prod`
- GitHub Actions artifacts

## Best Practices

1. **Always test locally first**:
   ```bash
   npm run vercel:dev
   ```

2. **Run tests before deploying**:
   ```bash
   npm run validate
   ```

3. **Use preview deployments** for testing changes

4. **Monitor deployments** with debug tools

5. **Keep environment variables secure**:
   - Never commit `.env` files
   - Use Vercel's secure environment variables
   - Rotate tokens regularly

6. **Review debug reports** after deployments

7. **Set up alerts** in Vercel dashboard for failures

## Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Vercel CLI Reference](https://vercel.com/docs/cli)
- [MCP Protocol Specification](https://modelcontextprotocol.io)
- [GitHub Actions Documentation](https://docs.github.com/actions)

## Support

For issues related to:
- **Vercel Platform**: [Vercel Support](https://vercel.com/support)
- **This Integration**: Open an issue in this repository
- **MCP Protocol**: [MCP Community](https://github.com/modelcontextprotocol)

---

Happy deploying! 🚀
