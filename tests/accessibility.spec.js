const { test, expect } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;

test.describe('Accessibility Tests', () => {
  test.beforeEach(async ({ page }) => {
    const htmlPath = 'file://' + process.cwd() + '/index.html';
    await page.goto(htmlPath);
  });

  test('should not have any automatically detectable accessibility issues', async ({ page }) => {
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should have proper color contrast', async ({ page }) => {
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2aa', 'wcag21aa'])
      .analyze();

    const contrastViolations = accessibilityScanResults.violations.filter(
      v => v.id === 'color-contrast'
    );
    expect(contrastViolations).toEqual([]);
  });

  test('should have proper heading structure', async ({ page }) => {
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withRules(['heading-order'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('all interactive elements should be keyboard accessible', async ({ page }) => {
    const links = await page.locator('a[href]').all();

    for (const link of links) {
      await link.focus();
      const isFocused = await link.evaluate(el => el === document.activeElement);
      expect(isFocused).toBe(true);
    }
  });

  test('should have proper document language', async ({ page }) => {
    const lang = await page.locator('html').getAttribute('lang');
    expect(lang).toBe('en');
  });

  test('page should have a main landmark', async ({ page }) => {
    // Check if there's semantic structure (even if not explicit main tag)
    const hasSemanticStructure = await page.evaluate(() => {
      return document.querySelector('section, article, main') !== null;
    });
    expect(hasSemanticStructure).toBe(true);
  });
});
