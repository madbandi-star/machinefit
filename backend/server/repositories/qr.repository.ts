import { getPool } from '../config/database.js';
import { MOCK_MACHINES } from '../data/mock.js';

export interface QrResolveResult {
  machineCode: string;
  deepLinkPath: string;
  machineId: string;
}

export const qrRepository = {
  async resolveByCode(qrCode: string): Promise<QrResolveResult | null> {
    const pool = getPool();
    if (!pool) {
      const normalized = qrCode.trim().toUpperCase();
      const machineCode = normalized.startsWith('MF-') ? normalized.slice(3) : normalized;
      const machine = MOCK_MACHINES.find((m) => m.code === machineCode);
      if (!machine) return null;
      return {
        machineId: machine.id,
        machineCode: machine.code,
        deepLinkPath: `/machines/${machine.code}`,
      };
    }

    const result = await pool.query<{
      machine_id: string;
      machine_code: string;
      deep_link_path: string;
    }>(
      `SELECT m.id AS machine_id, m.code AS machine_code, qr.deep_link_path
       FROM machine_qr_codes qr
       JOIN machines m ON m.id = qr.machine_id
       WHERE qr.qr_code = $1 AND qr.is_active = true AND m.is_active = true`,
      [qrCode.trim()]
    );

    const row = result.rows[0];
    if (!row) return null;

    return {
      machineId: row.machine_id,
      machineCode: row.machine_code,
      deepLinkPath: row.deep_link_path,
    };
  },

  async recordScan(data: {
    qrCode: string;
    userId?: string;
    machineId?: string;
    deepLinkPath?: string;
    sessionId?: string;
  }): Promise<void> {
    const pool = getPool();
    if (!pool) return;

    await pool.query(
      `INSERT INTO qr_scan_events (user_id, session_id, qr_code, machine_id, deep_link_path)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        data.userId ?? null,
        data.sessionId ?? null,
        data.qrCode,
        data.machineId ?? null,
        data.deepLinkPath ?? null,
      ]
    );
  },
};
