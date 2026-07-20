/**
 * MachineFit production smoke + auth flow test
 * Run: node scripts/qa-production.mjs
 */
const API = 'https://machinefit-api.onrender.com/api/v1';
const SITE = 'https://madbandi-star.github.io/machinefit';

const results = [];

function pass(name, detail = '') {
  results.push({ name, ok: true, detail });
  console.log(`✅ ${name}${detail ? ` — ${detail}` : ''}`);
}
function fail(name, detail = '') {
  results.push({ name, ok: false, detail });
  console.log(`❌ ${name}${detail ? ` — ${detail}` : ''}`);
}

async function api(path, options = {}) {
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
  });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text.slice(0, 200) };
  }
  return { status: res.status, json };
}

// --- Public API ---
try {
  const health = await api('/health');
  if (health.status === 200 && health.json?.data?.database === 'connected') {
    pass('API health + DB', health.json.data.database);
  } else fail('API health + DB', JSON.stringify(health.json));
} catch (e) {
  fail('API health + DB', e.message);
}

try {
  const machines = await api('/machines?limit=5');
  const count = machines.json?.data?.items?.length ?? machines.json?.data?.length ?? 0;
  if (machines.status === 200 && count > 0) pass('Machine list', `${count} items`);
  else fail('Machine list', `status=${machines.status}`);
} catch (e) {
  fail('Machine list', e.message);
}

try {
  const search = await api('/machines/search?q=smith');
  const n = Array.isArray(search.json?.data) ? search.json.data.length : 0;
  if (search.status === 200) pass('Machine search', `${n} results for smith`);
  else fail('Machine search', `status=${search.status}`);
} catch (e) {
  fail('Machine search', e.message);
}

try {
  const brands = await api('/brands');
  const n = Array.isArray(brands.json?.data) ? brands.json.data.length : 0;
  if (brands.status === 200 && n > 0) pass('Brand list', `${n} brands`);
  else fail('Brand list', `status=${brands.status}`);
} catch (e) {
  fail('Brand list', e.message);
}

try {
  const gyms = await api('/gyms?limit=5');
  const n = gyms.json?.data?.items?.length ?? 0;
  if (gyms.status === 200) pass('Gym list', `${n} gyms`);
  else fail('Gym list', `status=${gyms.status}`);
} catch (e) {
  fail('Gym list', e.message);
}

try {
  const posts = await api('/community/posts?limit=5');
  if (posts.status === 200) pass('Community posts', 'OK');
  else fail('Community posts', `status=${posts.status}`);
} catch (e) {
  fail('Community posts', e.message);
}

// Smith machine muscle group (024 migration)
try {
  const smith = await api('/machines/FW_SMITH');
  const mg = smith.json?.data?.muscleGroup;
  if (smith.status === 200 && mg === 'full_body') pass('Smith FW_SMITH muscle', mg);
  else if (smith.status === 200) fail('Smith FW_SMITH muscle', `expected full_body, got ${mg}`);
  else fail('Smith FW_SMITH detail', `status=${smith.status}`);
} catch (e) {
  fail('Smith FW_SMITH detail', e.message);
}

// Free-weight machines appear for biceps/triceps muscle filters
try {
  const biceps = await api('/machines?muscleGroup=biceps&limit=50');
  const codes = (biceps.json?.data ?? []).map((m) => m.code);
  const expectedFw = ['FW_DUMBBELL', 'FW_BARBELL', 'FW_SMITH', 'FW_CABLE', 'FW_KETTLEBELL'];
  const missing = expectedFw.filter((code) => !codes.includes(code));
  if (biceps.status === 200 && missing.length === 0) {
    pass('FW machines for biceps filter', codes.filter((c) => c.startsWith('FW_')).join(','));
  } else {
    fail('FW machines for biceps filter', `missing=${missing.join(',') || 'n/a'} status=${biceps.status}`);
  }
} catch (e) {
  fail('FW machines for biceps filter', e.message);
}

// Auth validation
try {
  const badLogin = await api('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'invalid@test.com', password: 'wrong' }),
  });
  if (badLogin.status === 401 || badLogin.status === 400) pass('Auth rejects bad login', `status=${badLogin.status}`);
  else fail('Auth rejects bad login', `status=${badLogin.status}`);
} catch (e) {
  fail('Auth rejects bad login', e.message);
}

// Register validation (missing fields)
try {
  const badReg = await api('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email: 'x@y.com', password: '12345678' }),
  });
  if (badReg.status === 400) pass('Register validates required fields', '400');
  else fail('Register validates required fields', `status=${badReg.status} ${JSON.stringify(badReg.json)}`);
} catch (e) {
  fail('Register validates required fields', e.message);
}

// Protected route without token
try {
  const noAuth = await api('/users/me');
  if (noAuth.status === 401) pass('Protected /users/me requires auth', '401');
  else fail('Protected /users/me requires auth', `status=${noAuth.status}`);
} catch (e) {
  fail('Protected /users/me requires auth', e.message);
}

// Frontend reachable
try {
  const front = await fetch(SITE);
  const html = await front.text();
  if (front.status === 200 && html.includes('MachineFit')) pass('Frontend loads', SITE);
  else fail('Frontend loads', `status=${front.status}`);
} catch (e) {
  fail('Frontend loads', e.message);
}

// Summary
const failed = results.filter((r) => !r.ok);
console.log('\n--- SUMMARY ---');
console.log(`Pass: ${results.length - failed.length}/${results.length}`);
if (failed.length) {
  console.log('Failures:', failed.map((f) => f.name).join(', '));
  process.exit(1);
}
