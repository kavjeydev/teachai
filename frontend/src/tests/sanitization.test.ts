/**
 * Test suite for input sanitization to prevent XSS attacks
 * Run with: npm test sanitization.test.ts
 */

import {
  sanitizeHTML,
  sanitizeText,
  sanitizeEmail,
  sanitizeURL,
  sanitizeFilename,
  sanitizeJSON,
  sanitizeChatId,
  sanitizeApiKey,
  sanitizeUserMessage,
  sanitizeWithLength
} from '../lib/sanitization';

// Common XSS attack payloads for testing
const XSS_PAYLOADS = [
  '<script>alert("XSS")</script>',
  '<img src="x" onerror="alert(\'XSS\')">',
  '<iframe src="javascript:alert(\'XSS\')"></iframe>',
  '<svg onload="alert(\'XSS\')"></svg>',
  '<div onclick="alert(\'XSS\')">Click me</div>',
  'javascript:alert("XSS")',
  'data:text/html,<script>alert("XSS")</script>',
  '<object data="javascript:alert(\'XSS\')"></object>',
  '<embed src="javascript:alert(\'XSS\')"></embed>',
  '<link rel="stylesheet" href="javascript:alert(\'XSS\')">',
  '<meta http-equiv="refresh" content="0;url=javascript:alert(\'XSS\')">',
  '<style>@import "javascript:alert(\'XSS\')";</style>',
  '"><script>alert("XSS")</script>',
  "';alert('XSS');//",
  '<img src=x onerror=alert("XSS")>',
  '<button onmouseover="alert(\'XSS\')">Hover me</button>',
  '<input onfocus="alert(\'XSS\')" autofocus>',
  '<select onfocus="alert(\'XSS\')" autofocus><option>test</option></select>',
  '<textarea onfocus="alert(\'XSS\')" autofocus>test</textarea>',
  '<keygen onfocus="alert(\'XSS\')" autofocus>',
  '<video><source onerror="alert(\'XSS\')">',
  '<audio src="x" onerror="alert(\'XSS\')">',
  '<details open ontoggle="alert(\'XSS\')">test</details>',
  '<marquee onstart="alert(\'XSS\')">test</marquee>',
  '<form><button formaction="javascript:alert(\'XSS\')">Submit</button></form>'
];

describe('HTML Sanitization Tests', () => {
  test('should remove script tags', () => {
    const malicious = '<script>alert("XSS")</script><p>Safe content</p>';
    const sanitized = sanitizeHTML(malicious);
    expect(sanitized).not.toContain('<script>');
    expect(sanitized).not.toContain('alert');
    expect(sanitized).toContain('<p>Safe content</p>');
  });

  test('should remove all XSS payloads', () => {
    XSS_PAYLOADS.forEach(payload => {
      const sanitized = sanitizeHTML(payload);
      expect(sanitized).not.toContain('alert');
      expect(sanitized).not.toContain('javascript:');
      expect(sanitized).not.toContain('onerror');
      expect(sanitized).not.toContain('onload');
      expect(sanitized).not.toContain('onclick');
    });
  });

  test('should preserve safe HTML', () => {
    const safeHTML = '<p><strong>Bold</strong> and <em>italic</em> text</p>';
    const sanitized = sanitizeHTML(safeHTML);
    expect(sanitized).toBe(safeHTML);
  });

  test('should remove dangerous attributes', () => {
    const malicious = '<div onclick="alert(\'XSS\')" class="safe">Content</div>';
    const sanitized = sanitizeHTML(malicious);
    expect(sanitized).not.toContain('onclick');
    expect(sanitized).toContain('class="safe"');
    expect(sanitized).toContain('Content');
  });
});

describe('Text Sanitization Tests', () => {
  test('should escape HTML entities', () => {
    const malicious = '<script>alert("XSS")</script>';
    const sanitized = sanitizeText(malicious);
    expect(sanitized).toBe('&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;');
  });

  test('should handle empty and null inputs', () => {
    expect(sanitizeText('')).toBe('');
    expect(sanitizeText(null as any)).toBe('');
    expect(sanitizeText(undefined as any)).toBe('');
  });

  test('should trim whitespace', () => {
    const input = '  hello world  ';
    const sanitized = sanitizeText(input);
    expect(sanitized).toBe('hello world');
  });
});

describe('Email Sanitization Tests', () => {
  test('should validate and sanitize valid emails', () => {
    expect(sanitizeEmail('test@example.com')).toBe('test@example.com');
    expect(sanitizeEmail('  TEST@EXAMPLE.COM  ')).toBe('test@example.com');
  });

  test('should reject invalid emails', () => {
    expect(sanitizeEmail('invalid-email')).toBe('');
    expect(sanitizeEmail('test@')).toBe('');
    expect(sanitizeEmail('@example.com')).toBe('');
    expect(sanitizeEmail('<script>alert("XSS")</script>@example.com')).toBe('');
  });
});

describe('URL Sanitization Tests', () => {
  test('should validate safe URLs', () => {
    expect(sanitizeURL('https://example.com')).toBe('https://example.com');
    expect(sanitizeURL('http://example.com/path')).toBe('http://example.com/path');
    expect(sanitizeURL('/relative/path')).toBe('/relative/path');
  });

  test('should reject dangerous URLs', () => {
    expect(sanitizeURL('javascript:alert("XSS")')).toBe('');
    expect(sanitizeURL('data:text/html,<script>alert("XSS")</script>')).toBe('');
    expect(sanitizeURL('vbscript:alert("XSS")')).toBe('');
    expect(sanitizeURL('file:///etc/passwd')).toBe('');
  });

  test('should handle URL with dangerous characters', () => {
    expect(sanitizeURL('https://example.com<script>')).toBe('');
    expect(sanitizeURL('https://example.com"onclick="alert(1)"')).toBe('');
  });
});

describe('Filename Sanitization Tests', () => {
  test('should remove dangerous characters', () => {
    expect(sanitizeFilename('test<>:"/\\|?*file.txt')).toBe('testfile.txt');
    expect(sanitizeFilename('../../../etc/passwd')).toBe('etcpasswd');
    expect(sanitizeFilename('...hidden')).toBe('hidden');
  });

  test('should limit filename length', () => {
    const longName = 'a'.repeat(300);
    const sanitized = sanitizeFilename(longName);
    expect(sanitized.length).toBeLessThanOrEqual(255);
  });
});

describe('JSON Sanitization Tests', () => {
  test('should sanitize JSON string values', () => {
    const maliciousJSON = '{"name": "<script>alert(\\"XSS\\")</script>", "age": 25}';
    const sanitized = sanitizeJSON(maliciousJSON);
    expect(sanitized?.name).not.toContain('<script>');
    expect(sanitized?.age).toBe(25);
  });

  test('should handle invalid JSON', () => {
    expect(sanitizeJSON('invalid json')).toBe(null);
    expect(sanitizeJSON('')).toBe(null);
  });

  test('should recursively sanitize nested objects', () => {
    const maliciousJSON = '{"user": {"name": "<script>alert(\\"XSS\\")</script>", "data": ["<img onerror=alert(1)>"]}}';
    const sanitized = sanitizeJSON(maliciousJSON);
    expect(sanitized?.user?.name).not.toContain('<script>');
    expect(sanitized?.user?.data[0]).not.toContain('onerror');
  });
});

describe('Chat ID Sanitization Tests', () => {
  test('should validate proper chat IDs', () => {
    expect(sanitizeChatId('abc123')).toBe('abc123');
    expect(sanitizeChatId('chat_id_123')).toBe('chat_id_123');
    expect(sanitizeChatId('valid-chat-id')).toBe('valid-chat-id');
  });

  test('should reject invalid chat IDs', () => {
    expect(sanitizeChatId('')).toBe('');
    expect(sanitizeChatId('ab')).toBe(''); // too short
    expect(sanitizeChatId('a'.repeat(100))).toBe(''); // too long
    expect(sanitizeChatId('invalid!@#$%')).toBe(''); // invalid characters
    expect(sanitizeChatId('<script>alert("XSS")</script>')).toBe('');
  });
});

describe('API Key Sanitization Tests', () => {
  test('should validate proper API keys', () => {
    expect(sanitizeApiKey('valid_api_key_123')).toBe('valid_api_key_123');
    expect(sanitizeApiKey('api-key-with-dashes')).toBe('api-key-with-dashes');
  });

  test('should reject invalid API keys', () => {
    expect(sanitizeApiKey('')).toBe('');
    expect(sanitizeApiKey('short')).toBe(''); // too short
    expect(sanitizeApiKey('invalid key with spaces')).toBe('');
    expect(sanitizeApiKey('key!@#$%')).toBe(''); // invalid characters
  });
});

describe('User Message Sanitization Tests', () => {
  test('should sanitize user messages without HTML', () => {
    const message = 'Hello <script>alert("XSS")</script> world';
    const sanitized = sanitizeUserMessage(message, false);
    expect(sanitized).not.toContain('<script>');
    expect(sanitized).toContain('Hello');
    expect(sanitized).toContain('world');
  });

  test('should sanitize user messages with limited HTML', () => {
    const message = '<p>Safe paragraph</p><script>alert("XSS")</script>';
    const sanitized = sanitizeUserMessage(message, true);
    expect(sanitized).toContain('<p>Safe paragraph</p>');
    expect(sanitized).not.toContain('<script>');
  });
});

describe('Length Validation Tests', () => {
  test('should enforce length limits', () => {
    const longString = 'a'.repeat(2000);
    expect(sanitizeWithLength(longString, 1000)).toBe('');
    expect(sanitizeWithLength('valid', 1000, 10)).toBe(''); // too short
    expect(sanitizeWithLength('valid string', 1000, 5)).toBe('valid string');
  });
});

describe('Integration Tests', () => {
  test('should handle complex XSS attempts', () => {
    const complexXSS = `
      <div>
        Normal content
        <script>
          // Complex XSS attempt
          eval(String.fromCharCode(97,108,101,114,116,40,49,41));
        </script>
        <img src="x" onerror="this.src='data:image/svg+xml;base64,'+btoa('<svg onload=alert(1)>')">
        More normal content
      </div>
    `;

    const sanitized = sanitizeHTML(complexXSS);
    expect(sanitized).not.toContain('script');
    expect(sanitized).not.toContain('onerror');
    expect(sanitized).not.toContain('eval');
    expect(sanitized).toContain('Normal content');
    expect(sanitized).toContain('More normal content');
  });

  test('should maintain functionality while preventing XSS', () => {
    const userInput = {
      message: '<p>Hello <strong>world</strong>!</p><script>alert("XSS")</script>',
      chatId: 'valid_chat_123',
      apiKey: 'valid_api_key_456'
    };

    const sanitizedMessage = sanitizeUserMessage(userInput.message, true);
    const sanitizedChatId = sanitizeChatId(userInput.chatId);
    const sanitizedApiKey = sanitizeApiKey(userInput.apiKey);

    expect(sanitizedMessage).toContain('<p>Hello <strong>world</strong>!</p>');
    expect(sanitizedMessage).not.toContain('<script>');
    expect(sanitizedChatId).toBe('valid_chat_123');
    expect(sanitizedApiKey).toBe('valid_api_key_456');
  });
});

// Performance tests
describe('Performance Tests', () => {
  test('should handle large inputs efficiently', () => {
    const largeInput = '<p>' + 'a'.repeat(10000) + '</p>';
    const start = Date.now();
    const sanitized = sanitizeHTML(largeInput);
    const end = Date.now();

    expect(end - start).toBeLessThan(100); // Should complete in under 100ms
    expect(sanitized).toContain('<p>');
    expect(sanitized.length).toBeGreaterThan(0);
  });

  test('should handle many small sanitizations efficiently', () => {
    const inputs = Array(1000).fill('<script>alert("XSS")</script>hello');
    const start = Date.now();

    inputs.forEach(input => sanitizeText(input));

    const end = Date.now();
    expect(end - start).toBeLessThan(200); // Should complete in under 200ms
  });
});

console.log('✅ All XSS sanitization tests defined. Run with Jest to execute.');

export default {
  XSS_PAYLOADS,
  testPayloads: () => {
    console.log('Testing all XSS payloads...');
    XSS_PAYLOADS.forEach((payload, index) => {
      const sanitized = sanitizeHTML(payload);
      console.log(`Payload ${index + 1}:`, payload);
      console.log(`Sanitized:`, sanitized);
      console.log(`Safe:`, !sanitized.includes('alert') && !sanitized.includes('javascript:'));
      console.log('---');
    });
  }
};
