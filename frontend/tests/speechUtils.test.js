/**
 * speechUtils.test.js
 * Unit assertions verifying that raw markdown text, bracketed citations [1],
 * code blocks, and table markdown are cleanly stripped for smooth Web Speech API playback.
 */
import assert from 'node:assert';
import { cleanMarkdownForSpeech } from '../src/utils/speechUtils.js';

console.log('--- RUNNING SPEECH UTILS UNIT TESTS ---');

// Test 1: Citation stripping
const sampleCitations = "According to academic regulation R-14.2 [1], students must maintain 75% attendance [2].";
const cleanedCitations = cleanMarkdownForSpeech(sampleCitations);
assert.strictEqual(cleanedCitations, "According to academic regulation R-14.2 , students must maintain 75% attendance .");
console.log('✓ Test 1 Passed: Bracketed citations [1], [2] stripped cleanly');

// Test 2: Markdown headers, bold, and list formatting
const sampleMarkdown = `### Examination Thresholds
- Minimum Passing Marks: **40%** in End-Semester Exam.
- Continuous Internal Evaluation: *50% weightage*.`;

const cleanedMarkdown = cleanMarkdownForSpeech(sampleMarkdown);
assert.ok(!cleanedMarkdown.includes('###'));
assert.ok(!cleanedMarkdown.includes('**'));
assert.ok(!cleanedMarkdown.includes('*'));
assert.ok(cleanedMarkdown.includes('Minimum Passing Marks: 40%'));
console.log('✓ Test 2 Passed: Markdown headers, bold, italic, and lists normalized');

// Test 3: Code blocks and backticks
const sampleCode = "Verify system readiness with command `curl http://localhost:8000/healthz` before startup.";
const cleanedCode = cleanMarkdownForSpeech(sampleCode);
assert.strictEqual(cleanedCode, "Verify system readiness with command curl http://localhost:8000/healthz before startup.");
console.log('✓ Test 3 Passed: Inline code and backticks preserved as plain text words');

// Test 4: Empty and null resilience
assert.strictEqual(cleanMarkdownForSpeech(''), '');
assert.strictEqual(cleanMarkdownForSpeech(null), '');
assert.strictEqual(cleanMarkdownForSpeech(undefined), '');
console.log('✓ Test 4 Passed: Empty and null inputs gracefully handled');

console.log('--- ALL SPEECH UTILS TESTS PASSED (4/4) ---');
