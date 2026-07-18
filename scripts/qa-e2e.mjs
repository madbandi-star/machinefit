import { chromium } from 'playwright';

const SITE = 'https://madbandi-star.github.io/machinefit';
const issues = [];

function issue(severity, area, msg) {
  issues.push({ severity, area, msg });
  console.log(`${severity === 'bug' ? '🐛' : severity === 'ux' ? '⚠️' : 'ℹ️'} [${area}] ${msg}`);
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });

try {
  // Home
  await page.goto(SITE, { waitUntil: 'networkidle', timeout: 30000 });
  const title = await page.title();
  if (!title) issue('bug', 'Home', 'Empty page title');

  // Login page hero (Phase 1 #2)
  await page.goto(`${SITE}/login`, { waitUntil: 'networkidle' });
  const heroText = await page.locator('body').innerText();
  if (!/헬스|머신|MachineFit/i.test(heroText)) {
    issue('ux', 'Login', 'Hero/marketing copy not visible on login page');
  } else {
    console.log('✅ Login page renders');
  }

  // Register page fields (Phase 2 #3)
  await page.goto(`${SITE}/register`, { waitUntil: 'networkidle' });
  const regText = await page.locator('body').innerText();
  const regChecks = [
    { label: 'age field', ok: /나이|Age/i.test(regText) },
    { label: 'workout goal', ok: /목표|Goal/i.test(regText) },
    { label: 'home gym', ok: /헬스장|Gym/i.test(regText) },
  ];
  for (const c of regChecks) {
    if (c.ok) console.log(`✅ Register: ${c.label}`);
    else issue('bug', 'Register', `Missing ${c.label} on register page`);
  }

  // Machine search (guest)
  await page.goto(`${SITE}/machines`, { waitUntil: 'networkidle' });
  const machineLinks = page.locator('a[href*="/machines/"]');
  const mc = await machineLinks.count();
  if (mc > 0) console.log(`✅ Machine search: ${mc} machine links`);
  else issue('bug', 'Machines', 'No machine cards on search page');

  // Smith machine detail + muscle picker (Phase 2 #12)
  await page.goto(`${SITE}/machines/FW_SMITH`, { waitUntil: 'networkidle' });
  const smithText = await page.locator('body').innerText();
  if (/로그인|Login/i.test(smithText)) {
    console.log('✅ Smith detail: guest sees login CTA for recommend');
  }

  // Free weight muscle picker
  await page.goto(`${SITE}/machines/FW_BENCH`, { waitUntil: 'networkidle' });
  const benchText = await page.locator('body').innerText();
  if (/부위|muscle|타겟/i.test(benchText)) {
    console.log('✅ Free weight: muscle picker visible');
  } else {
    issue('ux', 'Recommend', 'Free weight machine may missing muscle picker before recommend');
  }

  // Records requires auth
  await page.goto(`${SITE}/records`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  const recordsUrl = page.url();
  if (recordsUrl.includes('/login')) {
    console.log('✅ Records: redirects to login when guest');
  } else {
    issue('bug', 'Auth', 'Records accessible without login');
  }

  // My page share button needs auth - check login redirect
  await page.goto(`${SITE}/my-page`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  if (page.url().includes('/login')) console.log('✅ My page: auth guard works');

  // Growth analysis auth
  await page.goto(`${SITE}/growth-analysis`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  if (page.url().includes('/login')) console.log('✅ Growth analysis: auth guard works');

  // Community public
  await page.goto(`${SITE}/community`, { waitUntil: 'networkidle' });
  const commText = await page.locator('body').innerText();
  if (commText.length > 50) console.log('✅ Community hub loads');
  else issue('bug', 'Community', 'Community page empty');

  // Check console errors on home
  const consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  await page.goto(SITE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  const criticalErrors = consoleErrors.filter(
    (e) => !/favicon|404|manifest|service.?worker|Failed to load resource/i.test(e)
  );
  if (criticalErrors.length) {
    issue('bug', 'Console', criticalErrors.slice(0, 3).join(' | '));
  } else {
    console.log('✅ No critical console errors on home');
  }
} catch (err) {
  issue('bug', 'E2E', err.message);
} finally {
  await browser.close();
}

console.log('\n--- E2E ISSUES ---');
console.log(`Total: ${issues.length}`);
for (const i of issues) {
  console.log(`  [${i.severity}] ${i.area}: ${i.msg}`);
}
if (issues.filter((i) => i.severity === 'bug').length) process.exit(1);
