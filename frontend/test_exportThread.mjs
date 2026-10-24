/**
 * test_exportThread.mjs
 * Real JavaScript unit test for exportThreadToMarkdown.
 * Run directly via Node.js: node test_exportThread.mjs
 */
import assert from 'node:assert/strict';
import { exportThreadToMarkdown } from './src/lib/exportThread.js';

console.log('Testing exportThreadToMarkdown...\n');

// 1. Case 1: Empty thread
{
  const output = exportThreadToMarkdown({
    title: 'Empty Thread Session',
    history: [],
    date: '2026-10-24 10:00:00'
  });

  assert.ok(output.includes('# Empty Thread Session'), 'Should contain thread title');
  assert.ok(output.includes('*No messages recorded in this conversation thread.*'), 'Should state empty thread');
  assert.ok(!output.includes('#### Verified Institutional Sources:'), 'Should not contain Sources header in empty thread');
  console.log('  ✓ Test 1 Passed: Empty thread correctly formatted with no sources.');
}

// 2. Case 2: Greeting only (no citations)
{
  const output = exportThreadToMarkdown({
    title: 'Greeting Session',
    date: '2026-10-24 10:05:00',
    history: [
      {
        role: 'user',
        content: 'Hello, who are you?',
        timestamp: '10:05 AM',
        citations: []
      },
      {
        role: 'assistant',
        content: 'Hello! I am CONCORD, your Institutional Knowledge Assistant for KIT. How can I help you today?',
        timestamp: '10:05 AM',
        citations: []
      }
    ]
  });

  assert.ok(output.includes('👤 User Inquiry *(10:05 AM)*'), 'Should contain user inquiry header');
  assert.ok(output.includes('Hello, who are you?'), 'Should contain user message');
  assert.ok(output.includes('🛡️ CONCORD Grounded Memory *(10:05 AM)*'), 'Should contain assistant header');
  assert.ok(output.includes('Hello! I am CONCORD'), 'Should contain assistant message');
  assert.ok(!output.includes('#### Verified Institutional Sources:'), 'Greeting-only turn must NOT have a Sources section');
  console.log('  ✓ Test 2 Passed: Greeting-only thread formatted with 0 sources sections.');
}

// 3. Case 3: Policy Q&A with 2 citations
{
  const output = exportThreadToMarkdown({
    title: 'Autonomous Exam Rules',
    date: '2026-10-24 10:10:00',
    history: [
      {
        role: 'user',
        content: 'What is the passing criteria for autonomous exam?',
        timestamp: '10:10 AM',
        citations: []
      },
      {
        role: 'assistant',
        content: 'Under Autonomous Regulations, students must secure at least 40% in ESE [1] and maintain 75% attendance [2].',
        timestamp: '10:10 AM',
        citations: [
          {
            citation_index: 1,
            document_title: 'KIT Autonomous Academic Regulations 2024',
            document_filename: 'KIT_Autonomous_Academic_Regulations_2024.pdf',
            page_number: 14,
            score: 0.0325,
            version: 'v2.0'
          },
          {
            citation_index: 2,
            document_title: 'Ordinance on Student Attendance & Eligibility',
            document_filename: 'KIT_Attendance_Ordinance.pdf',
            page_number: 3,
            score: 0.0291,
            version: 'v1.1'
          }
        ]
      }
    ]
  });

  assert.ok(output.includes('[1] and maintain 75% attendance [2]'), 'Answer text must retain [1] and [2] markers');
  assert.ok(output.includes('#### Verified Institutional Sources:'), 'Answer with citations must contain Sources header');
  assert.ok(output.includes('- **[1]** KIT Autonomous Academic Regulations 2024 [v2.0] — Page 14 (RRF Score: 0.0325)'), 'Source 1 must match citation index, title, version, page, and score');
  assert.ok(output.includes('- **[2]** Ordinance on Student Attendance & Eligibility [v1.1] — Page 3 (RRF Score: 0.0291)'), 'Source 2 must match citation index, title, version, page, and score');
  console.log('  ✓ Test 3 Passed: Policy answer with 2 citations accurately matched markers and sources list.');
}

console.log('\nAll exportThreadToMarkdown tests passed successfully!\n');
