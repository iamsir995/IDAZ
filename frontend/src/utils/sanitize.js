/**
 * Helper sanitize HTML an toàn chống Stored XSS khi sử dụng dangerouslySetInnerHTML
 * Loại bỏ các thẻ script, event handlers (onload, onerror, onclick...) và protocol javascript: nguy hại.
 */
export function sanitizeHtml(htmlString) {
  if (!htmlString || typeof htmlString !== 'string') return '';

  return htmlString
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b(?![^>]*src=["']https?:\/\/(www\.)?(youtube\.com|youtube-nocookie\.com|vimeo\.com))[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
    .replace(/on\w+\s*=\s*(['"]).*?\1/gi, '')
    .replace(/on\w+\s*=\s*[^"'\s>]+/gi, '')
    .replace(/javascript\s*:/gi, 'javascript_blocked:');
}
