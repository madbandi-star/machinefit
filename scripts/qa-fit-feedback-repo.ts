import { preferenceRepository } from '../backend/server/repositories/preference.repository.ts';
import { machineRepository } from '../backend/server/repositories/machine.repository.ts';
import { getPool } from '../backend/server/config/database.ts';

async function main() {
  const pool = getPool();
  if (!pool) {
    console.error('no pool');
    process.exit(1);
  }

  const userRes = await pool.query<{ id: string }>(`SELECT id FROM users WHERE email=$1`, [
    'admin@machinefit.com',
  ]);
  const userId = userRes.rows[0].id;
  const machineId = await machineRepository.findIdByCode('TG_CHEST_PRESS');
  if (!machineId) throw new Error('machine missing');
  const scope = {
    gymId: 'fafa98f5-719c-4814-9357-a53d01f97a2e',
    memberId: 'c4b2a932-ec69-4466-90ca-288cd90b3dc5',
  };

  await preferenceRepository.upsert(
    userId,
    machineId,
    { customSettings: {}, activeSource: 'recommended' },
    scope
  );
  const afterBad = await preferenceRepository.setActiveSource(
    userId,
    machineId,
    'adjusted',
    scope
  );
  console.log('after setActiveSource adjusted (empty custom):', afterBad);

  const afterGood = await preferenceRepository.setActiveSource(
    userId,
    machineId,
    'recommended',
    scope
  );
  console.log('after setActiveSource recommended:', afterGood);

  await preferenceRepository.upsert(
    userId,
    machineId,
    { customSettings: { recommendedWeightKg: 42 }, activeSource: 'adjusted' },
    scope
  );
  const kept = await preferenceRepository.setActiveSource(userId, machineId, 'adjusted', scope);
  console.log('adjusted with custom:', kept);

  const okEmptyAdjusted = afterBad.activeSource === 'adjusted';
  const okGood = afterGood.activeSource === 'recommended';
  const okKept =
    kept.activeSource === 'adjusted' && kept.customSettings.recommendedWeightKg === 42;
  console.log({ okEmptyAdjusted, okGood, okKept });
  process.exit(okEmptyAdjusted && okGood && okKept ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
