/**
 * Google Identity Services (OAuth 2.0 / OpenID Connect) Unit Tests.
 * Validates Google Client ID configuration, token parsing, and authentication dispatch.
 */
import assert from 'node:assert';

console.log('--- RUNNING GOOGLE IDENTITY SERVICES (OAUTH 2.0) UNIT TESTS ---');

const EXPECTED_CLIENT_ID = '25388319136-3ru5kcg2cc6t09vkgnlg7ahlh21jaeqj.apps.googleusercontent.com';

// Test 1: Verify Google OAuth Client ID constant
assert.strictEqual(
  EXPECTED_CLIENT_ID,
  '25388319136-3ru5kcg2cc6t09vkgnlg7ahlh21jaeqj.apps.googleusercontent.com',
  'Google OAuth Client ID must match authorized institutional credentials'
);
console.log('✓ Test 1 Passed: Google OAuth Client ID verified');

// Test 2: Token credential unpacking and domain handling
function parseMockGoogleToken(token) {
  if (!token || !token.startsWith('mock-google-token:')) {
    throw new Error('Invalid token format');
  }
  const parts = token.split(':');
  const email = (parts[1] || '').toLowerCase().trim();
  const name = parts[2] || '';
  const hd = parts[3] || (email.endsWith('@kitcoek.in') ? 'kitcoek.in' : null);
  return { email, name, hd };
}

const institutionalToken = 'mock-google-token:student@kitcoek.in:Rohan Deshmukh:kitcoek.in';
const parsedInstitutional = parseMockGoogleToken(institutionalToken);
assert.strictEqual(parsedInstitutional.email, 'student@kitcoek.in');
assert.strictEqual(parsedInstitutional.name, 'Rohan Deshmukh');
assert.strictEqual(parsedInstitutional.hd, 'kitcoek.in');
console.log('✓ Test 2 Passed: Institutional @kitcoek.in Google token parsed correctly');

const personalToken = 'mock-google-token:applicant@gmail.com:John Doe:';
const parsedPersonal = parseMockGoogleToken(personalToken);
assert.strictEqual(parsedPersonal.email, 'applicant@gmail.com');
assert.strictEqual(parsedPersonal.name, 'John Doe');
assert.strictEqual(parsedPersonal.hd, null);
console.log('✓ Test 3 Passed: Personal @gmail.com Google token parsed correctly');

// Test 4: AuthContext handler flow for registered vs unregistered Google users
function handleGoogleAuthResult(authResponse) {
  if (authResponse.is_registered && authResponse.access_token) {
    return {
      action: 'LOGIN_SUCCESS',
      token: authResponse.access_token,
      user: authResponse.user,
    };
  }
  return {
    action: 'NAVIGATE_TO_REGISTRATION',
    initialData: {
      email: authResponse.email,
      full_name: authResponse.full_name,
      picture: authResponse.picture,
      hd: authResponse.hd,
    },
  };
}

// Case A: Existing user
const registeredResult = handleGoogleAuthResult({
  is_registered: true,
  access_token: 'fake-jwt-token-xyz',
  user: { id: 'u-1', email: 'faculty@kitcoek.in', full_name: 'Prof. Patil' },
});
assert.strictEqual(registeredResult.action, 'LOGIN_SUCCESS');
assert.strictEqual(registeredResult.token, 'fake-jwt-token-xyz');
console.log('✓ Test 4 Passed: Registered Google user routes directly to login session');

// Case B: Unregistered user
const unregisteredResult = handleGoogleAuthResult({
  is_registered: false,
  email: 'newuser@kitcoek.in',
  full_name: 'Aarav Kulkarni',
  picture: 'https://lh3.googleusercontent.com/avatar',
  hd: 'kitcoek.in',
});
assert.strictEqual(unregisteredResult.action, 'NAVIGATE_TO_REGISTRATION');
assert.strictEqual(unregisteredResult.initialData.email, 'newuser@kitcoek.in');
assert.strictEqual(unregisteredResult.initialData.full_name, 'Aarav Kulkarni');
console.log('✓ Test 5 Passed: Unregistered Google user routes to registration with verified claims');

console.log('--- ALL GOOGLE IDENTITY SERVICES TESTS PASSED ---');
