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
  [2500, 6, '🏃', '오운완러'],
  [6500, 9, '🏋️', '쇠질 입문'],
  [8500, 10, '💦', '땀내 나는 헬창'],
  [17500, 13, '📈', '득근 중'],
  [45000, 19, '🧳', '여행 가도 쇠질'],
  [50000, 20, '🏠', '헬스장 상주자'],
  [60000, 21, '🥇', 'PR 갱신자'],
  [100000, 25, '⭐', '헬창 엘리트'],
  [120000, 26, '💎', '헬창 마스터'],
  [200000, 29, '🌌', '헬창의 경지'],
  [300000, 30, '♾️', '헬창 만렙'],
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
assert.equal(getAuthorBadgeEmoji(Role.MEMBER, 17500), '📈');
assert.equal(getAuthorBadgeEmoji(Role.PREMIUM_MEMBER), '⚜️');
assert.equal(ROLE_EMOJI.premium_member, '⚜️');
assert.equal(getAuthorBadgeEmoji(Role.VIP_MEMBER), '👑');
assert.equal(getAuthorBadgeEmoji(Role.TRAINER), '🧙');
assert.equal(getAuthorBadgeEmoji(Role.OWNER), '🏰');
assert.equal(getAuthorBadgeEmoji(Role.ADMIN), '🔮');

console.log('hellpower-levels.test.ts: ok');
