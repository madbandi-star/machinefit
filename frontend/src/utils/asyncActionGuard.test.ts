/**
 * Smoke test for async action guard (run: npx vite-node src/utils/asyncActionGuard.test.ts)
 */
import { createAsyncActionGuard } from './asyncActionGuard';

async function sleep(ms: number) {
  await new Promise((r) => setTimeout(r, ms));
}

async function main() {
  const guard = createAsyncActionGuard({ failureCooldownMs: 50 });
  let calls = 0;

  const slow = async () => {
    calls += 1;
    await sleep(30);
    return 'ok';
  };

  const [a, b, c] = await Promise.all([guard.run(slow), guard.run(slow), guard.run(slow)]);
  if (calls !== 1) throw new Error(`expected 1 call, got ${calls}`);
  if (!a.started || a.value !== 'ok') throw new Error('first should start');
  if (b.started || c.started) throw new Error('duplicates should be ignored');

  const failGuard = createAsyncActionGuard({ failureCooldownMs: 80 });
  try {
    await failGuard.run(async () => {
      throw new Error('boom');
    });
  } catch {
    // expected
  }
  const duringCooldown = await failGuard.run(async () => 'nope');
  if (duringCooldown.started) throw new Error('should block during cooldown');
  await sleep(100);
  const after = await failGuard.run(async () => 'yes');
  if (!after.started || after.value !== 'yes') throw new Error('should run after cooldown');

  console.log('asyncActionGuard.test.ts PASS');
}

void main();
