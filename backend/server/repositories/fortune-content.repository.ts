import type {
  FortuneContentCategory,
  FortuneContentItem,
  FortuneContentCreateInput,
  FortuneContentUpdateInput,
} from '@machinefit/shared';
import { getPool } from '../config/database.js';

interface ContentRow {
  id: string;
  category: string;
  code: string;
  locale: string;
  title: string;
  body: string;
  priority: number;
  is_active: boolean;
  data_conditions: Record<string, unknown> | null;
  score_weights: Record<string, number> | null;
  created_at: string;
  updated_at: string;
}

function mapRow(row: ContentRow): FortuneContentItem {
  return {
    id: row.id,
    category: row.category as FortuneContentCategory,
    code: row.code,
    locale: row.locale,
    title: row.title,
    body: row.body ?? '',
    priority: row.priority,
    isActive: row.is_active,
    dataConditions: row.data_conditions,
    scoreWeights: row.score_weights,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const fortuneContentRepository = {
  async listActive(locale = 'ko'): Promise<FortuneContentItem[]> {
    const pool = getPool();
    if (!pool) return [];
    const result = await pool.query<ContentRow>(
      `SELECT id::text, category, code, locale, title, body, priority, is_active,
              data_conditions, score_weights, created_at::text, updated_at::text
       FROM fortune_content_items
       WHERE is_active = true AND locale = $1
       ORDER BY category, priority ASC, code ASC`,
      [locale]
    );
    return result.rows.map(mapRow);
  },

  async listAdmin(options?: {
    locale?: string;
    category?: string;
    includeInactive?: boolean;
  }): Promise<FortuneContentItem[]> {
    const pool = getPool();
    if (!pool) return [];
    const params: unknown[] = [];
    const filters: string[] = [];
    if (options?.locale) {
      params.push(options.locale);
      filters.push(`locale = $${params.length}`);
    }
    if (options?.category) {
      params.push(options.category);
      filters.push(`category = $${params.length}`);
    }
    if (!options?.includeInactive) {
      filters.push('is_active = true');
    }
    const where = filters.length ? `WHERE ${filters.join(' AND ')}` : '';
    const result = await pool.query<ContentRow>(
      `SELECT id::text, category, code, locale, title, body, priority, is_active,
              data_conditions, score_weights, created_at::text, updated_at::text
       FROM fortune_content_items
       ${where}
       ORDER BY category, priority ASC, code ASC
       LIMIT 500`,
      params
    );
    return result.rows.map(mapRow);
  },

  async create(input: FortuneContentCreateInput): Promise<FortuneContentItem | null> {
    const pool = getPool();
    if (!pool) return null;
    const result = await pool.query<ContentRow>(
      `INSERT INTO fortune_content_items
         (category, code, locale, title, body, priority, is_active, data_conditions, score_weights)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9::jsonb)
       RETURNING id::text, category, code, locale, title, body, priority, is_active,
                 data_conditions, score_weights, created_at::text, updated_at::text`,
      [
        input.category,
        input.code,
        input.locale ?? 'ko',
        input.title,
        input.body ?? '',
        input.priority ?? 100,
        input.isActive ?? true,
        input.dataConditions ? JSON.stringify(input.dataConditions) : null,
        input.scoreWeights ? JSON.stringify(input.scoreWeights) : null,
      ]
    );
    return result.rows[0] ? mapRow(result.rows[0]) : null;
  },

  async update(
    id: string,
    input: FortuneContentUpdateInput
  ): Promise<FortuneContentItem | null> {
    const pool = getPool();
    if (!pool) return null;
    const fields: string[] = [];
    const values: unknown[] = [];
    let i = 1;
    const push = (col: string, val: unknown) => {
      fields.push(`${col} = $${i++}`);
      values.push(val);
    };
    if (input.category !== undefined) push('category', input.category);
    if (input.code !== undefined) push('code', input.code);
    if (input.locale !== undefined) push('locale', input.locale);
    if (input.title !== undefined) push('title', input.title);
    if (input.body !== undefined) push('body', input.body);
    if (input.priority !== undefined) push('priority', input.priority);
    if (input.isActive !== undefined) push('is_active', input.isActive);
    if (input.dataConditions !== undefined) {
      push(
        'data_conditions',
        input.dataConditions ? JSON.stringify(input.dataConditions) : null
      );
    }
    if (input.scoreWeights !== undefined) {
      push(
        'score_weights',
        input.scoreWeights ? JSON.stringify(input.scoreWeights) : null
      );
    }
    if (fields.length === 0) return this.findById(id);
    fields.push('updated_at = NOW()');
    values.push(id);
    const result = await pool.query<ContentRow>(
      `UPDATE fortune_content_items SET ${fields.join(', ')}
       WHERE id = $${i}
       RETURNING id::text, category, code, locale, title, body, priority, is_active,
                 data_conditions, score_weights, created_at::text, updated_at::text`,
      values
    );
    return result.rows[0] ? mapRow(result.rows[0]) : null;
  },

  async findById(id: string): Promise<FortuneContentItem | null> {
    const pool = getPool();
    if (!pool) return null;
    const result = await pool.query<ContentRow>(
      `SELECT id::text, category, code, locale, title, body, priority, is_active,
              data_conditions, score_weights, created_at::text, updated_at::text
       FROM fortune_content_items WHERE id = $1`,
      [id]
    );
    return result.rows[0] ? mapRow(result.rows[0]) : null;
  },

  async remove(id: string): Promise<boolean> {
    const pool = getPool();
    if (!pool) return false;
    const result = await pool.query(`DELETE FROM fortune_content_items WHERE id = $1`, [id]);
    return (result.rowCount ?? 0) > 0;
  },
};
