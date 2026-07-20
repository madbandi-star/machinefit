import { z } from 'zod';
import { getUtf8ByteLength, MACHINE_PERSONAL_TIP_MAX_BYTES } from '../utils/utf8-bytes.js';

export const machinePreferenceBodySchema = z.object({
  customSettings: z.record(z.unknown()).optional(),
  personalTipMemo: z
    .string()
    .optional()
    .refine(
      (value) => value === undefined || getUtf8ByteLength(value) <= MACHINE_PERSONAL_TIP_MAX_BYTES,
      {
        message: `personalTipMemo must be at most ${MACHINE_PERSONAL_TIP_MAX_BYTES} bytes`,
      }
    ),
});
