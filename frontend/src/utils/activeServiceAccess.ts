import { isActiveServiceAccessEnforced } from '@machinefit/shared';

/** Soft-launch allowlist gate (off unless VITE_ACTIVE_SERVICE_ACCESS=1). */
export function isSoftLaunchAccessEnforced(): boolean {
  return isActiveServiceAccessEnforced(
    import.meta.env.VITE_ACTIVE_SERVICE_ACCESS as string | undefined
  );
}
