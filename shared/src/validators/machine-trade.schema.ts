import { z } from 'zod';
import {
  TRADE_CONDITIONS,
  TRADE_REPORT_REASONS,
  TRADE_STATUSES,
  TRADE_TYPES,
} from '../types/machine-trade.types.js';

export const createMachineTradeSchema = z.object({
  tradeType: z.enum(TRADE_TYPES),
  machineId: z.string().uuid(),
  price: z.number().int().min(0).max(1_000_000_000),
  condition: z.enum(TRADE_CONDITIONS).optional().nullable(),
  quantity: z.number().int().min(1).max(999).optional().default(1),
  regionLabel: z.string().trim().min(1).max(200),
  countryCode: z.string().trim().max(8).optional().nullable(),
  stateId: z.string().uuid().optional().nullable(),
  cityId: z.string().uuid().optional().nullable(),
  districtId: z.string().uuid().optional().nullable(),
  description: z.string().trim().max(5000).optional().default(''),
});

export const updateMachineTradeSchema = z.object({
  price: z.number().int().min(0).max(1_000_000_000).optional(),
  condition: z.enum(TRADE_CONDITIONS).optional().nullable(),
  quantity: z.number().int().min(1).max(999).optional(),
  regionLabel: z.string().trim().min(1).max(200).optional(),
  countryCode: z.string().trim().max(8).optional().nullable(),
  stateId: z.string().uuid().optional().nullable(),
  cityId: z.string().uuid().optional().nullable(),
  districtId: z.string().uuid().optional().nullable(),
  description: z.string().trim().max(5000).optional(),
  status: z.enum(TRADE_STATUSES).optional(),
});

export const listMachineTradesSchema = z.object({
  tradeType: z.enum(TRADE_TYPES).optional(),
  machineId: z.string().uuid().optional(),
  machineCode: z.string().trim().min(1).max(80).optional(),
  status: z.enum(TRADE_STATUSES).optional(),
  sellerId: z.string().uuid().optional(),
  q: z.string().trim().max(100).optional(),
  includeExpired: z.coerce.boolean().optional().default(false),
  likedOnly: z.coerce.boolean().optional().default(false),
  mineOnly: z.coerce.boolean().optional().default(false),
  sort: z.enum(['newest', 'popular', 'price_asc', 'price_desc']).optional().default('newest'),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(50).optional().default(20),
});

export const createTradeReportSchema = z.object({
  reason: z.enum(TRADE_REPORT_REASONS),
  description: z.string().trim().max(1000).optional(),
});

export const resolveTradeReportSchema = z.object({
  status: z.enum(['resolved', 'dismissed']),
});

export type CreateMachineTradeInput = z.infer<typeof createMachineTradeSchema>;
export type UpdateMachineTradeInput = z.infer<typeof updateMachineTradeSchema>;
export type ListMachineTradesInput = z.infer<typeof listMachineTradesSchema>;
export type CreateTradeReportInput = z.infer<typeof createTradeReportSchema>;
export type ResolveTradeReportInput = z.infer<typeof resolveTradeReportSchema>;
