import type {
  MachineTradeDetail,
  MachineTradeReport,
} from '@machinefit/shared';

export type MockTradeImageBinary = {
  mimeType: string;
  imageData: Buffer;
  thumbnailData: Buffer;
  width: number;
  height: number;
  tradeId: string;
  sortOrder: number;
};

export const mockMachineTrades: MachineTradeDetail[] = [];
export const mockMachineTradeImages = new Map<string, MockTradeImageBinary>();
export const mockMachineTradeLikes = new Set<string>();
export const mockMachineTradeReports: MachineTradeReport[] = [];
/** Soft-deleted / hidden trade ids in mock mode. */
export const mockMachineTradeHidden = new Set<string>();

export function tradeLikeKey(userId: string, tradeId: string): string {
  return `${userId}:${tradeId}`;
}
