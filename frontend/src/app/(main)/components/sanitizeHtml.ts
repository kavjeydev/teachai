import DOMPurify from "dompurify";

export function sanitizeHTML(dirty: string) {
  if (typeof window === "undefined") {
    return "";
  }
  return DOMPurify.sanitize(dirty);
}
