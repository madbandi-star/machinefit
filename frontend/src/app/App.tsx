import { RouterProvider } from 'react-router-dom';
import { ChunkErrorBoundary } from '@/components/feedback/ChunkErrorBoundary/ChunkErrorBoundary';
import { router } from '@/routes';

export function App() {
  return (
    <ChunkErrorBoundary>
      <RouterProvider router={router} />
    </ChunkErrorBoundary>
  );
}
