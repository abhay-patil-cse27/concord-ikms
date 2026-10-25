/**
 * speechUtils.js
 * Sanitizes markdown and citation indices into smooth, natural spoken prose
 * suitable for the Web Speech API (window.speechSynthesis).
 */

export function cleanMarkdownForSpeech(markdownText) {
  if (!markdownText || typeof markdownText !== 'string') return '';

  let text = markdownText;

  // 1. Remove bracketed numeric citations like [1], [2], [12]
  text = text.replace(/\[\d+\]/g, '');

  // 2. Remove standard markdown link syntax [text](url) -> text
  text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');

  // 3. Remove inline code snippets and code blocks
  text = text.replace(/```[\s\S]*?```/g, '');
  text = text.replace(/`([^`]+)`/g, '$1');

  // 4. Remove headings markers (### Heading -> Heading)
  text = text.replace(/^#{1,6}\s+/gm, '');

  // 5. Remove bold and italic markers (**bold** -> bold, *italic* -> italic)
  text = text.replace(/(\*\*|__)(.*?)\1/g, '$2');
  text = text.replace(/(\*|_)(.*?)\1/g, '$2');

  // 6. Remove blockquote markers (> Quote -> Quote)
  text = text.replace(/^>\s+/gm, '');

  // 7. Remove table rows and pipe delimiters
  text = text.replace(/\|[^\n]+\|/g, ' ');

  // 8. Convert bullet lists and numbered lists into readable pauses
  text = text.replace(/^[\s*-]+\s+/gm, '. ');
  text = text.replace(/^\d+\.\s+/gm, '. ');

  // 9. Normalize multiple whitespaces, tabs, and duplicate periods
  text = text.replace(/\s+/g, ' ');
  text = text.replace(/\.{2,}/g, '.');

  return text.trim();
}
