import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AppUpdateScreen } from '@/components/feedback/AppUpdateScreen/AppUpdateScreen';
import { RouteCrashScreen } from '@/components/feedback/RouteCrashScreen/RouteCrashScreen';
import {
  isChunkLoadError,
  recoverFromChunkError,
  shouldShowUpdateScreen,
} from '@/utils/chunkLoadRecovery';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  isChunk: boolean;
}

/**
 * Catches render errors from failed lazy chunks / stale modules.
 * Never surfaces React/router technical messages to the user.
 */
export class ChunkErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, isChunk: false };

  static getDerivedStateFromError(error: Error): Partial<State> {
    const isChunk = isChunkLoadError(error) || shouldShowUpdateScreen();
    return { hasError: true, isChunk };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    void import('@/utils/opsTelemetry').then(({ trackOpsError }) => {
      trackOpsError({
        title: isChunkLoadError(error) ? 'ChunkLoadError' : 'ReactErrorBoundary',
        message: error.message,
        stack: error.stack,
        severity: 'critical',
        source: 'react',
        meta: { componentStack: info.componentStack?.slice(0, 2000) },
      });
    });
    void import('@/app/sentry').then(({ captureFrontendException }) =>
      captureFrontendException(error, {
        source: 'react-error-boundary',
        componentStack: info.componentStack?.slice(0, 2000),
      })
    );
    if (!isChunkLoadError(error)) return;
    void recoverFromChunkError(error, 'ErrorBoundary').then((result) => {
      if (result === 'show-ui') {
        this.setState({ hasError: true, isChunk: true });
      }
    });
  }

  render(): ReactNode {
    if (!this.state.hasError) return this.props.children;
    if (this.state.isChunk) {
      return <AppUpdateScreen autoRetry />;
    }
    return <RouteCrashScreen />;
  }
}
