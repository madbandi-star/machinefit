import { opsService } from '../services/ops.service.js';
import { isProductionOps } from '../ops/ops-runtime.js';

let started = false;

/** Periodic host sampling + retention prune + alert evaluation. */
export function startOpsSamplingJob(): void {
  if (started) return;
  started = true;

  const sampleMs = isProductionOps() ? 30_000 : 120_000;
  const pruneMs = isProductionOps() ? 6 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;

  const tick = () => {
    void opsService.sampleServerAndAlert().catch(() => undefined);
  };

  // Delay first sample slightly after boot.
  setTimeout(tick, 5_000);
  setInterval(tick, sampleMs);
  setInterval(() => {
    void opsService.pruneRetention().catch(() => undefined);
  }, pruneMs);
}
