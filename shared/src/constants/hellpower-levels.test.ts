import assert from 'node:assert/strict';
import { Role, ROLE_EMOJI } from './roles.js';
import {
  getAuthorBadgeEmoji,
  getHellpowerLevel,
  getHellpowerProgress,
} from './hellpower-levels.js';

const cases: Array<[number, number, string, string]> = [
  [0, 1, '🥚', '알'],
  [299, 1, '🥚', '알'],
  [300, 2, '🐣', '병아리'],
  [699, 2, '🐣', '병아리'],
  [700, 3, '🐥', '초보자'],
  [1200, 4, '🐤', '수습생'],
  [1799, 4, '🐤', '수습생'],
  [1800, 5, '💪', '헬린이'],
  [2500, 6, '🏋️', '수련생'],
  [6500, 9, '🛡️', '기사'],
  [8500, 10, '🐴', '기마기사'],
  [17500, 13, '🐺', '전투영웅'],
  [45000, 19, '🐘', '맹수왕'],
  [50000, 20, '🐙', '심연군주'],
  [60000, 21, '🐲', '고룡'],
  [100000, 25, '👺', '사신'],
  [120000, 26, '👾', '재앙'],
  [200000, 29, '☄️', '천벌'],
  [300000, 30, '🌈', '헬창의 신'],
];

for (const [score, level, emoji, title] of cases) {
  const info = getHellpowerLevel(score);
  assert.equal(info.level, level, `score ${score} level`);
  assert.equal(info.emoji, emoji, `score ${score} emoji`);
  assert.equal(info.title, title, `score ${score} title`);
}

assert.equal(getHellpowerLevel(17499).level, 12);
assert.equal(getHellpowerLevel(17500).level, 13);
assert.equal(getHellpowerLevel(17499).pointsToNext, 1);
assert.equal(getHellpowerLevel(300000).pointsToNext, null);

const p = getHellpowerProgress(18420);
assert.equal(p.current.level, 13);
assert.equal(p.progressInBand, 920);
assert.equal(p.bandSize, 20999 - 17500 + 1);
assert.equal(p.current.pointsToNext, 21000 - 18420);
assert.equal(p.next?.level, 14);
assert.ok(Math.abs(p.progressRatio - 920 / (20999 - 17500 + 1)) < 1e-9);

const maxP = getHellpowerProgress(300000);
assert.equal(maxP.isMaxLevel, true);
assert.equal(maxP.progressRatio, 1);
assert.equal(maxP.next, null);

assert.equal(getAuthorBadgeEmoji(Role.GUEST), '🧑‍🌾');
assert.equal(getAuthorBadgeEmoji(Role.MEMBER, 0), '🥚');
assert.equal(getAuthorBadgeEmoji(Role.MEMBER, 17500), '🐺');
assert.equal(getAuthorBadgeEmoji(Role.PREMIUM_MEMBER), '⚜️');
assert.equal(ROLE_EMOJI.premium_member, '⚜️');
assert.equal(getAuthorBadgeEmoji(Role.VIP_MEMBER), '👑');
assert.equal(getAuthorBadgeEmoji(Role.TRAINER), '🧙');
assert.equal(getAuthorBadgeEmoji(Role.OWNER), '🏰');
assert.equal(getAuthorBadgeEmoji(Role.ADMIN), '🔮');

console.log('hellpower-levels.test.ts: ok');
