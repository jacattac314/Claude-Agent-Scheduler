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

This site is designed for GitHub Pages. Simply:

1. Fix all placeholder content
2. Ensure all tests pass
3. Push to main branch
4. Enable GitHub Pages in repository settings

## License

MIT
