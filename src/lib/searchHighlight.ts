/**
 * Build a highlighter function for the given search query.
 * - Tokenizes on spaces
 * - Ignores tokens < 2 chars
 * - Returns a function(text) -> HTML with <mark class="search-highlight"> tags
 */
export function buildHighlighter(query: string) {
  const tokens = String(query || '')
    .toLowerCase()
    .split(/\s+/)
    .map(t => t.trim())
    .filter(t => t.length >= 2);

  if (!tokens.length) {
    // No-op highlighter: just return text as-is
    return (text: string | null | undefined) => text || '';
  }

  // Escape regex special chars in tokens
  const escapeRegex = (s: string) => s.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
  const pattern = tokens.map(escapeRegex).join('|');
  const regex = new RegExp(`(${pattern})`, 'gi');

  return (text: string | null | undefined) => {
    if (!text) return '';
    // Wrap matches with <mark>
    return text.replace(regex, '<mark class="search-highlight">$1</mark>');
  };
}
