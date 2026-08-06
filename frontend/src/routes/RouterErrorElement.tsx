import { useEffect, useMemo } from 'react';
import { isRouteErrorResponse, useRouteError } from 'react-router-dom';
import { AppUpdateScreen } from '@/components/feedback/AppUpdateScreen/AppUpdateScreen';
import { RouteCrashScreen } from '@/components/feedback/RouteCrashScreen/RouteCrashScreen';
import {
  isChunkLoadError,
  recoverFromChunkError,
  shouldShowUpdateScreen,
} from '@/utils/chunkLoadRecovery';

/**
 * Replaces React Router's default "Unexpected Application Error" screen.
 * Chunk/deploy cache misses → update recovery UI.
 * Other failures → crash screen (not the misleading "updating" page).
 */
export function RouterErrorElement() {
  const error = useRouteError();
  const normalized = useMemo(() => normalizeRouteError(error), [error]);
  const isChunk = isChunkLoadError(normalized) || shouldShowUpdateScreen();

  useEffect(() => {
    if (!isChunk) return;
    void recoverFromChunkError(normalized, 'errorElement');
  }, [isChunk, normalized]);

  if (isChunk) {
    return <AppUpdateScreen autoRetry />;
  }

  return <RouteCrashScreen />;
}

function normalizeRouteError(error: unknown): unknown {
  if (isRouteErrorResponse(error)) {
    return new Error(`${error.status} ${error.statusText}`);
  }
  return error;
}
