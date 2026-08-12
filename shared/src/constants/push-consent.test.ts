import assert from 'node:assert/strict';
import {
  assertServiceKindContentAllowed,
  detectMarketingContent,
  getPushConsentCategoryForKind,
  getPushConsentCategoryForNotificationType,
} from './push-consent.js';

assert.equal(getPushConsentCategoryForKind('event'), 'marketing');
assert.equal(getPushConsentCategoryForKind('general'), 'marketing');
assert.equal(getPushConsentCategoryForKind('notice'), 'service');
assert.equal(getPushConsentCategoryForKind('workout'), 'service');
assert.equal(getPushConsentCategoryForKind('schedule'), 'service');
assert.equal(getPushConsentCategoryForKind('trade'), 'service');

assert.equal(getPushConsentCategoryForNotificationType('push_event'), 'marketing');
assert.equal(getPushConsentCategoryForNotificationType('push_schedule'), 'service');
assert.equal(getPushConsentCategoryForNotificationType('friend_request'), null);

assert.equal(detectMarketingContent('공지', '서버 점검 안내입니다'), false);
assert.equal(detectMarketingContent('특가', '이번 달 프리미엄 할인!'), true);
assert.equal(detectMarketingContent('Invite', 'Refer a friend for a free month'), true);
assert.equal(detectMarketingContent('Event', '새로운 이벤트가 시작되었습니다!'), true);

assert.equal(
  assertServiceKindContentAllowed('notice', '시스템 점검', '내일 02시 점검').ok,
  true
);
assert.equal(
  assertServiceKindContentAllowed('notice', '혜택', '지금 구독하면 특별 혜택!').ok,
  false
);
assert.equal(
  assertServiceKindContentAllowed('event', '혜택', '지금 구독하면 특별 혜택!').ok,
  true
);

console.log('push-consent.test.ts: ok');
