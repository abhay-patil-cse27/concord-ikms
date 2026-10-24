/**
 * exportThread.js
 * Pure utility function to convert a CONCORD Grounded Q&A conversation thread
 * into well-structured, audit-grade GitHub-Flavored Markdown.
 *
 * Grounding Guarantee:
 * Keeps [1], [2] bracket citations inline and pairs them with a formatted Sources
 * section listing document name, page number, and RRF score. Greeting-only queries
 * have no sources section.
 */

/**
 * Converts a conversation thread and its message history into Markdown.
 *
 * @param {Object} params
 * @param {string} params.title - Thread or session title
 * @param {Array<Object>} params.history - Chronological array of user/assistant message objects
 * @param {string} [params.date] - Optional ISO date string or formatted date
 * @returns {string} Clean Markdown representation of the Q&A thread
 */
export function exportThreadToMarkdown({ title, history = [], date }) {
  const sessionTitle = title || 'Autonomous Grounded Q&A Session';
  const sessionDate = date || new Date().toLocaleString();

  const lines = [
    `# ${sessionTitle}`,
    `> **Platform:** CONCORD IKMS (Kolhapur Institute of Technology)`,
    `> **Date:** ${sessionDate}`,
    `> **Grounding:** Zero Hallucination Gate (Hybrid RRF + FlashRank Re-ranking)`,
    '',
    '---',
    '',
  ];

  if (!history || history.length === 0) {
    lines.push('*No messages recorded in this conversation thread.*');
    return lines.join('\n');
  }

  // Iterate chronologically through turns
  history.forEach((msg, idx) => {
    const isUser = msg.role === 'user';
    const roleLabel = isUser ? '👤 User Inquiry' : '🛡️ CONCORD Grounded Memory';
    const timeLabel = msg.timestamp ? ` *(${msg.timestamp})*` : '';

    lines.push(`### ${roleLabel}${timeLabel}`);
    lines.push('');
    lines.push(msg.content ? msg.content.trim() : '');
    lines.push('');

    // If assistant turn has verified evidence citations, output Sources list
    if (!isUser && Array.isArray(msg.citations) && msg.citations.length > 0) {
      lines.push('#### Verified Institutional Sources:');
      msg.citations.forEach((cit, citIdx) => {
        const citationNumber = cit.citation_index || citIdx + 1;
        const docName = cit.document_title || cit.document_filename || 'Institutional Record';
        const page = cit.page_number ? `Page ${cit.page_number}` : 'Page 1';
        const score = typeof cit.score === 'number'
          ? `(RRF Score: ${cit.score.toFixed(4)})`
          : cit.score
            ? `(Score: ${cit.score})`
            : '';
        const version = cit.version ? `[${cit.version}]` : '';

        lines.push(`- **[${citationNumber}]** ${docName} ${version} — ${page} ${score}`.trim());
      });
      lines.push('');
    }

    // Horizontal separator between turns
    if (idx < history.length - 1) {
      lines.push('---');
      lines.push('');
    }
  });

  lines.push('---');
  lines.push('*Exported from CONCORD Institutional Knowledge Management System.*');

  return lines.join('\n');
}
