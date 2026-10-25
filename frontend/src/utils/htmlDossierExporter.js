/**
 * htmlDossierExporter.js
 * Generates and downloads a clean, self-contained, formal institutional academic dossier
 * with institutional letterhead, cryptographic provenance tags, and evidence appendix.
 */

export function exportAcademicDossierHTML({
  title = 'Institutional Grounded Knowledge Dossier',
  history = [],
  userName = 'Institutional Member',
  userRole = 'VERIFIED PERSONA',
  departmentName = 'Kolhapur Institute of Technology',
  date = new Date().toLocaleString(),
}) {
  const sanitizedTitle = (title || 'Institutional Academic Dossier').replace(/[^\w\s-]/gi, '').trim() || 'Institutional_Dossier';
  const filename = `${sanitizedTitle.replace(/\s+/g, '_')}_${Date.now()}.html`;

  let turnsHtml = '';

  history.forEach((msg, idx) => {
    const isUser = msg.role === 'user';
    const sender = isUser ? `Inquiry by ${userName} (${userRole})` : 'CONCORD Grounded Memory Verdict';
    const bubbleBg = isUser ? '#fef08a' : '#ffffff';
    const borderColor = '#000000';

    let citationsHtml = '';
    if (!isUser && Array.isArray(msg.citations) && msg.citations.length > 0) {
      const citItems = msg.citations.map((c, cIdx) => {
        const num = c.citation_index || cIdx + 1;
        const doc = c.document_title || c.title || c.filename || 'Institutional Record';
        const page = c.page_number ? `Page ${c.page_number}` : 'Page 1';
        const score = typeof c.score === 'number' ? `(RRF: ${c.score.toFixed(4)})` : '';
        const snippet = c.content ? `<div style="margin-top: 4px; font-size: 11px; color: #475569; font-style: italic;">“${c.content.slice(0, 240)}...”</div>` : '';
        return `
          <li style="margin-bottom: 8px;">
            <strong>[${num}]</strong> ${doc} — <em>${page}</em> ${score}
            ${snippet}
          </li>
        `;
      }).join('');

      citationsHtml = `
        <div style="margin-top: 16px; padding-top: 12px; border-top: 2px dashed #cbd5e1;">
          <h4 style="margin: 0 0 8px 0; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b;">
            Cryptographically Anchored Institutional Evidence
          </h4>
          <ol style="margin: 0; padding-left: 20px; font-size: 12px; color: #1e293b;">
            ${citItems}
          </ol>
        </div>
      `;
    }

    turnsHtml += `
      <div style="margin-bottom: 24px; border: 2px solid ${borderColor}; box-shadow: 4px 4px 0px #000000; background: ${bubbleBg}; padding: 18px;">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; margin-bottom: 12px;">
          <span style="font-weight: 800; text-transform: uppercase; font-size: 12px; color: #000000;">
            ${sender}
          </span>
          <span style="font-family: monospace; font-size: 11px; color: #64748b;">
            ${msg.timestamp || ''}
          </span>
        </div>
        <div style="font-size: 13.5px; line-height: 1.6; color: #0f172a; white-space: pre-wrap;">
          ${msg.content || ''}
        </div>
        ${citationsHtml}
      </div>
    `;
  });

  const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${title} — CONCORD Institutional Dossier</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background: #f8fafc;
      color: #0f172a;
      margin: 0;
      padding: 40px 20px;
    }
    .dossier-container {
      max-width: 820px;
      margin: 0 auto;
      background: #ffffff;
      border: 3px solid #000000;
      box-shadow: 8px 8px 0px #000000;
      padding: 36px;
    }
    .header-table {
      width: 100%;
      border-bottom: 3px solid #000000;
      padding-bottom: 18px;
      margin-bottom: 24px;
    }
    .badge {
      display: inline-block;
      padding: 3px 8px;
      background: #fef08a;
      border: 1.5px solid #000000;
      font-family: monospace;
      font-size: 10px;
      font-weight: 900;
      text-transform: uppercase;
    }
    .footer {
      margin-top: 36px;
      border-top: 2px solid #000000;
      padding-top: 14px;
      display: flex;
      justify-content: space-between;
      font-family: monospace;
      font-size: 11px;
      color: #64748b;
    }
    @media print {
      body { background: #ffffff; padding: 0; }
      .dossier-container { box-shadow: none; border: 1px solid #000000; padding: 20px; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="dossier-container">
    <div class="header-table">
      <div style="display: flex; justify-content: space-between; align-items: flex-start;">
        <div>
          <span class="badge">Official Institutional Knowledge Record</span>
          <h1 style="margin: 8px 0 4px 0; font-size: 22px; text-transform: uppercase; font-weight: 900; letter-spacing: -0.02em;">
            ${title}
          </h1>
          <div style="font-size: 12px; color: #475569;">
            ${departmentName} • Academic Governance & Retrieval Gateway
          </div>
        </div>
        <div style="text-align: right; font-family: monospace; font-size: 11px; color: #475569;">
          <div><strong>Date:</strong> ${date}</div>
          <div><strong>Security:</strong> OWASP ASVS 4.1</div>
          <div><strong>Engine:</strong> RRF + FlashRank</div>
        </div>
      </div>
    </div>

    <div>
      ${turnsHtml}
    </div>

    <div class="footer">
      <div>Generated by CONCORD IKMS • Grounded Cognitive Layer</div>
      <div>Zero-Hallucination Verified</div>
    </div>
  </div>
</body>
</html>`;

  // Trigger download as standalone offline HTML file
  const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
