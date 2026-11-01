/** Normalize the simple definition lists produced by catalog imports. */
const plainText = (html) => html.replace(/<[^>]*>/g, '').replace(/&nbsp;/gi, ' ').replace(/&amp;/gi, '&').replace(/&quot;/gi, '"').replace(/&#39;|&apos;/gi, "'").trim();

export function prepareProductDetails(html = '') {
  /** @type {Array<[string, string]>} */
  const rows = [];
  let description = html.replace(/<dl\b[^>]*>([\s\S]*?)<\/dl>/gi, (original, body) => {
    const pairs = [...body.matchAll(/<dt\b[^>]*>([\s\S]*?)<\/dt>\s*<dd\b[^>]*>([\s\S]*?)<\/dd>/gi)];
    // Preserve unfamiliar markup instead of dropping any product information.
    const remainder = body.replace(/<dt\b[^>]*>[\s\S]*?<\/dt>\s*<dd\b[^>]*>[\s\S]*?<\/dd>/gi, '').trim();
    if (!pairs.length || remainder || pairs.some(([, key, value]) => /<(?!br\s*\/?>)[^>]+>/i.test(key + value))) return original;
    for (const [, key, value] of pairs) rows.push([plainText(key), plainText(value.replace(/<br\s*\/?>/gi, '; '))]);
    return '';
  });
  description = description.replace(/<p>Package contents:\s*([^<]*)<\/p>/gi, (_, value) => {
    rows.push(['Package contents', plainText(value)]);
    return '';
  });
  // Imported plain-text paragraphs contain newline-separated features.
  description = description.replace(/<p>([^<]*)<\/p>/gi, (_, content) => {
    const lines = content.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    return lines.length > 1 ? lines.map((line) => `<p>${line}</p>`).join('') : `<p>${content}</p>`;
  });
  return {description, rows: rows.filter(([key, value]) => key && value)};
}
