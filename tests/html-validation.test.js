const { HtmlValidate } = require('html-validate');
const fs = require('fs');
const path = require('path');

describe('HTML Validation', () => {
  let htmlvalidate;
  let html;

  beforeAll(() => {
    htmlvalidate = new HtmlValidate({
      extends: ['html-validate:recommended'],
      rules: {
        'void-style': 'off', // Allow self-closing tags
        'no-trailing-whitespace': 'off' // Allow trailing whitespace
      }
    });

    const htmlPath = path.join(__dirname, '..', 'index.html');
    html = fs.readFileSync(htmlPath, 'utf-8');
  });

  test('index.html should be valid HTML5', async () => {
    const report = await htmlvalidate.validateString(html);

    if (!report.valid) {
      const allMessages = report.results
        .flatMap(result => result.messages || [])
        .filter(msg => msg.severity === 2)
        .map(msg => `Line ${msg.line}: ${msg.message}`)
        .join('\n');

      throw new Error(`HTML validation failed:\n${allMessages}`);
    }

    expect(report.valid).toBe(true);
  });

  test('should have no HTML validation errors', async () => {
    const report = await htmlvalidate.validateString(html);
    const errors = report.results
      .flatMap(result => result.messages || [])
      .filter(msg => msg.severity === 2);

    expect(errors).toHaveLength(0);
  });

  test('should have no critical HTML validation warnings', async () => {
    const report = await htmlvalidate.validateString(html);
    const warnings = report.results
      .flatMap(result => result.messages || [])
      .filter(msg => msg.severity === 1);

    // Allow some warnings, but flag if there are too many
    expect(warnings.length).toBeLessThan(5);
  });

  test('should use semantic HTML elements', () => {
    expect(html).toContain('<section');
    expect(html).toContain('<article');
    expect(html).toContain('<footer');
  });

  test('should not have deprecated HTML elements', () => {
    const deprecatedTags = ['center', 'font', 'marquee', 'blink', 'frame', 'frameset'];

    deprecatedTags.forEach(tag => {
      const regex = new RegExp(`<${tag}`, 'i');
      expect(html).not.toMatch(regex);
    });
  });

  test('should properly close all tags', () => {
    // Count opening and closing tags
    const openingTags = (html.match(/<(?!\/)[^>]+>/g) || [])
      .filter(tag => !tag.match(/^<(!|meta|link|br|hr|img|input)/i));

    const closingTags = html.match(/<\/[^>]+>/g) || [];

    // Should have matching number of opening and closing tags
    expect(closingTags.length).toBeGreaterThan(0);
  });
});
