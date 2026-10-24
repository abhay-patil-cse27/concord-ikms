/**
 * Frontend Isolation & Cache Namespacing Unit Test.
 * Simulates user switching, session storage, and local storage isolation.
 */
import assert from 'node:assert';

// Mock Web Storage API
class MockStorage {
  constructor() {
    this.store = new Map();
  }
  getItem(key) {
    return this.store.get(key) || null;
  }
  setItem(key, value) {
    this.store.set(key, String(value));
  }
  removeItem(key) {
    this.store.delete(key);
  }
  clear() {
    this.store.clear();
  }
  get length() {
    return this.store.size;
  }
  key(i) {
    return Array.from(this.store.keys())[i] || null;
  }
}

globalThis.sessionStorage = new MockStorage();
globalThis.localStorage = new MockStorage();

// Import uiCache
const { uiCache } = await import('../src/utils/uiCache.js');

console.log('--- RUNNING FRONTEND CACHE ISOLATION TESTS ---');

// Test 1: User A logs in and saves a RAG conversation
uiCache.setActiveUser('user-faculty-001');
uiCache.set(uiCache.KEYS.RAG, {
  query: 'Faculty research plan',
  response: { answer: 'Faculty confidential answer' },
  activeConversationId: 'thread-faculty-999',
});

const facultyCached = uiCache.get(uiCache.KEYS.RAG);
assert.strictEqual(facultyCached.query, 'Faculty research plan');
assert.strictEqual(facultyCached.activeConversationId, 'thread-faculty-999');
console.log('✓ Test 1 Passed: User A successfully stores namespaced cache');

// Test 2: Switch to User B (Student)
uiCache.setActiveUser('user-student-002');
const studentCached = uiCache.get(uiCache.KEYS.RAG, null);
assert.strictEqual(studentCached, null, 'Student MUST NOT see Faculty cached chats');
console.log('✓ Test 2 Passed: User B cannot read User A cached data (returns null)');

// Test 3: User B stores their own query
uiCache.set(uiCache.KEYS.RAG, {
  query: 'Exam grading policy',
  response: { answer: 'Passing score is 40%' },
  activeConversationId: 'thread-student-111',
});

const studentNewCached = uiCache.get(uiCache.KEYS.RAG);
assert.strictEqual(studentNewCached.query, 'Exam grading policy');
console.log('✓ Test 3 Passed: User B writes isolated namespaced cache');

// Test 4: Switch back to User A (Faculty) -> retains their previous session
uiCache.setActiveUser('user-faculty-001');
const facultyRehydrated = uiCache.get(uiCache.KEYS.RAG);
assert.strictEqual(facultyRehydrated.query, 'Faculty research plan');
assert.strictEqual(facultyRehydrated.activeConversationId, 'thread-faculty-999');
console.log('✓ Test 4 Passed: User A session persists independently');

// Test 5: Logout flushes all caches
uiCache.clearAll();
uiCache.setActiveUser(null);
const postLogoutFaculty = uiCache.get(uiCache.KEYS.RAG, null);
assert.strictEqual(postLogoutFaculty, null);
assert.strictEqual(sessionStorage.length, 0);
assert.strictEqual(localStorage.length, 0);
console.log('✓ Test 5 Passed: clearAll purges all concord_cache_* entries completely');

console.log('--- ALL FRONTEND ISOLATION TESTS PASSED (5/5) ---');
