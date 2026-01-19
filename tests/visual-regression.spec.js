const { test, expect } = require('@playwright/test');

test.describe('Visual Regression Tests', () => {
  const htmlPath = 'file://' + process.cwd() + '/index.html';

  test.describe('Desktop Views', () => {
    test('desktop 1920x1080 - full page', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.goto(htmlPath);
      await expect(page).toHaveScreenshot('desktop-1920-full.png', { fullPage: true });
    });

    test('desktop 1440x900 - hero section', async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto(htmlPath);
      const hero = page.locator('.hero');
      await expect(hero).toHaveScreenshot('desktop-1440-hero.png');
    });

    test('desktop 1024x768 - case study tiles', async ({ page }) => {
      await page.setViewportSize({ width: 1024, height: 768 });
      await page.goto(htmlPath);
      const tiles = page.locator('.tiles');
      await expect(tiles).toHaveScreenshot('desktop-1024-tiles.png');
    });
  });

  test.describe('Mobile Views', () => {
    test('mobile 375x667 (iPhone SE) - full page', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto(htmlPath);
      await expect(page).toHaveScreenshot('mobile-375-full.png', { fullPage: true });
    });

    test('mobile 414x896 (iPhone XR) - hero section', async ({ page }) => {
      await page.setViewportSize({ width: 414, height: 896 });
      await page.goto(htmlPath);
      const hero = page.locator('.hero');
      await expect(hero).toHaveScreenshot('mobile-414-hero.png');
    });

    test('mobile 320x568 (iPhone 5) - tiles section', async ({ page }) => {
      await page.setViewportSize({ width: 320, height: 568 });
      await page.goto(htmlPath);
      const tilesSection = page.locator('.tiles-section');
      await expect(tilesSection).toHaveScreenshot('mobile-320-tiles.png');
    });
  });

  test.describe('Tablet Views', () => {
    test('tablet 768x1024 (iPad) - full page', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto(htmlPath);
      await expect(page).toHaveScreenshot('tablet-768-full.png', { fullPage: true });
    });

    test('tablet landscape 1024x768 - case studies', async ({ page }) => {
      await page.setViewportSize({ width: 1024, height: 768 });
      await page.goto(htmlPath);
      const caseStudy = page.locator('#case-study-1');
      await expect(caseStudy).toHaveScreenshot('tablet-landscape-case-study.png');
    });
  });

  test.describe('Interactive States', () => {
    test('tile hover state', async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto(htmlPath);
      const tile = page.locator('.tile').first();
      await tile.hover();
      // Wait for transition
      await page.waitForTimeout(300);
      await expect(tile).toHaveScreenshot('tile-hover.png');
    });

    test('link hover state in hero', async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto(htmlPath);
      const link = page.locator('.hero .contact a').first();
      await link.hover();
      await expect(link).toHaveScreenshot('hero-link-hover.png');
    });

    test('back to top link hover', async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto(htmlPath);
      const backToTop = page.locator('.back-to-top a');
      await backToTop.scrollIntoViewIfNeeded();
      await backToTop.hover();
      await expect(backToTop).toHaveScreenshot('back-to-top-hover.png');
    });
  });

  test.describe('Scroll Behavior', () => {
    test('scroll to case study via anchor link', async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto(htmlPath);

      // Click tile to navigate to case study
      await page.locator('a[href="#case-study-2"]').click();
      await page.waitForTimeout(500);

      // Verify we scrolled to the right place
      const caseStudy = page.locator('#case-study-2');
      await expect(caseStudy).toBeInViewport();
      await expect(page).toHaveScreenshot('scrolled-to-case-study-2.png');
    });
  });

  test.describe('Responsive Grid Layout', () => {
    test('tiles grid at 1200px width', async ({ page }) => {
      await page.setViewportSize({ width: 1200, height: 900 });
      await page.goto(htmlPath);
      const tiles = page.locator('.tiles');
      await expect(tiles).toHaveScreenshot('tiles-grid-1200.png');
    });

    test('tiles grid at 800px width', async ({ page }) => {
      await page.setViewportSize({ width: 800, height: 900 });
      await page.goto(htmlPath);
      const tiles = page.locator('.tiles');
      await expect(tiles).toHaveScreenshot('tiles-grid-800.png');
    });

    test('tiles grid at 600px width (mobile breakpoint)', async ({ page }) => {
      await page.setViewportSize({ width: 600, height: 900 });
      await page.goto(htmlPath);
      const tiles = page.locator('.tiles');
      await expect(tiles).toHaveScreenshot('tiles-grid-600.png');
    });

    test('tiles grid at 480px width', async ({ page }) => {
      await page.setViewportSize({ width: 480, height: 900 });
      await page.goto(htmlPath);
      const tiles = page.locator('.tiles');
      await expect(tiles).toHaveScreenshot('tiles-grid-480.png');
    });
  });

  test.describe('Individual Sections', () => {
    test('case study header with metadata', async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto(htmlPath);
      const header = page.locator('#case-study-1 .case-study-header');
      await expect(header).toHaveScreenshot('case-study-header.png');
    });

    test('outcome cards grid', async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto(htmlPath);
      const outcomes = page.locator('#case-study-1 .outcomes-grid');
      await expect(outcomes).toHaveScreenshot('outcome-cards.png');
    });

    test('footer section', async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto(htmlPath);
      const footer = page.locator('footer');
      await footer.scrollIntoViewIfNeeded();
      await expect(footer).toHaveScreenshot('footer.png');
    });
  });

  test.describe('Typography & Spacing', () => {
    test('heading hierarchy', async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto(htmlPath);
      const caseStudy = page.locator('#case-study-3');
      await expect(caseStudy).toHaveScreenshot('typography-hierarchy.png');
    });

    test('list items with custom bullets', async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto(htmlPath);
      const list = page.locator('#case-study-1 .section ul').first();
      await expect(list).toHaveScreenshot('custom-bullets.png');
    });
  });
});
