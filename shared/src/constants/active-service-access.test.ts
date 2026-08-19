import assert from 'node:assert/strict';
import {
  ACTIVE_SERVICE_USERNAMES,
  isActiveServiceAccessEnforced,
  isActiveServiceUsername,
} from './active-service-access.js';

assert.equal(ACTIVE_SERVICE_USERNAMES.length, 4);
assert.equal(isActiveServiceUsername('핏러너1205'), true);
assert.equal(isActiveServiceUsername('제이진파크'), true);
assert.equal(isActiveServiceUsername('사레레'), true);
assert.equal(isActiveServiceUsername('짐메이트0587'), true);
assert.equal(isActiveServiceUsername('다른유저'), false);
assert.equal(isActiveServiceUsername(''), false);
assert.equal(isActiveServiceUsername(null), false);
assert.equal(isActiveServiceAccessEnforced(undefined), true);
assert.equal(isActiveServiceAccessEnforced('0'), false);
assert.equal(isActiveServiceAccessEnforced('false'), false);

console.log('active-service-access tests ok');
