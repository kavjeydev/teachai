import DOMPurify from "dompurify";
import validator from "validator";

// Configure DOMPurify for stricter security
const configureDOMPurify = () => {
  if (typeof window !== "undefined") {
    // Add a hook to sanitize attributes
    DOMPurify.addHook("afterSanitizeAttributes", function (node) {
      // Remove any onclick, onload, onerror, etc. attributes
      const attributes = node.attributes;
      if (attributes) {
        for (let i = attributes.length - 1; i >= 0; i--) {
          const attr = attributes[i];
          if (attr.name.toLowerCase().startsWith("on")) {
            node.removeAttribute(attr.name);
          }
          // Also remove data attributes that could contain JavaScript
          if (
            attr.name.toLowerCase().startsWith("data-") &&
            /javascript:|data:|vbscript:|on\w+=/i.test(attr.value)
          ) {
            node.removeAttribute(attr.name);
          }
        }
      }

      // Remove dangerous href attributes
      if (node.tagName === "A") {
        const href = node.getAttribute("href");
        if (href && /^(javascript:|data:|vbscript:)/i.test(href)) {
          node.removeAttribute("href");
        }
      }

      // Ensure links open in new tab for security
      if (node.tagName === "A" && node.getAttribute("href")) {
        node.setAttribute("target", "_blank");
        node.setAttribute("rel", "noopener noreferrer");
      }
    });

    // Hook to remove dangerous CSS
    DOMPurify.addHook("uponSanitizeElement", function (node, data) {
      if (data.tagName === "style") {
        // Remove style tags completely
        node.parentNode?.removeChild(node);
      }
    });
  }
};

// Initialize DOMPurify configuration
configureDOMPurify();

/**
 * Sanitize HTML content to prevent XSS attacks
 * @param dirty - The potentially unsafe HTML content
 * @param options - DOMPurify configuration options
 * @returns Sanitized HTML string
 */
export function sanitizeHTML(
  dirty: string,
  options: DOMPurify.Config = {},
): string {
  if (typeof window === "undefined") {
    return "";
  }

  const defaultConfig: DOMPurify.Config = {
    ALLOWED_TAGS: [
      "p",
      "br",
      "strong",
      "em",
      "u",
      "i",
      "b",
      "code",
      "pre",
      "blockquote",
      "ul",
      "ol",
      "li",
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "a",
      "span",
      "div",
    ],
    ALLOWED_ATTR: ["href", "title", "class", "id", "target", "rel"],
    ALLOWED_URI_REGEXP:
      /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
    ALLOW_DATA_ATTR: false,
    ALLOW_UNKNOWN_PROTOCOLS: false,
    SANITIZE_DOM: true,
    KEEP_CONTENT: false,
    FORBID_TAGS: [
      "script",
      "object",
      "embed",
      "style",
      "link",
      "meta",
      "iframe",
      "frame",
      "frameset",
    ],
    FORBID_ATTR: [
      "onerror",
      "onload",
      "onclick",
      "onmouseover",
      "onfocus",
      "onblur",
      "onchange",
      "onsubmit",
    ],
    ...options,
  };

  return DOMPurify.sanitize(dirty, defaultConfig as any) as unknown as string;
}

/**
 * Sanitize plain text input to prevent XSS
 * @param input - The user input string
 * @returns Sanitized text string
 */
export function sanitizeText(input: string): string {
  if (!input || typeof input !== "string") {
    return "";
  }

  return validator.escape(input.trim());
}

/**
 * Validate and sanitize email addresses
 * @param email - The email string to validate
 * @returns Sanitized email or empty string if invalid
 */
export function sanitizeEmail(email: string): string {
  if (!email || typeof email !== "string") {
    return "";
  }

  const trimmed = email.trim().toLowerCase();
  return validator.isEmail(trimmed)
    ? validator.normalizeEmail(trimmed) || ""
    : "";
}

/**
 * Validate and sanitize URLs
 * @param url - The URL string to validate
 * @returns Sanitized URL or empty string if invalid
 */
export function sanitizeURL(url: string): string {
  if (!url || typeof url !== "string") {
    return "";
  }

  const trimmed = url.trim();

  // Allow relative URLs for internal navigation
  if (
    trimmed.startsWith("/") ||
    trimmed.startsWith("./") ||
    trimmed.startsWith("../")
  ) {
    // Basic validation for relative URLs
    if (!/[<>"'`\s]/.test(trimmed)) {
      return trimmed;
    }
    return "";
  }

  // Validate absolute URLs
  const isValidURL = validator.isURL(trimmed, {
    protocols: ["http", "https"],
    require_protocol: true,
    require_host: true,
    require_valid_protocol: true,
    allow_underscores: false,
    allow_trailing_dot: false,
    allow_protocol_relative_urls: false,
  });

  return isValidURL ? trimmed : "";
}

/**
 * Sanitize filename for safe file operations
 * @param filename - The filename to sanitize
 * @returns Sanitized filename
 */
export function sanitizeFilename(filename: string): string {
  if (!filename || typeof filename !== "string") {
    return "";
  }

  // Remove path traversal attempts and dangerous characters
  return filename
    .replace(/[\/\\:*?"<>|]/g, "") // Remove dangerous characters
    .replace(/\.\./g, "") // Remove path traversal
    .replace(/^\.+/, "") // Remove leading dots
    .trim()
    .substring(0, 255); // Limit length
}

/**
 * Sanitize JSON input to prevent injection
 * @param jsonString - The JSON string to validate
 * @returns Parsed and validated JSON object or null if invalid
 */
export function sanitizeJSON(jsonString: string): any {
  if (!jsonString || typeof jsonString !== "string") {
    return null;
  }

  try {
    const parsed = JSON.parse(jsonString);

    // Recursively sanitize string values in the JSON
    const sanitizeValue = (value: any): any => {
      if (typeof value === "string") {
        return sanitizeText(value);
      } else if (Array.isArray(value)) {
        return value.map(sanitizeValue);
      } else if (value && typeof value === "object") {
        const sanitized: any = {};
        for (const [key, val] of Object.entries(value)) {
          const sanitizedKey = sanitizeText(key);
          if (sanitizedKey) {
            sanitized[sanitizedKey] = sanitizeValue(val);
          }
        }
        return sanitized;
      }
      return value;
    };

    return sanitizeValue(parsed);
  } catch (error) {
    return null;
  }
}

/**
 * Validate and sanitize chat ID
 * @param chatId - The chat ID to validate
 * @returns Sanitized chat ID or empty string if invalid
 */
export function sanitizeChatId(chatId: string): string {
  if (!chatId || typeof chatId !== "string") {
    return "";
  }

  // Assuming chat IDs should be alphanumeric with specific length
  const trimmed = chatId.trim();

  // Basic validation - adjust pattern based on your chat ID format
  if (
    /^[a-zA-Z0-9_-]+$/.test(trimmed) &&
    trimmed.length >= 3 &&
    trimmed.length <= 50
  ) {
    return trimmed;
  }

  return "";
}

/**
 * Sanitize API key
 * @param apiKey - The API key to sanitize
 * @returns Sanitized API key or empty string if invalid
 */
export function sanitizeApiKey(apiKey: string): string {
  if (!apiKey || typeof apiKey !== "string") {
    return "";
  }

  const trimmed = apiKey.trim();

  // Basic validation for API key format (adjust based on your format)
  if (
    /^[a-zA-Z0-9_-]+$/.test(trimmed) &&
    trimmed.length >= 10 &&
    trimmed.length <= 100
  ) {
    return trimmed;
  }

  return "";
}

/**
 * Comprehensive input sanitization for user messages
 * @param message - The user message to sanitize
 * @param allowHTML - Whether to allow limited HTML tags
 * @returns Sanitized message
 */
export function sanitizeUserMessage(
  message: string,
  allowHTML: boolean = false,
): string {
  if (!message || typeof message !== "string") {
    return "";
  }

  if (allowHTML) {
    return sanitizeHTML(message);
  } else {
    return sanitizeText(message);
  }
}

/**
 * Validate input length and sanitize
 * @param input - The input to validate
 * @param maxLength - Maximum allowed length
 * @param minLength - Minimum required length
 * @returns Sanitized input or empty string if invalid
 */
export function sanitizeWithLength(
  input: string,
  maxLength: number = 1000,
  minLength: number = 0,
): string {
  if (!input || typeof input !== "string") {
    return "";
  }

  const sanitized = sanitizeText(input);

  if (sanitized.length < minLength || sanitized.length > maxLength) {
    return "";
  }

  return sanitized;
}

/**
 * Advanced XSS detection patterns
 */
const XSS_PATTERNS = [
  // Script tags
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  // Event handlers
  /on\w+\s*=\s*["'][^"']*["']/gi,
  // JavaScript protocols
  /javascript\s*:/gi,
  // Data URLs with scripts
  /data\s*:\s*text\/html/gi,
  // VBScript
  /vbscript\s*:/gi,
  // Expression() CSS
  /expression\s*\(/gi,
  // Meta refresh redirects
  /<meta[^>]+http-equiv\s*=\s*["']?refresh["']?[^>]*>/gi,
  // Iframe
  /<iframe\b[^>]*>/gi,
  // Object/embed tags
  /<(object|embed)\b[^>]*>/gi,
  // Style with javascript
  /<style[^>]*>[\s\S]*?<\/style>/gi,
  // Import statements in CSS
  /@import\s+[^;]+;/gi,
];

/**
 * Detect potential XSS attacks in input
 * @param input - The input to check
 * @returns True if XSS patterns are detected
 */
export function detectXSS(input: string): boolean {
  if (!input || typeof input !== "string") {
    return false;
  }

  const decoded = decodeURIComponent(input);
  const normalized = decoded.toLowerCase();

  return XSS_PATTERNS.some((pattern) => pattern.test(normalized));
}

/**
 * Sanitize and validate input with XSS detection
 * @param input - The input to sanitize
 * @param options - Sanitization options
 * @returns Sanitized input or empty string if XSS detected
 */
export function sanitizeWithXSSDetection(
  input: string,
  options: { allowHTML?: boolean; maxLength?: number } = {},
): string {
  const { allowHTML = false, maxLength = 1000 } = options;

  if (!input || typeof input !== "string") {
    return "";
  }

  // Detect XSS patterns first
  if (detectXSS(input)) {
    return "";
  }

  // Length check
  if (input.length > maxLength) {
    return "";
  }

  // Sanitize based on options
  if (allowHTML) {
    return sanitizeHTML(input);
  } else {
    return sanitizeText(input);
  }
}

/**
 * Comprehensive user input sanitization with logging
 * @param input - User input to sanitize
 * @param context - Context for logging (e.g., 'chat-message', 'api-key')
 * @param options - Sanitization options
 * @returns Sanitized input
 */
export function sanitizeUserInput(
  input: string,
  context: string = "general",
  options: { allowHTML?: boolean; maxLength?: number; minLength?: number } = {},
): string {
  const { allowHTML = false, maxLength = 1000, minLength = 0 } = options;

  if (!input || typeof input !== "string") {
    return "";
  }

  const trimmed = input.trim();

  // Length validation
  if (trimmed.length < minLength) {
    return "";
  }

  if (trimmed.length > maxLength) {
    return "";
  }

  // XSS detection
  if (detectXSS(trimmed)) {
    return "";
  }

  // Sanitize
  const sanitized = allowHTML ? sanitizeHTML(trimmed) : sanitizeText(trimmed);

  return sanitized;
}

/**
 * Create a Content Security Policy-compatible inline event handler remover
 * @param html - HTML content to clean
 * @returns HTML with inline event handlers removed
 */
export function removeInlineEventHandlers(html: string): string {
  if (!html || typeof html !== "string") {
    return "";
  }

  // Remove all on* attributes
  return html.replace(/\s+on\w+\s*=\s*["'][^"']*["']/gi, "");
}

/**
 * Sanitize CSS to prevent XSS via styles
 * @param css - CSS content to sanitize
 * @returns Sanitized CSS
 */
export function sanitizeCSS(css: string): string {
  if (!css || typeof css !== "string") {
    return "";
  }

  // Remove dangerous CSS patterns
  let sanitized = css
    .replace(/expression\s*\(/gi, "") // Remove CSS expressions
    .replace(/javascript\s*:/gi, "") // Remove javascript: URLs
    .replace(/vbscript\s*:/gi, "") // Remove vbscript: URLs
    .replace(/@import\s+[^;]+;/gi, "") // Remove @import statements
    .replace(/behavior\s*:/gi, "") // Remove IE behavior property
    .replace(/binding\s*:/gi, "") // Remove XBL binding
    .replace(/-moz-binding\s*:/gi, ""); // Remove Mozilla binding

  return sanitized;
}

// Export the old function for backward compatibility
export { sanitizeHTML as sanitizeHtml };
