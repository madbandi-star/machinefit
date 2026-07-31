import { useEffect, useMemo } from 'react';
import { isRouteErrorResponse, useRouteError } from 'react-router-dom';
import { AppUpdateScreen } from '@/components/feedback/AppUpdateScreen/AppUpdateScreen';
import {
  isChunkLoadError,
  recoverFromChunkError,
  shouldShowUpdateScreen,
} from '@/utils/chunkLoadRecovery';

/**
 * Replaces React Router's default "Unexpected Application Error" screen.
 * Never exposes stack traces or ChunkLoadError text to users.
 */
export function RouterErrorElement() {
  const error = useRouteError();
  const normalized = useMemo(() => normalizeRouteError(error), [error]);
  const isChunk = isChunkLoadError(normalized) || shouldShowUpdateScreen();

  useEffect(() => {
    if (!isChunk) return;
    void recoverFromChunkError(normalized, 'errorElement');
  }, [isChunk, normalized]);

  return <AppUpdateScreen autoRetry={isChunk} />;
}

function normalizeRouteError(error: unknown): unknown {
  if (isRouteErrorResponse(error)) {
    return new Error(`${error.status} ${error.statusText}`);
  }
  return error;
}
