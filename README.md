# TPM Portfolio Website

A professional portfolio website showcasing Technical Program Manager experience and case studies.

## Testing

This project now includes comprehensive testing to ensure quality and catch issues before deployment.

### Test Coverage

- ✅ **HTML Validation** - Ensures valid HTML5 markup
- ✅ **Content Validation** - Catches placeholder text and broken links
- ✅ **Accessibility Testing** - WCAG 2.1 compliance checks
- ✅ **Visual Regression** - Cross-browser and responsive design testing

### Running Tests

```bash
# Install dependencies
npm install

# Run all tests
npm test

# Run specific test suites
npm run test:html        # HTML validation
npm run test:a11y        # Accessibility tests
npm run test:visual      # Visual regression tests

# Run with coverage
npm run test:coverage

# Watch mode for development
npm run test:watch
```

### Test Reports

After running tests, view detailed reports:
- Jest coverage: `coverage/lcov-report/index.html`
- Playwright report: `playwright-report/index.html`

### Continuous Integration

Tests run automatically on:
- Every push to main or claude/* branches
- All pull requests

See `.github/workflows/tests.yml` for CI configuration.

### Known Issues to Fix

Before going live, address these placeholder items flagged by tests:

1. Replace `[Your Name]` in hero section (index.html:286)
2. Replace `[Company Name]` in all case studies (index.html:331, 395, 459, 523)
3. Update email from `you@email.com` to real email (index.html:290)
4. Update LinkedIn URL from placeholder (index.html:291)
5. Update GitHub URL from placeholder (index.html:292)
6. Add meta description for SEO
7. Add Open Graph tags for social sharing

See `TEST_COVERAGE_ANALYSIS.md` for detailed analysis and recommendations.

## Vercel MCP Integration

This project integrates with **Vercel MCP (Model Context Protocol)** for enhanced deployment, debugging, and AI-powered features.

### Features

🚀 **Quick Publishing** - Deploy to the internet instantly with `npm run deploy`

🔍 **Production Debugging** - Comprehensive debugging tools for live deployments

📊 **Deployment Analysis** - AI-powered analysis of why deployments fail

📚 **Documentation Assistant** - Contextual documentation lookup and help

🤖 **AI Integration** - Intelligent log parsing and error pattern recognition

### Setup

1. **Install Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Configure Environment Variables**:
   ```bash
   cp .env.example .env
   # Edit .env and add your Vercel API token and project IDs
   ```

4. **Link Your Project**:
   ```bash
   vercel link
   ```

### Deployment Commands

```bash
# Deploy to preview environment
npm run deploy:preview

# Deploy to production
npm run deploy

# Start local development server
npm run vercel:dev

# View deployment logs
npm run vercel:logs

# Inspect a deployment
npm run vercel:inspect

# List environment variables
npm run vercel:env
```

### Production Debugging

The integrated debugging utility helps diagnose deployment issues:

```bash
# Debug latest deployment
npm run debug:prod

# Debug specific deployment
npm run debug:prod <deployment-id>
```

The debugger provides:
- Deployment status and details
- Error and warning analysis
- Performance issue detection
- AI-powered recommendations
- Detailed debug reports (saved to `debug-reports/`)

### MCP Server

The MCP server provides AI-powered deployment management:

```bash
# Start MCP server
npm run mcp:start
```

Available MCP tools:
- `deploy` - Deploy the project
- `list_deployments` - List recent deployments
- `get_deployment_logs` - Retrieve deployment logs
- `inspect_deployment` - Get detailed deployment info
- `analyze_failure` - AI analysis of failures
- `get_env_vars` - List environment variables
- `get_project_info` - Get project information

### GitHub Actions Integration

Automatic deployment is configured in `.github/workflows/tests.yml`:

- ✅ Runs tests before deployment
- ✅ Deploys previews for all branches
- ✅ Deploys to production on main branch
- ✅ Generates debug reports for all deployments
- ✅ Uploads reports as workflow artifacts

### Required GitHub Secrets

Add these secrets to your GitHub repository:

- `VERCEL_TOKEN` - Your Vercel API token
- `VERCEL_ORG_ID` - Your Vercel organization ID
- `VERCEL_PROJECT_ID` - Your Vercel project ID

Get these values by running:
```bash
vercel link
cat .vercel/project.json
```

### Configuration Files

- `vercel.json` - Vercel project configuration
- `mcp-config.json` - MCP server configuration
- `.env.example` - Environment variables template
- `mcp-server/index.js` - MCP server implementation
- `scripts/debug-deployment.js` - Production debugging utility

## Development

This is a static HTML website with no build process. Simply edit `index.html` and open in a browser.

### Project Structure

```
├── index.html                    # Main portfolio page
├── package.json                  # Test dependencies
├── jest.config.js               # Jest configuration
├── playwright.config.js         # Playwright configuration
├── tests/                       # Test suites
│   ├── content-validation.test.js
│   ├── html-validation.test.js
│   └── accessibility.test.js
├── .github/workflows/tests.yml  # CI/CD pipeline
└── TEST_COVERAGE_ANALYSIS.md    # Detailed test strategy
```

## Deployment

### Vercel (Recommended)

This site now uses **Vercel** for fast, automated deployments:

1. Set up Vercel integration (see Vercel MCP Integration section above)
2. Fix all placeholder content
3. Ensure all tests pass
4. Deploy:
   - **Automatic**: Push to main branch (GitHub Actions deploys automatically)
   - **Manual**: Run `npm run deploy`

### GitHub Pages (Alternative)

Alternatively, you can deploy to GitHub Pages:

1. Fix all placeholder content
2. Ensure all tests pass
3. Push to main branch
4. Enable GitHub Pages in repository settings

## License

MIT
