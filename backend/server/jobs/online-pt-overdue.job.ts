import { onlinePtService } from '../services/online-pt.service.js';

let started = false;

/** Process unanswered Online PT questions past the admin deadline. */
export function startOnlinePtOverdueJob(): void {
  if (started) return;
  started = true;
  onlinePtService.startOverdueJob();
}
