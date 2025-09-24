import {
  sanitizeHTML,
  sanitizeText,
  sanitizeUserMessage,
  detectXSS,
  sanitizeWithXSSDetection,
  sanitizeUserInput,
  removeInlineEventHandlers,
  sanitizeCSS
} from '../lib/sanitization';

describe('XSS Protection Tests', () => {

  describe('XSS Detection', () => {
    test('should detect script tags', () => {
      const maliciousInput = '<script>alert("xss")</script>';
      expect(detectXSS(maliciousInput)).toBe(true);
    });

    test('should detect event handlers', () => {
      const maliciousInput = '<img src="x" onerror="alert(1)">';
      expect(detectXSS(maliciousInput)).toBe(true);
    });

    test('should detect javascript: URLs', () => {
      const maliciousInput = '<a href="javascript:alert(1)">click</a>';
      expect(detectXSS(maliciousInput)).toBe(true);
    });

    test('should detect data: URLs with HTML', () => {
      const maliciousInput = '<iframe src="data:text/html,<script>alert(1)</script>"></iframe>';
      expect(detectXSS(maliciousInput)).toBe(true);
    });

    test('should detect CSS expressions', () => {
      const maliciousInput = '<div style="background:expression(alert(1))">test</div>';
      expect(detectXSS(maliciousInput)).toBe(true);
    });

    test('should not flag safe content', () => {
      const safeInput = 'Hello world! This is a <b>normal</b> message.';
      expect(detectXSS(safeInput)).toBe(false);
    });
  });

  describe('HTML Sanitization', () => {
    test('should remove script tags', () => {
      const input = '<p>Hello</p><script>alert("xss")</script>';
      const result = sanitizeHTML(input);
      expect(result).not.toContain('<script>');
      expect(result).toContain('Hello');
    });

    test('should remove event handlers', () => {
      const input = '<div onclick="alert(1)">Click me</div>';
      const result = sanitizeHTML(input);
      expect(result).not.toContain('onclick');
      expect(result).toContain('Click me');
    });

    test('should sanitize href attributes', () => {
      const input = '<a href="javascript:alert(1)">Link</a>';
      const result = sanitizeHTML(input);
      expect(result).not.toContain('javascript:');
    });

    test('should allow safe HTML', () => {
      const input = '<p><strong>Bold text</strong> and <em>italic</em></p>';
      const result = sanitizeHTML(input);
      expect(result).toContain('<strong>');
      expect(result).toContain('<em>');
    });
  });

  describe('Text Sanitization', () => {
    test('should escape HTML characters', () => {
      const input = '<script>alert("xss")</script>';
      const result = sanitizeText(input);
      expect(result).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
    });

    test('should handle empty input', () => {
      expect(sanitizeText('')).toBe('');
      expect(sanitizeText(null as any)).toBe('');
      expect(sanitizeText(undefined as any)).toBe('');
    });
  });

  describe('User Message Sanitization', () => {
    test('should sanitize without HTML by default', () => {
      const input = '<script>alert("xss")</script>Hello';
      const result = sanitizeUserMessage(input);
      expect(result).not.toContain('<script>');
      expect(result).toContain('Hello');
    });

    test('should allow HTML when specified', () => {
      const input = '<p>Hello <strong>world</strong></p>';
      const result = sanitizeUserMessage(input, true);
      expect(result).toContain('<p>');
      expect(result).toContain('<strong>');
    });
  });

  describe('Advanced XSS Protection', () => {
    test('should reject input with XSS patterns', () => {
      const maliciousInput = '<script>alert("xss")</script>';
      const result = sanitizeWithXSSDetection(maliciousInput);
      expect(result).toBe('');
    });

    test('should handle URL encoding', () => {
      const maliciousInput = '%3Cscript%3Ealert(1)%3C/script%3E';
      const result = sanitizeWithXSSDetection(maliciousInput);
      expect(result).toBe('');
    });

    test('should enforce length limits', () => {
      const longInput = 'a'.repeat(2000);
      const result = sanitizeWithXSSDetection(longInput, { maxLength: 100 });
      expect(result).toBe('');
    });
  });

  describe('User Input Sanitization with Context', () => {
    test('should sanitize with context logging', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      const maliciousInput = '<script>alert(1)</script>';
      const result = sanitizeUserInput(maliciousInput, 'test-context');

      expect(result).toBe('');
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('XSS attempt detected in test-context')
      );

      consoleSpy.mockRestore();
    });

    test('should enforce minimum length', () => {
      const shortInput = 'hi';
      const result = sanitizeUserInput(shortInput, 'test', { minLength: 5 });
      expect(result).toBe('');
    });
  });

  describe('CSS Sanitization', () => {
    test('should remove CSS expressions', () => {
      const maliciousCSS = 'background: expression(alert(1));';
      const result = sanitizeCSS(maliciousCSS);
      expect(result).not.toContain('expression(');
    });

    test('should remove javascript: URLs in CSS', () => {
      const maliciousCSS = 'background: url(javascript:alert(1));';
      const result = sanitizeCSS(maliciousCSS);
      expect(result).not.toContain('javascript:');
    });

    test('should remove @import statements', () => {
      const maliciousCSS = '@import url("evil.css");';
      const result = sanitizeCSS(maliciousCSS);
      expect(result).not.toContain('@import');
    });
  });

  describe('Inline Event Handler Removal', () => {
    test('should remove all event handlers', () => {
      const input = '<div onclick="alert(1)" onmouseover="alert(2)">Test</div>';
      const result = removeInlineEventHandlers(input);
      expect(result).not.toContain('onclick');
      expect(result).not.toContain('onmouseover');
      expect(result).toContain('Test');
    });
  });

  describe('Edge Cases', () => {
    test('should handle mixed case XSS attempts', () => {
      const input = '<ScRiPt>alert(1)</ScRiPt>';
      expect(detectXSS(input)).toBe(true);
    });

    test('should handle fragmented XSS attempts', () => {
      const input = '<img src=x onerror=alert(1)>';
      expect(detectXSS(input)).toBe(true);
    });

    test('should handle encoded XSS attempts', () => {
      const input = '&lt;script&gt;alert(1)&lt;/script&gt;';
      const result = sanitizeText(input);
      expect(result).not.toContain('alert');
    });
  });

  describe('Performance', () => {
    test('should handle large inputs efficiently', () => {
      const largeInput = 'safe text '.repeat(10000);
      const start = performance.now();
      sanitizeUserInput(largeInput, 'performance-test', { maxLength: 100000 });
      const end = performance.now();

      // Should complete within reasonable time (< 100ms)
      expect(end - start).toBeLessThan(100);
    });
  });
});

// Integration test for common XSS attack vectors
describe('Common XSS Attack Vectors', () => {
  const commonAttacks = [
    '<script>alert("XSS")</script>',
    '"><script>alert("XSS")</script>',
    '<img src=x onerror=alert("XSS")>',
    '<svg onload=alert("XSS")>',
    '<iframe src="javascript:alert(\'XSS\')">',
    '<body onload=alert("XSS")>',
    '<div style="background:expression(alert(\'XSS\'))">',
    'javascript:alert("XSS")',
    'data:text/html,<script>alert("XSS")</script>',
    '<meta http-equiv="refresh" content="0;url=javascript:alert(\'XSS\')">',
    '<object data="javascript:alert(\'XSS\')">',
    '<embed src="javascript:alert(\'XSS\')">',
  ];

  test.each(commonAttacks)('should block XSS attack: %s', (attack) => {
    expect(detectXSS(attack)).toBe(true);
    const sanitized = sanitizeWithXSSDetection(attack);
    expect(sanitized).toBe('');
  });
});
