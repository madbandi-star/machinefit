import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AppUpdateScreen } from '@/components/feedback/AppUpdateScreen/AppUpdateScreen';
import {
  isChunkLoadError,
  recoverFromChunkError,
  shouldShowUpdateScreen,
} from '@/utils/chunkLoadRecovery';

interface Props {
  children: ReactNode;
}

interface State {
  showUpdate: boolean;
  isChunk: boolean;
}

/**
 * Catches render errors from failed lazy chunks / stale modules.
 * Never surfaces React/router technical messages to the user.
 */
export class ChunkErrorBoundary extends Component<Props, State> {
  state: State = { showUpdate: false, isChunk: false };

  static getDerivedStateFromError(error: Error): Partial<State> {
    const isChunk = isChunkLoadError(error) || shouldShowUpdateScreen();
    return { showUpdate: true, isChunk };
  }

  componentDidCatch(error: Error, _info: ErrorInfo): void {
    if (!isChunkLoadError(error)) return;
    void recoverFromChunkError(error, 'ErrorBoundary').then((result) => {
      if (result === 'show-ui') {
        this.setState({ showUpdate: true, isChunk: true });
      }
    });
  }

  render(): ReactNode {
    if (this.state.showUpdate) {
      return <AppUpdateScreen autoRetry={this.state.isChunk} />;
    }
    return this.props.children;
  }
}
