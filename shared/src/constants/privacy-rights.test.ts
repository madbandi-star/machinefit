import assert from 'node:assert/strict';
import {
  computePrivacyRightsDueAt,
  privacyRightsDueState,
  PRIVACY_RIGHTS_DUE_DAYS,
} from './privacy-rights.js';

const from = new Date('2026-08-01T00:00:00.000Z');
const due = computePrivacyRightsDueAt(from, PRIVACY_RIGHTS_DUE_DAYS);
assert.equal(due.toISOString().slice(0, 10), '2026-08-11');

assert.equal(
  privacyRightsDueState(due.toISOString(), 'received', new Date('2026-08-02T00:00:00.000Z')),
  'ok'
);
assert.equal(
  privacyRightsDueState(due.toISOString(), 'reviewing', new Date('2026-08-10T00:00:00.000Z')),
  'soon'
);
assert.equal(
  privacyRightsDueState(due.toISOString(), 'received', new Date('2026-08-12T00:00:00.000Z')),
  'overdue'
);
assert.equal(
  privacyRightsDueState(due.toISOString(), 'completed', new Date('2026-08-12T00:00:00.000Z')),
  'done'
);
assert.equal(
  privacyRightsDueState(due.toISOString(), 'cancelled', new Date('2026-08-12T00:00:00.000Z')),
  'done'
);

console.log('privacy-rights.test.ts: ok');
