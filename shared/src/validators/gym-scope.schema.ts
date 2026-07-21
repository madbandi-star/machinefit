import { z } from 'zod';
import { ALL_GYMS_ID } from '../constants/subscription.js';

/** Real gym UUID or aggregate sentinel for read APIs. */
export const gymScopeIdSchema = z.union([z.string().uuid(), z.literal(ALL_GYMS_ID)]);

/** Required for writes — never "all". */
export const gymIdSchema = z.string().uuid();

export const memberIdSchema = z.string().uuid();
