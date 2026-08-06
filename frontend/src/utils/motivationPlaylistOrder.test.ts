import { mergePlaylistOrder, movePlaylistIndex, pickNextIndex, pickPrevIndex } from './motivationPlaylistOrder';

function assert(cond: unknown, msg: string): void {
  if (!cond) throw new Error(msg);
}

assert(
  JSON.stringify(mergePlaylistOrder(['b', 'a'], ['a', 'b', 'c'])) === JSON.stringify(['b', 'a', 'c']),
  'merge keeps saved order and appends new'
);

assert(
  JSON.stringify(movePlaylistIndex(['a', 'b', 'c'], 2, 0)) === JSON.stringify(['c', 'a', 'b']),
  'movePlaylistIndex relocates item'
);

assert(pickNextIndex({ length: 3, current: 1, shuffle: false }) === 2, 'sequential next');
assert(pickNextIndex({ length: 3, current: 2, shuffle: false }) === null, 'end stops');
assert(pickPrevIndex({ length: 3, current: 0, shuffle: false }) === null, 'start has no prev');

const shuffled = pickNextIndex({ length: 4, current: 0, shuffle: true });
assert(typeof shuffled === 'number' && shuffled !== 0, 'shuffle avoids current when possible');

console.log('motivationPlaylistOrder.test.ts OK');
