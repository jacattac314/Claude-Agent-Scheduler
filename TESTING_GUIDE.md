# Testing Guide

This guide explains how to run all tests for the TPM Portfolio website.

## Quick Start

```bash
# Install dependencies
npm install

# Run all Jest tests (content + HTML validation)
npm test

# Run Playwright tests (accessibility + visual regression)
npm run test:playwright

# Run complete validation suite
npm run validate
```

## Test Suites

### 1. Content Validation Tests (Jest)

**Location**: `tests/content-validation.test.js`

**What it tests**:
- No placeholder content (`[Your Name]`, `[Company Name]`, etc.)
- All links are valid (no broken URLs)
- Proper heading hierarchy (h1 → h2 → h3)
- All case studies have required sections
- Professional content quality

**Run command**:
```bash
npm test tests/content-validation.test.js
```

**Test count**: 20 tests

### 2. HTML Validation Tests (Jest)

**Location**: `tests/html-validation.test.js`

**What it tests**:
- HTML5 specification compliance
- No HTML encoding errors (& → &amp;, > → &gt;)
- Semantic HTML usage
- No deprecated elements
- Proper tag closure

**Run command**:
```bash
npm run test:html
```

**Test count**: 6 tests

### 3. Accessibility Tests (Playwright)

**Location**: `tests/accessibility.spec.js`

**What it tests**:
- WCAG 2.1 AA compliance using axe-core
- Color contrast requirements
- Proper heading structure
- Keyboard navigation support

**Run command**:
```bash
npm run test:a11y
```

**Test count**: 3 tests

**Requirements**:
- Playwright browsers must be installed
- Run `npx playwright install chromium` first (requires internet access)

### 4. Visual Regression Tests (Playwright)

**Location**: `tests/visual-regression.spec.js`

**What it tests**:
- Desktop layouts (1920px, 1440px, 1024px)
- Mobile layouts (375px, 414px, 320px)
- Tablet layouts (768px, 1024px landscape)
- Interactive states (hover effects)
- Responsive grid behavior
- Typography and spacing

**Run command**:
```bash
npm run test:playwright tests/visual-regression.spec.js
```

**Test count**: 25 tests across 8 describe blocks

**First run**:
```bash
# Generate baseline screenshots
npm run test:playwright -- --update-snapshots
```

**Requirements**:
- Playwright browsers must be installed
- Run `npx playwright install` for all browsers

## Test Results Summary

### Current Status

✅ **Jest Tests**: 27/27 passing
- Content Validation: 20/20 ✓
- HTML Validation: 6/6 ✓
- No failures, no warnings

⏸️ **Playwright Tests**: Ready (requires browser installation)
- Accessibility: 3 tests ready
- Visual Regression: 25 tests ready

## Running Tests in CI/CD

### GitHub Actions Workflow

The `.github/workflows/tests.yml` file runs tests automatically on:
- Every push to `main` or `claude/*` branches
- All pull requests

**What runs in CI**:
1. Install dependencies (`npm install`)
2. Install Playwright browsers
3. Run Jest tests (`npm test`)
4. Run Playwright tests (`npm run test:playwright`)
5. Upload test reports as artifacts

**Note**: Playwright browser installation may fail in restricted network environments. In that case:
- Jest tests will still run and validate HTML/content
- Playwright tests can be run locally or in less restrictive CI environment

### Required Environment

- Node.js 18+
- npm 9+
- Internet access for Playwright browser downloads (initial setup)

## Troubleshooting

### Playwright Browser Installation Fails

**Error**: `Download failed: server returned code 403`

**Solution**:
```bash
# Set alternate download mirror
export PLAYWRIGHT_DOWNLOAD_HOST=https://playwright.azureedge.net

# Or skip browser install and use system browsers
export PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
```

**Alternative**: Run tests in a different environment (local dev machine, different CI provider)

### HTML Validation Async Errors

**Error**: `Cannot read properties of undefined (reading 'flatMap')`

**Fix**: Ensure all HTML validation tests use `async/await`:
```javascript
test('should be valid', async () => {
  const report = await htmlvalidate.validateString(html);
  // ...
});
```

### Jest and Playwright Conflict

**Error**: `Playwright Test needs to be invoked via 'npx playwright test'`

**Fix**: Keep test files separated:
- Jest tests: `*.test.js`
- Playwright tests: `*.spec.js`

## Test Coverage

### What's Covered ✅

- [x] Content validation (placeholders, links, structure)
- [x] HTML5 specification compliance
- [x] HTML character encoding
- [x] Semantic HTML usage
- [x] Accessibility (WCAG 2.1 AA)
- [x] Visual regression (responsive design)
- [x] Interactive states (hover, focus)

### Future Enhancements 🔮

- [ ] Performance testing (Lighthouse CI)
- [ ] SEO validation (meta tags, schema.org)
- [ ] Cross-browser testing (Safari, Edge)
- [ ] Link checker for external URLs
- [ ] CSS validation with stylelint
- [ ] Screenshot comparison in CI
- [ ] Bundle size analysis

## Writing New Tests

### Content Validation Test Example

```javascript
test('should have contact information', () => {
  const $ = cheerio.load(html);
  const contactLinks = $('.contact a');

  expect(contactLinks.length).toBeGreaterThan(0);
  expect($('a[href^="mailto:"]').length).toBe(1);
});
```

### Accessibility Test Example

```javascript
test('should have proper ARIA labels', async ({ page }) => {
  await page.goto('file://' + process.cwd() + '/index.html');

  const accessibilityScanResults = await new AxeBuilder({ page })
    .withRules(['aria-required-attr'])
    .analyze();

  expect(accessibilityScanResults.violations).toEqual([]);
});
```

### Visual Regression Test Example

```javascript
test('new component looks correct', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('file://' + process.cwd() + '/index.html');

  const component = page.locator('.new-component');
  await expect(component).toHaveScreenshot('new-component.png');
});
```

## Test Reports

### Jest Coverage Report

```bash
npm run test:coverage
```

Report location: `coverage/lcov-report/index.html`

### Playwright HTML Report

After running Playwright tests:
```bash
npx playwright show-report
```

Report location: `playwright-report/index.html`

## Best Practices

1. **Run tests before committing**
   ```bash
   npm test
   ```

2. **Update snapshots intentionally**
   ```bash
   # Only when visual changes are expected
   npm run test:playwright -- --update-snapshots
   ```

3. **Keep tests fast**
   - Use `page.waitForLoadState()` instead of arbitrary timeouts
   - Run Jest tests in parallel (default)

4. **Test real user scenarios**
   - Click links, scroll, hover
   - Test on multiple viewport sizes
   - Verify accessibility with keyboard navigation

5. **Document test failures**
   - Screenshot on failure (automatic with Playwright)
   - Include error messages in commits
   - Update tests when requirements change

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Playwright Testing](https://playwright.dev/docs/intro)
- [axe-core Rules](https://github.com/dequelabs/axe-core/blob/develop/doc/rule-descriptions.md)
- [html-validate Rules](https://html-validate.org/rules/)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
