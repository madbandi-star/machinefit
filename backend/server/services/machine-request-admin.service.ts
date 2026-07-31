import type {
  AdminMachineRequestListQuery,
  UpdateMachineRequestAdminInput,
} from '@machinefit/shared';
import { machineRequestAdminRepository } from '../repositories/machine-request-admin.repository.js';
import { notificationService } from './notification.service.js';
import { getPool } from '../config/database.js';
import { mockMachineRequests } from '../data/community.mock.js';

function statusLabelKo(status: string): string {
  if (status === 'reviewing' || status === 'approved') return '검토중';
  if (status === 'rejected') return '반려';
  if (status === 'added') return '등록완료';
  return '요청';
}

export const machineRequestAdminService = {
  stats() {
    return machineRequestAdminRepository.stats();
  },

  popular() {
    return machineRequestAdminRepository.popular(20);
  },

  listGroups(query: AdminMachineRequestListQuery) {
    return machineRequestAdminRepository.listGroups(query);
  },

  getGroupDetail(brandName: string, machineName: string) {
    return machineRequestAdminRepository.getGroupDetail(brandName, machineName);
  },

  async updateRequest(id: string, input: UpdateMachineRequestAdminInput) {
    const normalized = {
      ...input,
      status: input.status === 'approved' ? ('reviewing' as const) : input.status,
    };
    const result = await machineRequestAdminRepository.updateRequest(id, normalized);

    if (normalized.status === 'reviewing' || normalized.status === 'rejected' || normalized.status === 'added') {
      const userIds = await collectAffectedUserIds(id, normalized);
      const label = statusLabelKo(normalized.status);
      await Promise.all(
        userIds.map((userId) =>
          notificationService.notify(
            userId,
            'machine_request',
            {
              en: `Machine request ${normalized.status}`,
              ko: `기구 요청 ${label}`,
            },
            {
              en: normalized.adminNote ?? normalized.rejectReason ?? label,
              ko: normalized.adminNote ?? normalized.rejectReason ?? label,
            },
            { requestId: id, status: normalized.status }
          )
        )
      );
    }

    return result;
  },
};

async function collectAffectedUserIds(
  id: string,
  input: UpdateMachineRequestAdminInput
): Promise<string[]> {
  const pool = getPool();
  if (!pool) {
    if (input.applyToGroup) {
      const seed = mockMachineRequests.find((r) => r.id === id);
      if (!seed) return [];
      return [
        ...new Set(
          mockMachineRequests
            .filter(
              (r) =>
                r.brandName.trim().toLowerCase() === seed.brandName.trim().toLowerCase() &&
                r.machineName.trim().toLowerCase() === seed.machineName.trim().toLowerCase()
            )
            .map((r) => r.userId)
        ),
      ];
    }
    const one = mockMachineRequests.find((r) => r.id === id);
    return one ? [one.userId] : [];
  }

  if (input.applyToGroup && input.groupBrandName && input.groupMachineName) {
    const result = await pool.query<{ user_id: string }>(
      `SELECT DISTINCT user_id FROM machine_requests
       WHERE lower(trim(brand_name)) = lower(trim($1))
         AND lower(trim(machine_name)) = lower(trim($2))`,
      [input.groupBrandName, input.groupMachineName]
    );
    return result.rows.map((r) => r.user_id);
  }

  const result = await pool.query<{ user_id: string }>(
    `SELECT user_id FROM machine_requests WHERE id = $1`,
    [id]
  );
  return result.rows.map((r) => r.user_id);
}
