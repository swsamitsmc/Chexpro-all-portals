import { marked } from 'marked';
import DOMPurify from 'dompurify';

export function renderMarkdownToHtml(markdown) {
  if (!markdown) return '';
  const raw = marked.parse(markdown, { mangle: false, headerIds: false });
  // In browser context, DOMPurify is global if using a CDN. Here we expect bundler to include it.
  const clean = typeof window !== 'undefined' && window.DOMPurify
    ? window.DOMPurify.sanitize(raw)
    : DOMPurify.sanitize(raw);
  return clean;
}



