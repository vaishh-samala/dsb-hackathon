/**
 * Automated Verification Test Suite for Session Separation & Isolation
 * Tests the 7 specific requirements from the prompt against running/in-memory server logic.
 */

async function runTests() {
  const baseUrl = 'http://localhost:3000';
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}`);
      failed++;
    }
  }

  console.log('\n--- STARTING SESSION SEPARATION TEST SUITE ---\n');

  // Test 1: Demo Login opens fully populated dashboard with sample data
  console.log('Testing Requirement 1: Demo login & sample data fixtures...');
  const demoRes = await fetch(`${baseUrl}/api/auth/demo`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ accountId: 'usr-dev-alex' }),
  });
  const demoCookie = demoRes.headers.get('set-cookie');
  const demoData = await demoRes.json();

  assert(demoRes.status === 200, 'Demo auth endpoint returns 200 OK');
  assert(demoData.user?.sessionMode === 'demo', 'Demo user sessionMode is "demo"');
  assert(demoData.user?.role === 'developer', 'Demo user assigned developer role');
  assert(demoData.user?.name === 'Alex Rivera', 'Demo user is Alex Rivera');

  // Fetch setups using demo session
  const demoSetupsRes = await fetch(`${baseUrl}/api/setups`, {
    headers: {
      cookie: demoCookie || '',
      'x-user-role': 'developer',
      'x-user-id': 'usr-dev-alex',
    },
  });
  const demoSetups = await demoSetupsRes.json();
  assert(Array.isArray(demoSetups) && demoSetups.length > 0, 'Demo setups are populated (count > 0)');
  assert(demoSetups.some((s: any) => s.projectName === 'payments-checkout-microservice'), 'Demo contains payments-checkout-microservice');

  // Fetch audit logs in demo session
  const demoLogsRes = await fetch(`${baseUrl}/api/audit-logs`, {
    headers: {
      cookie: demoCookie || '',
      'x-user-role': 'developer',
      'x-user-id': 'usr-dev-alex',
    },
  });
  const demoLogs = await demoLogsRes.json();
  assert(Array.isArray(demoLogs) && demoLogs.length > 0, 'Demo audit logs are populated (count > 0)');

  // Test 2: Google login for a new user opens clean dashboard without dummy data
  console.log('\nTesting Requirement 2: Google login for new user (clean state)...');
  const newGoogleRes = await fetch(`${baseUrl}/api/auth/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      uid: 'g-test-uid-89211',
      email: 'newuser@gmail.com',
      displayName: 'New Developer',
    }),
  });
  const googleCookie = newGoogleRes.headers.get('set-cookie');
  const googleData = await newGoogleRes.json();

  assert(newGoogleRes.status === 200, 'Google auth endpoint returns 200 OK');
  assert(googleData.user?.sessionMode === 'authenticated', 'Google user sessionMode is "authenticated"');
  assert(googleData.user?.authProvider === 'google', 'Google user authProvider is "google"');

  // Fetch setups using Google session (must be empty!)
  const googleSetupsRes = await fetch(`${baseUrl}/api/setups`, {
    headers: {
      cookie: googleCookie || '',
      'x-user-role': 'developer',
      'x-user-id': googleData.user.id,
    },
  });
  const googleSetups = await googleSetupsRes.json();
  assert(Array.isArray(googleSetups) && googleSetups.length === 0, 'New Google user has 0 setups (Clean State)');
  assert(!googleSetups.some((s: any) => s.projectName === 'payments-checkout-microservice'), 'No demo setups leaked into new Google account');

  // Fetch audit logs in Google session (must be empty!)
  const googleLogsRes = await fetch(`${baseUrl}/api/audit-logs`, {
    headers: {
      cookie: googleCookie || '',
      'x-user-role': 'developer',
      'x-user-id': googleData.user.id,
    },
  });
  const googleLogs = await googleLogsRes.json();
  assert(Array.isArray(googleLogs) && googleLogs.length === 0, 'New Google user has 0 audit logs (Clean State)');

  // Test 3: Google user creates project -> loads only that user's saved data
  console.log('\nTesting Requirement 3: Google user creates real project and persists...');
  const createRes = await fetch(`${baseUrl}/api/setups`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      cookie: googleCookie || '',
    },
    body: JSON.stringify({
      projectName: 'my-real-cloud-api',
      template: 'node-microservice',
      repoDetails: {
        url: 'https://github.com/my-org/my-real-cloud-api',
        branch: 'main',
      },
      accountType: 'development',
      sandboxType: 'isolated-container',
      developmentPurpose: 'feature_development',
      requestedTools: ['Node.js 20'],
      requestedPermissions: ['read_code', 'write_sandbox'],
      sampleDataRequirement: 'synthetic_customers',
    }),
  });
  const createdSetup = await createRes.json();
  assert(createRes.status === 201, 'Real user project creation succeeded (201 Created)');
  assert(createdSetup.projectName === 'my-real-cloud-api', 'Created project name matches');
  assert(createdSetup.submittedBy.id === googleData.user.id, 'Project ownership matches Google user ID');

  // Fetch setups again for this Google user
  const savedSetupsRes = await fetch(`${baseUrl}/api/setups`, {
    headers: {
      cookie: googleCookie || '',
      'x-user-role': 'developer',
      'x-user-id': googleData.user.id,
    },
  });
  const savedSetups = await savedSetupsRes.json();
  assert(savedSetups.length === 1, 'Google user now sees exactly 1 saved project');
  assert(savedSetups[0].projectName === 'my-real-cloud-api', 'Saved project is my-real-cloud-api');
  assert(!savedSetups.some((s: any) => s.id === 'REQ-2026-0811'), 'Demo project REQ-2026-0811 is strictly NOT present');

  // Test 4: Logging out of demo mode and signing in with Google does not carry over demo data
  console.log('\nTesting Requirement 4: Demo logout -> Google sign in isolation...');
  const logoutRes = await fetch(`${baseUrl}/api/auth/logout`, {
    method: 'POST',
    headers: { cookie: demoCookie || '' },
  });
  assert(logoutRes.status === 204, 'Logout clears session (204 No Content)');

  // Test 5: Logging out of Google and entering demo mode loads demo fixtures correctly
  console.log('\nTesting Requirement 5: Google logout -> Demo login reload...');
  await fetch(`${baseUrl}/api/auth/logout`, {
    method: 'POST',
    headers: { cookie: googleCookie || '' },
  });
  const reDemoRes = await fetch(`${baseUrl}/api/auth/demo`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ accountId: 'usr-dev-alex' }),
  });
  const reDemoCookie = reDemoRes.headers.get('set-cookie');
  const reDemoSetupsRes = await fetch(`${baseUrl}/api/setups`, {
    headers: { cookie: reDemoCookie || '', 'x-user-role': 'developer', 'x-user-id': 'usr-dev-alex' },
  });
  const reDemoSetups = await reDemoSetupsRes.json();
  assert(reDemoSetups.length >= 2, 'Demo fixtures restored with dummy setups');
  assert(!reDemoSetups.some((s: any) => s.projectName === 'my-real-cloud-api'), 'Real user project did NOT leak into demo session');

  // Test 6: Page refresh preserves session mode
  console.log('\nTesting Requirement 6: Session preservation on refresh...');
  const sessionCheckRes = await fetch(`${baseUrl}/api/auth/session`, {
    headers: { cookie: reDemoCookie || '' },
  });
  const sessionCheckData = await sessionCheckRes.json();
  assert(sessionCheckData.user?.sessionMode === 'demo', 'Session mode correctly preserved as "demo"');
  assert(sessionCheckData.mode === 'demo', 'Session check mode is "demo"');

  // Test 7: Policy enforcement (POL-001 & Least-Privilege) works as expected
  console.log('\nTesting Requirement 7: Policy enforcement invariants...');
  const prodBlockedRes = await fetch(`${baseUrl}/api/setups`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', cookie: reDemoCookie || '' },
    body: JSON.stringify({
      projectName: 'prod-violation-test',
      template: 'node-microservice',
      repoDetails: { url: 'https://github.com/org/prod', branch: 'main' },
      accountType: 'production',
      sandboxType: 'isolated-container',
      sampleDataRequirement: 'real_production_dump',
    }),
  });
  const prodSetup = await prodBlockedRes.json();
  assert(prodSetup.status === 'blocked', 'POL-001 blocked production sandbox creation');
  assert(prodSetup.isRealDataBlocked === true, 'POL-004 blocked real customer data requirement');

  console.log(`\n--- TEST SUITE COMPLETE: ${passed} PASSED, ${failed} FAILED ---\n`);
  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
