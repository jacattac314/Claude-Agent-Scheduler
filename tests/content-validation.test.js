const fs = require('fs');
const cheerio = require('cheerio');
const path = require('path');

describe('Content Validation', () => {
  let $;
  let html;

  beforeAll(() => {
    const htmlPath = path.join(__dirname, '..', 'index.html');
    html = fs.readFileSync(htmlPath, 'utf-8');
    $ = cheerio.load(html);
  });

  describe('Placeholder Content', () => {
    test('should not contain [Your Name] placeholder', () => {
      const content = $('body').text();
      expect(content).not.toContain('[Your Name]');
    });

    test('should not contain [Company Name] placeholders', () => {
      const content = $('body').text();
      expect(content).not.toContain('[Company Name]');
    });

    test('should not contain placeholder email addresses', () => {
      const emailLinks = $('a[href^="mailto:"]');
      emailLinks.each((i, elem) => {
        const href = $(elem).attr('href');
        expect(href).not.toContain('you@email.com');
        expect(href).not.toContain('example.com');
      });
    });

    test('should not contain placeholder social media URLs', () => {
      const socialLinks = $('a[href*="linkedin"], a[href*="github"]');
      socialLinks.each((i, elem) => {
        const href = $(elem).attr('href');
        expect(href).not.toContain('yourprofile');
        expect(href).not.toContain('yourusername');
      });
    });
  });

  describe('Link Validation', () => {
    test('all anchor tags should have href attribute', () => {
      $('a').each((i, elem) => {
        const href = $(elem).attr('href');
        expect(href).toBeDefined();
        expect(href).not.toBe('');
      });
    });

    test('all external links should use https or mailto', () => {
      $('a').each((i, elem) => {
        const href = $(elem).attr('href');
        if (!href.startsWith('#')) {
          expect(href).toMatch(/^(https:\/\/|mailto:)/);
        }
      });
    });

    test('all internal links should point to valid anchors', () => {
      const internalLinks = $('a[href^="#"]');
      const anchorIds = [];

      $('[id]').each((i, elem) => {
        anchorIds.push('#' + $(elem).attr('id'));
      });

      internalLinks.each((i, elem) => {
        const href = $(elem).attr('href');
        if (href !== '#') { // Skip "back to top" generic link
          expect(anchorIds).toContain(href);
        }
      });
    });

    test('all links should have descriptive text', () => {
      $('a').each((i, elem) => {
        const text = $(elem).text().trim();
        expect(text.length).toBeGreaterThan(0);
        expect(text.toLowerCase()).not.toBe('click here');
        expect(text.toLowerCase()).not.toBe('here');
      });
    });
  });

  describe('Content Structure', () => {
    test('should have exactly one h1 element', () => {
      const h1Count = $('h1').length;
      expect(h1Count).toBe(1);
    });

    test('should have proper heading hierarchy', () => {
      const headings = $('h1, h2, h3, h4, h5, h6');
      let previousLevel = 0;

      headings.each((i, elem) => {
        const currentLevel = parseInt(elem.name.substring(1));

        // First heading should be h1
        if (i === 0) {
          expect(currentLevel).toBe(1);
        } else {
          // Headings shouldn't skip levels (e.g., h1 -> h3)
          expect(currentLevel).toBeLessThanOrEqual(previousLevel + 1);
        }

        previousLevel = currentLevel;
      });
    });

    test('should have all four case studies', () => {
      const caseStudies = $('.case-study');
      expect(caseStudies.length).toBe(4);
    });

    test('each case study should have required sections', () => {
      $('.case-study').each((i, article) => {
        const $article = $(article);

        // Should have header
        expect($article.find('.case-study-header').length).toBe(1);

        // Should have meta information
        expect($article.find('.meta').length).toBe(1);

        // Should have outcomes
        expect($article.find('.section h3:contains("Outcomes")').length).toBe(1);
      });
    });
  });

  describe('HTML Attributes', () => {
    test('html tag should have lang attribute', () => {
      const lang = $('html').attr('lang');
      expect(lang).toBeDefined();
      expect(lang).toBe('en');
    });

    test('should have viewport meta tag', () => {
      const viewport = $('meta[name="viewport"]');
      expect(viewport.length).toBe(1);
      expect(viewport.attr('content')).toContain('width=device-width');
    });

    test('should have charset meta tag', () => {
      const charset = $('meta[charset]');
      expect(charset.length).toBe(1);
      expect(charset.attr('charset')).toBe('UTF-8');
    });

    test('should have a title tag', () => {
      const title = $('title');
      expect(title.length).toBe(1);
      expect(title.text().length).toBeGreaterThan(0);
    });
  });

  describe('CSS Validation', () => {
    test('style tag should be present', () => {
      const styleTags = $('style');
      expect(styleTags.length).toBeGreaterThan(0);
    });

    test('responsive media query should be present', () => {
      const styleContent = $('style').html();
      expect(styleContent).toContain('@media');
      expect(styleContent).toContain('max-width');
    });
  });

  describe('Professional Content Quality', () => {
    test('should not have lorem ipsum placeholder text', () => {
      const content = $('body').text().toLowerCase();
      expect(content).not.toContain('lorem ipsum');
      expect(content).not.toContain('dolor sit amet');
    });

    test('case studies should have quantifiable outcomes', () => {
      $('.case-study').each((i, article) => {
        const $article = $(article);
        const outcomesText = $article.find('.outcomes-grid').text();

        // Should contain at least one number or percentage
        expect(outcomesText).toMatch(/\d+/);
      });
    });

    test('contact section should be present in hero', () => {
      const contactSection = $('.hero .contact');
      expect(contactSection.length).toBe(1);

      const contactLinks = contactSection.find('a');
      expect(contactLinks.length).toBeGreaterThan(0);
    });
  });
});
