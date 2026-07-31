import { isChunkLoadError } from './chunkLoadRecovery';

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

assert(isChunkLoadError(new Error('ChunkLoadError: Loading chunk 5 failed')), 'chunk name');
assert(
  isChunkLoadError(new TypeError('Failed to fetch dynamically imported module')),
  'typeerror dynamic'
);
assert(isChunkLoadError(new Error('Importing a module script failed.')), 'module script');
assert(isChunkLoadError(new Error('Loading chunk abc-def failed')), 'loading chunk');
assert(!isChunkLoadError(new Error('Network Error')), 'unrelated');
assert(!isChunkLoadError(null), 'null');

console.log('chunkLoadRecovery.test.ts: ok');
