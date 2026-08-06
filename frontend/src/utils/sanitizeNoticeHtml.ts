import DOMPurify from 'dompurify';

const ALLOWED_TAGS = [
  'p',
  'br',
  'hr',
  'strong',
  'b',
  'em',
  'i',
  'u',
  's',
  'h1',
  'h2',
  'h3',
  'h4',
  'ul',
  'ol',
  'li',
  'a',
  'img',
  'blockquote',
  'pre',
  'code',
  'table',
  'thead',
  'tbody',
  'tr',
  'th',
  'td',
  'span',
  'div',
];

/** Client-side HTML sanitize before dangerouslySetInnerHTML. */
export function sanitizeNoticeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty ?? '', {
    ALLOWED_TAGS,
    ALLOWED_ATTR: [
      'href',
      'target',
      'rel',
      'src',
      'alt',
      'title',
      'width',
      'height',
      'colspan',
      'rowspan',
      'class',
    ],
    ALLOW_DATA_ATTR: false,
  });
}
