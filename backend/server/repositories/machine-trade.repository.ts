import { randomUUID } from 'node:crypto';
import {
  hasMinRole,
  Role,
  TRADE_DEFAULT_LISTING_DAYS,
  type CreateMachineTradeInput,
  type CreateTradeReportInput,
  type ListMachineTradesInput,
  type MachineTradeDetail,
  type MachineTradeImage,
  type MachineTradeListItem,
  type MachineTradeReport,
  type MachineTradeStats,
  type RoleCode,
  type TradeCondition,
  type TradeReportReason,
  type TradeReportStatus,
  type TradeStatus,
  type TradeType,
  type UpdateMachineTradeInput,
} from '@machinefit/shared';
import { getPool } from '../config/database.js';
import { MOCK_BRANDS, MOCK_MACHINES } from '../data/mock.js';
import {
  mockMachineTradeHidden,
  mockMachineTradeImages,
  mockMachineTradeLikes,
  mockMachineTradeReports,
  mockMachineTrades,
  tradeLikeKey,
} from '../data/machine-trade.mock.js';
import { AppError } from '../middlewares/error.middleware.js';
import { buildPaginationMeta } from '../utils/pagination.util.js';
import { machineTradeImageUrl } from '../utils/public-api-base.js';

const DAY_MS = 24 * 60 * 60 * 1000;
const CLOSED_STATUSES: TradeStatus[] = ['expired', 'cancelled', 'sold', 'purchased'];

type ProcessedImage = {
  buffer: Buffer;
  thumb: Buffer;
  mimeType: string;
  width: number;
  height: number;
  fileSizeBytes: number;
};

type TradeRow = {
  id: string;
  trade_type: TradeType;
  machine_id: string;
  brand_id: string;
  seller_id: string;
  price: number;
  condition: TradeCondition | null;
  quantity: number;
  region_label: string;
  country_code: string | null;
  state_id: string | null;
  city_id: string | null;
  district_id: string | null;
  description: string;
  status: TradeStatus;
  view_count: number;
  like_count: number;
  is_hidden: boolean;
  created_at: string;
  updated_at: string;
  expired_at: string;
  machine_code: string;
  machine_name: MachineTradeListItem['machineName'];
  brand_code: string | null;
  brand_name: MachineTradeListItem['brandName'];
  brand_logo_url: string | null;
  machine_image_url: string | null;
  seller_name: string | null;
  liked_by_me?: boolean | null;
  cover_image_id?: string | null;
};

type ImageRow = {
  id: string;
  trade_id: string;
  sort_order: number;
  mime_type: string;
  width: number | null;
  height: number | null;
};

type MachineLookup = {
  id: string;
  code: string;
  name: MachineTradeListItem['machineName'];
  brandId: string;
  brandCode?: string;
  brandName: MachineTradeListItem['brandName'];
  brandLogoUrl?: string;
  machineImageUrl?: string;
};

export function computeDaysRemaining(expiredAt: string | Date): number {
  const end = new Date(expiredAt).getTime();
  if (Number.isNaN(end)) return 0;
  return Math.floor((end - Date.now()) / DAY_MS);
}

function isExpiredTrade(status: TradeStatus, expiredAt: string): boolean {
  return status === 'expired' || new Date(expiredAt).getTime() <= Date.now();
}

function mapImage(row: ImageRow): MachineTradeImage {
  return {
    id: row.id,
    tradeId: row.trade_id,
    sortOrder: row.sort_order,
    mimeType: row.mime_type,
    width: row.width ?? undefined,
    height: row.height ?? undefined,
    imageUrl: machineTradeImageUrl(row.id, 'full'),
    thumbUrl: machineTradeImageUrl(row.id, 'thumb'),
  };
}

function mapListItem(
  row: TradeRow,
  options?: { coverImageUrl?: string; images?: MachineTradeImage[]; isOwner?: boolean }
): MachineTradeListItem & Partial<MachineTradeDetail> {
  const daysRemaining = computeDaysRemaining(row.expired_at);
  const coverImageUrl =
    options?.coverImageUrl ??
    (row.cover_image_id ? machineTradeImageUrl(row.cover_image_id, 'thumb') : undefined) ??
    row.machine_image_url ??
    undefined;

  return {
    id: row.id,
    tradeType: row.trade_type,
    machineId: row.machine_id,
    machineCode: row.machine_code,
    brandId: row.brand_id,
    brandCode: row.brand_code ?? undefined,
    brandName: row.brand_name,
    machineName: row.machine_name,
    machineImageUrl: row.machine_image_url ?? undefined,
    brandLogoUrl: row.brand_logo_url ?? undefined,
    sellerId: row.seller_id,
    sellerName: row.seller_name ?? 'Unknown',
    price: row.price,
    condition: row.condition,
    quantity: row.quantity,
    regionLabel: row.region_label,
    location: {
      countryCode: row.country_code,
      stateId: row.state_id,
      cityId: row.city_id,
      districtId: row.district_id,
    },
    status: row.status,
    viewCount: row.view_count,
    likeCount: row.like_count,
    likedByMe: row.liked_by_me ?? undefined,
    coverImageUrl,
    createdAt: typeof row.created_at === 'string' ? row.created_at : new Date(row.created_at).toISOString(),
    updatedAt: typeof row.updated_at === 'string' ? row.updated_at : new Date(row.updated_at).toISOString(),
    expiredAt: typeof row.expired_at === 'string' ? row.expired_at : new Date(row.expired_at).toISOString(),
    daysRemaining,
    isExpired: isExpiredTrade(row.status, row.expired_at),
    description: row.description,
    images: options?.images,
    isOwner: options?.isOwner,
  };
}

function sortSql(sort: ListMachineTradesInput['sort']): string {
  switch (sort) {
    case 'popular':
      return 't.like_count DESC, t.created_at DESC';
    case 'price_asc':
      return 't.price ASC, t.created_at DESC';
    case 'price_desc':
      return 't.price DESC, t.created_at DESC';
    default:
      return 't.created_at DESC';
  }
}

function listingExpiryIso(from = new Date()): string {
  return new Date(from.getTime() + TRADE_DEFAULT_LISTING_DAYS * DAY_MS).toISOString();
}

async function resolveMachine(machineId: string): Promise<MachineLookup> {
  const pool = getPool();
  if (!pool) {
    const machine = MOCK_MACHINES.find((m) => m.id === machineId);
    if (!machine) throw new AppError(404, 'MACHINE_NOT_FOUND', 'Machine not found');
    const brand = MOCK_BRANDS.find((b) => b.id === machine.brandId);
    return {
      id: machine.id,
      code: machine.code,
      name: machine.name,
      brandId: machine.brandId,
      brandCode: brand?.code,
      brandName: brand?.name ?? machine.brandName ?? machine.brandId,
      brandLogoUrl: brand?.logoUrl,
      machineImageUrl: machine.primaryImageUrl,
    };
  }

  const result = await pool.query<{
    id: string;
    code: string;
    name: Record<string, string>;
    brand_id: string;
    brand_code: string | null;
    brand_name: Record<string, string> | null;
    brand_logo_url: string | null;
    machine_image_url: string | null;
  }>(
    `SELECT m.id, m.code, m.name, m.brand_id,
            b.code AS brand_code, b.name AS brand_name, b.logo_url AS brand_logo_url,
            (
              SELECT mi.image_url
              FROM machine_images mi
              WHERE mi.machine_id = m.id
              ORDER BY mi.is_primary DESC, mi.sort_order ASC
              LIMIT 1
            ) AS machine_image_url
     FROM machines m
     JOIN brands b ON b.id = m.brand_id
     WHERE m.id = $1
     LIMIT 1`,
    [machineId]
  );
  const row = result.rows[0];
  if (!row) throw new AppError(404, 'MACHINE_NOT_FOUND', 'Machine not found');
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    brandId: row.brand_id,
    brandCode: row.brand_code ?? undefined,
    brandName: row.brand_name ?? row.brand_code ?? row.brand_id,
    brandLogoUrl: row.brand_logo_url ?? undefined,
    machineImageUrl: row.machine_image_url ?? undefined,
  };
}

function mockCoverUrl(trade: MachineTradeDetail): string | undefined {
  const first = trade.images?.[0];
  if (first) return first.thumbUrl;
  return trade.machineImageUrl;
}

function filterMockList(
  query: ListMachineTradesInput,
  viewerId: string | undefined,
  options?: { admin?: boolean }
): MachineTradeDetail[] {
  const admin = Boolean(options?.admin);
  let items = mockMachineTrades.filter((t) => {
    const hidden = mockMachineTradeHidden.has(t.id);
    if (admin) return true;
    if (hidden) return false;
    if (query.mineOnly && viewerId && t.sellerId === viewerId) return true;
    if (query.includeExpired) {
      return !['cancelled', 'sold', 'purchased'].includes(t.status);
    }
    if (CLOSED_STATUSES.includes(t.status)) return false;
    if (isExpiredTrade(t.status, t.expiredAt)) return false;
    return true;
  });

  if (query.tradeType) items = items.filter((t) => t.tradeType === query.tradeType);
  if (query.machineId) items = items.filter((t) => t.machineId === query.machineId);
  if (query.machineCode) items = items.filter((t) => t.machineCode === query.machineCode);
  if (query.status) items = items.filter((t) => t.status === query.status);
  if (query.sellerId) items = items.filter((t) => t.sellerId === query.sellerId);
  if (query.mineOnly && viewerId) items = items.filter((t) => t.sellerId === viewerId);
  if (query.likedOnly && viewerId) {
    items = items.filter((t) => mockMachineTradeLikes.has(tradeLikeKey(viewerId, t.id)));
  }
  if (query.q) {
    const q = query.q.toLowerCase();
    items = items.filter((t) => {
      const machineName = typeof t.machineName === 'string' ? t.machineName : JSON.stringify(t.machineName);
      const brandName = typeof t.brandName === 'string' ? t.brandName : JSON.stringify(t.brandName);
      return (
        machineName.toLowerCase().includes(q) ||
        brandName.toLowerCase().includes(q) ||
        t.regionLabel.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.sellerName.toLowerCase().includes(q)
      );
    });
  }

  items = [...items].sort((a, b) => {
    if (query.sort === 'popular') return b.likeCount - a.likeCount || b.createdAt.localeCompare(a.createdAt);
    if (query.sort === 'price_asc') return a.price - b.price || b.createdAt.localeCompare(a.createdAt);
    if (query.sort === 'price_desc') return b.price - a.price || b.createdAt.localeCompare(a.createdAt);
    return b.createdAt.localeCompare(a.createdAt);
  });

  return items.map((t) => ({
    ...t,
    daysRemaining: computeDaysRemaining(t.expiredAt),
    isExpired: isExpiredTrade(t.status, t.expiredAt),
    likedByMe: viewerId ? mockMachineTradeLikes.has(tradeLikeKey(viewerId, t.id)) : false,
    coverImageUrl: mockCoverUrl(t),
    isOwner: viewerId ? t.sellerId === viewerId : undefined,
  }));
}

const TRADE_SELECT = `
  t.id, t.trade_type, t.machine_id, t.brand_id, t.seller_id, t.price, t.condition, t.quantity,
  t.region_label, t.country_code, t.state_id, t.city_id, t.district_id, t.description,
  t.status, t.view_count, t.like_count, t.is_hidden, t.created_at, t.updated_at, t.expired_at,
  m.code AS machine_code, m.name AS machine_name,
  b.code AS brand_code, b.name AS brand_name, b.logo_url AS brand_logo_url,
  u.display_name AS seller_name,
  (
    SELECT mi.image_url
    FROM machine_images mi
    WHERE mi.machine_id = m.id
    ORDER BY mi.is_primary DESC, mi.sort_order ASC
    LIMIT 1
  ) AS machine_image_url,
  (
    SELECT i.id
    FROM machine_trade_images i
    WHERE i.trade_id = t.id
    ORDER BY i.sort_order ASC, i.created_at ASC
    LIMIT 1
  ) AS cover_image_id
`;

export const machineTradeRepository = {
  async list(
    query: ListMachineTradesInput,
    viewerId?: string,
    options?: { admin?: boolean }
  ) {
    const page = query.page;
    const limit = query.limit;
    const pool = getPool();
    const admin = Boolean(options?.admin);

    if (!pool) {
      const items = filterMockList(query, viewerId, options);
      const start = (page - 1) * limit;
      const slice = items.slice(start, start + limit).map((t) => {
        const { images: _images, description: _description, ...listItem } = t;
        return listItem as MachineTradeListItem;
      });
      return { items: slice, meta: buildPaginationMeta(page, limit, items.length) };
    }

    const conditions: string[] = [];
    const params: unknown[] = [];
    let idx = 1;

    if (!admin) {
      conditions.push('t.is_hidden = FALSE');
      if (query.mineOnly && viewerId) {
        conditions.push(`t.seller_id = $${idx++}`);
        params.push(viewerId);
      } else if (query.includeExpired) {
        conditions.push(`t.status NOT IN ('cancelled', 'sold', 'purchased')`);
      } else {
        conditions.push(`t.status NOT IN ('expired', 'cancelled', 'sold', 'purchased')`);
        conditions.push(`t.expired_at > NOW()`);
      }
    } else if (query.mineOnly && viewerId) {
      conditions.push(`t.seller_id = $${idx++}`);
      params.push(viewerId);
    }

    if (query.tradeType) {
      conditions.push(`t.trade_type = $${idx++}`);
      params.push(query.tradeType);
    }
    if (query.machineId) {
      conditions.push(`t.machine_id = $${idx++}`);
      params.push(query.machineId);
    }
    if (query.machineCode) {
      conditions.push(`m.code = $${idx++}`);
      params.push(query.machineCode);
    }
    if (query.status) {
      conditions.push(`t.status = $${idx++}`);
      params.push(query.status);
    }
    if (query.sellerId) {
      conditions.push(`t.seller_id = $${idx++}`);
      params.push(query.sellerId);
    }
    if (query.likedOnly && viewerId) {
      conditions.push(
        `EXISTS (SELECT 1 FROM machine_trade_likes l WHERE l.trade_id = t.id AND l.user_id = $${idx++})`
      );
      params.push(viewerId);
    }
    if (query.q) {
      conditions.push(
        `(
          m.code ILIKE $${idx} OR m.name::text ILIKE $${idx}
          OR b.name::text ILIKE $${idx} OR t.region_label ILIKE $${idx}
          OR t.description ILIKE $${idx} OR u.display_name ILIKE $${idx}
        )`
      );
      params.push(`%${query.q}%`);
      idx += 1;
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const countResult = await pool.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count
       FROM machine_trades t
       JOIN machines m ON m.id = t.machine_id
       JOIN brands b ON b.id = t.brand_id
       JOIN users u ON u.id = t.seller_id
       ${where}`,
      params
    );
    const total = parseInt(countResult.rows[0]?.count ?? '0', 10);

    const likedSelect = viewerId
      ? `, EXISTS (
           SELECT 1 FROM machine_trade_likes l
           WHERE l.trade_id = t.id AND l.user_id = $${idx}
         ) AS liked_by_me`
      : ', FALSE AS liked_by_me';
    const listParams = viewerId
      ? [...params, viewerId, limit, (page - 1) * limit]
      : [...params, limit, (page - 1) * limit];
    const limitIdx = listParams.length - 1;
    const offsetIdx = listParams.length;

    const result = await pool.query<TradeRow>(
      `SELECT ${TRADE_SELECT}
              ${likedSelect}
       FROM machine_trades t
       JOIN machines m ON m.id = t.machine_id
       JOIN brands b ON b.id = t.brand_id
       JOIN users u ON u.id = t.seller_id
       ${where}
       ORDER BY ${sortSql(query.sort)}
       LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
      listParams
    );

    const items = result.rows.map((row) => {
      const mapped = mapListItem(row);
      const { description: _d, images: _i, ...listItem } = mapped;
      return listItem as MachineTradeListItem;
    });
    return { items, meta: buildPaginationMeta(page, limit, total) };
  },

  async getById(tradeId: string, viewerId?: string, options?: { incrementView?: boolean; admin?: boolean }) {
    const pool = getPool();
    if (!pool) {
      const trade = mockMachineTrades.find((t) => t.id === tradeId);
      if (!trade) throw new AppError(404, 'NOT_FOUND', 'Trade listing not found');
      const hidden = mockMachineTradeHidden.has(tradeId);
      const isOwner = viewerId === trade.sellerId;
      if (hidden && !options?.admin && !isOwner) {
        throw new AppError(404, 'NOT_FOUND', 'Trade listing not found');
      }
      if (options?.incrementView) trade.viewCount += 1;
      return {
        ...trade,
        daysRemaining: computeDaysRemaining(trade.expiredAt),
        isExpired: isExpiredTrade(trade.status, trade.expiredAt),
        likedByMe: viewerId ? mockMachineTradeLikes.has(tradeLikeKey(viewerId, tradeId)) : false,
        coverImageUrl: mockCoverUrl(trade),
        isOwner: viewerId ? isOwner : undefined,
      } satisfies MachineTradeDetail;
    }

    if (options?.incrementView) {
      await pool.query(`UPDATE machine_trades SET view_count = view_count + 1 WHERE id = $1`, [tradeId]);
    }

    const likedSelect = viewerId
      ? `, EXISTS (
           SELECT 1 FROM machine_trade_likes l
           WHERE l.trade_id = t.id AND l.user_id = $2
         ) AS liked_by_me`
      : ', FALSE AS liked_by_me';

    const result = await pool.query<TradeRow>(
      `SELECT ${TRADE_SELECT}
              ${likedSelect}
       FROM machine_trades t
       JOIN machines m ON m.id = t.machine_id
       JOIN brands b ON b.id = t.brand_id
       JOIN users u ON u.id = t.seller_id
       WHERE t.id = $1`,
      viewerId ? [tradeId, viewerId] : [tradeId]
    );
    const row = result.rows[0];
    if (!row) throw new AppError(404, 'NOT_FOUND', 'Trade listing not found');
    const isOwner = viewerId === row.seller_id;
    if (row.is_hidden && !options?.admin && !isOwner) {
      throw new AppError(404, 'NOT_FOUND', 'Trade listing not found');
    }

    const imageResult = await pool.query<ImageRow>(
      `SELECT id, trade_id, sort_order, mime_type, width, height
       FROM machine_trade_images
       WHERE trade_id = $1
       ORDER BY sort_order ASC, created_at ASC`,
      [tradeId]
    );
    const images = imageResult.rows.map(mapImage);
    return mapListItem(row, {
      images,
      coverImageUrl: images[0]?.thumbUrl ?? row.machine_image_url ?? undefined,
      isOwner: viewerId ? isOwner : undefined,
    }) as MachineTradeDetail;
  },

  async create(sellerId: string, sellerName: string, input: CreateMachineTradeInput, images: ProcessedImage[]) {
    if (input.tradeType === 'sell' && !input.condition) {
      throw new AppError(400, 'CONDITION_REQUIRED', 'Condition is required for sell listings');
    }

    const machine = await resolveMachine(input.machineId);
    const expiredAt = listingExpiryIso();
    const pool = getPool();

    if (!pool) {
      const id = randomUUID();
      const now = new Date().toISOString();
      const imageMetas: MachineTradeImage[] = images.map((img, index) => {
        const imageId = randomUUID();
        mockMachineTradeImages.set(imageId, {
          mimeType: img.mimeType,
          imageData: img.buffer,
          thumbnailData: img.thumb,
          width: img.width,
          height: img.height,
          tradeId: id,
          sortOrder: index,
        });
        return {
          id: imageId,
          tradeId: id,
          sortOrder: index,
          mimeType: img.mimeType,
          width: img.width,
          height: img.height,
          imageUrl: machineTradeImageUrl(imageId, 'full'),
          thumbUrl: machineTradeImageUrl(imageId, 'thumb'),
        };
      });

      const trade: MachineTradeDetail = {
        id,
        tradeType: input.tradeType,
        machineId: machine.id,
        machineCode: machine.code,
        brandId: machine.brandId,
        brandCode: machine.brandCode,
        brandName: machine.brandName,
        machineName: machine.name,
        machineImageUrl: machine.machineImageUrl,
        brandLogoUrl: machine.brandLogoUrl,
        sellerId,
        sellerName,
        price: input.price,
        condition: input.condition ?? null,
        quantity: input.quantity ?? 1,
        regionLabel: input.regionLabel,
        location: {
          countryCode: input.countryCode ?? null,
          stateId: input.stateId ?? null,
          cityId: input.cityId ?? null,
          districtId: input.districtId ?? null,
        },
        status: 'selling',
        viewCount: 0,
        likeCount: 0,
        likedByMe: false,
        coverImageUrl: imageMetas[0]?.thumbUrl ?? machine.machineImageUrl,
        createdAt: now,
        updatedAt: now,
        expiredAt,
        daysRemaining: computeDaysRemaining(expiredAt),
        isExpired: false,
        description: input.description ?? '',
        images: imageMetas,
        isOwner: true,
      };
      mockMachineTrades.unshift(trade);
      return trade;
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const insert = await client.query<{ id: string }>(
        `INSERT INTO machine_trades (
           trade_type, machine_id, brand_id, seller_id, price, condition, quantity,
           region_label, country_code, state_id, city_id, district_id, description, expired_at
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
         RETURNING id`,
        [
          input.tradeType,
          machine.id,
          machine.brandId,
          sellerId,
          input.price,
          input.condition ?? null,
          input.quantity ?? 1,
          input.regionLabel,
          input.countryCode ?? null,
          input.stateId ?? null,
          input.cityId ?? null,
          input.districtId ?? null,
          input.description ?? '',
          expiredAt,
        ]
      );
      const tradeId = insert.rows[0].id;

      for (let i = 0; i < images.length; i += 1) {
        const img = images[i];
        await client.query(
          `INSERT INTO machine_trade_images
             (trade_id, sort_order, mime_type, width, height, file_size_bytes, image_data, thumbnail_data)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
          [
            tradeId,
            i,
            img.mimeType,
            img.width,
            img.height,
            img.fileSizeBytes,
            img.buffer,
            img.thumb,
          ]
        );
      }

      await client.query('COMMIT');
      return this.getById(tradeId, sellerId);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  async update(tradeId: string, userId: string, role: RoleCode, input: UpdateMachineTradeInput) {
    const pool = getPool();
    if (!pool) {
      const trade = mockMachineTrades.find((t) => t.id === tradeId);
      if (!trade) throw new AppError(404, 'NOT_FOUND', 'Trade listing not found');
      if (trade.sellerId !== userId && !hasMinRole(role, Role.ADMIN)) {
        throw new AppError(403, 'FORBIDDEN', 'Only the owner can update this listing');
      }
      if (input.price !== undefined) trade.price = input.price;
      if (input.condition !== undefined) trade.condition = input.condition;
      if (input.quantity !== undefined) trade.quantity = input.quantity;
      if (input.regionLabel !== undefined) trade.regionLabel = input.regionLabel;
      if (input.description !== undefined) trade.description = input.description;
      if (input.status !== undefined) trade.status = input.status;
      if (
        input.countryCode !== undefined ||
        input.stateId !== undefined ||
        input.cityId !== undefined ||
        input.districtId !== undefined
      ) {
        trade.location = {
          countryCode: input.countryCode !== undefined ? input.countryCode : trade.location?.countryCode ?? null,
          stateId: input.stateId !== undefined ? input.stateId : trade.location?.stateId ?? null,
          cityId: input.cityId !== undefined ? input.cityId : trade.location?.cityId ?? null,
          districtId: input.districtId !== undefined ? input.districtId : trade.location?.districtId ?? null,
        };
      }
      trade.updatedAt = new Date().toISOString();
      trade.daysRemaining = computeDaysRemaining(trade.expiredAt);
      trade.isExpired = isExpiredTrade(trade.status, trade.expiredAt);
      return trade;
    }

    const existing = await pool.query<{ seller_id: string; trade_type: TradeType; condition: TradeCondition | null }>(
      `SELECT seller_id, trade_type, condition FROM machine_trades WHERE id = $1`,
      [tradeId]
    );
    if (!existing.rows[0]) throw new AppError(404, 'NOT_FOUND', 'Trade listing not found');
    if (existing.rows[0].seller_id !== userId && !hasMinRole(role, Role.ADMIN)) {
      throw new AppError(403, 'FORBIDDEN', 'Only the owner can update this listing');
    }

    const nextCondition = input.condition !== undefined ? input.condition : existing.rows[0].condition;
    if (existing.rows[0].trade_type === 'sell' && !nextCondition) {
      throw new AppError(400, 'CONDITION_REQUIRED', 'Condition is required for sell listings');
    }

    await pool.query(
      `UPDATE machine_trades SET
         price = COALESCE($2, price),
         condition = CASE WHEN $3::boolean THEN $4 ELSE condition END,
         quantity = COALESCE($5, quantity),
         region_label = COALESCE($6, region_label),
         country_code = CASE WHEN $7::boolean THEN $8 ELSE country_code END,
         state_id = CASE WHEN $9::boolean THEN $10::uuid ELSE state_id END,
         city_id = CASE WHEN $11::boolean THEN $12::uuid ELSE city_id END,
         district_id = CASE WHEN $13::boolean THEN $14::uuid ELSE district_id END,
         description = COALESCE($15, description),
         status = COALESCE($16, status)
       WHERE id = $1`,
      [
        tradeId,
        input.price ?? null,
        input.condition !== undefined,
        input.condition ?? null,
        input.quantity ?? null,
        input.regionLabel ?? null,
        input.countryCode !== undefined,
        input.countryCode ?? null,
        input.stateId !== undefined,
        input.stateId ?? null,
        input.cityId !== undefined,
        input.cityId ?? null,
        input.districtId !== undefined,
        input.districtId ?? null,
        input.description ?? null,
        input.status ?? null,
      ]
    );
    return this.getById(tradeId, userId, { admin: hasMinRole(role, Role.ADMIN) });
  },

  async delete(tradeId: string, userId: string, role: RoleCode) {
    const pool = getPool();
    if (!pool) {
      const trade = mockMachineTrades.find((t) => t.id === tradeId);
      if (!trade) throw new AppError(404, 'NOT_FOUND', 'Trade listing not found');
      if (trade.sellerId !== userId && !hasMinRole(role, Role.ADMIN)) {
        throw new AppError(403, 'FORBIDDEN', 'Only the owner can delete this listing');
      }
      mockMachineTradeHidden.add(tradeId);
      return;
    }

    const existing = await pool.query<{ seller_id: string }>(
      `SELECT seller_id FROM machine_trades WHERE id = $1`,
      [tradeId]
    );
    if (!existing.rows[0]) throw new AppError(404, 'NOT_FOUND', 'Trade listing not found');
    if (existing.rows[0].seller_id !== userId && !hasMinRole(role, Role.ADMIN)) {
      throw new AppError(403, 'FORBIDDEN', 'Only the owner can delete this listing');
    }
    await pool.query(`UPDATE machine_trades SET is_hidden = TRUE WHERE id = $1`, [tradeId]);
  },

  async restore(tradeId: string) {
    const pool = getPool();
    if (!pool) {
      const trade = mockMachineTrades.find((t) => t.id === tradeId);
      if (!trade) throw new AppError(404, 'NOT_FOUND', 'Trade listing not found');
      mockMachineTradeHidden.delete(tradeId);
      return this.getById(tradeId, undefined, { admin: true });
    }
    const result = await pool.query(
      `UPDATE machine_trades SET is_hidden = FALSE WHERE id = $1 RETURNING id`,
      [tradeId]
    );
    if (!result.rowCount) throw new AppError(404, 'NOT_FOUND', 'Trade listing not found');
    return this.getById(tradeId, undefined, { admin: true });
  },

  async republish(tradeId: string, userId: string, role: RoleCode) {
    const pool = getPool();
    if (!pool) {
      const source = mockMachineTrades.find((t) => t.id === tradeId);
      if (!source) throw new AppError(404, 'NOT_FOUND', 'Trade listing not found');
      if (source.sellerId !== userId && !hasMinRole(role, Role.ADMIN)) {
        throw new AppError(403, 'FORBIDDEN', 'Only the owner can republish this listing');
      }
      const now = new Date();
      const expiredAt = listingExpiryIso(now);
      const newId = randomUUID();
      const images: MachineTradeImage[] = (source.images ?? []).map((img, index) => {
        const imageId = randomUUID();
        const binary = mockMachineTradeImages.get(img.id);
        if (binary) {
          mockMachineTradeImages.set(imageId, {
            ...binary,
            tradeId: newId,
            sortOrder: index,
          });
        }
        return {
          ...img,
          id: imageId,
          tradeId: newId,
          sortOrder: index,
          imageUrl: machineTradeImageUrl(imageId, 'full'),
          thumbUrl: machineTradeImageUrl(imageId, 'thumb'),
        };
      });
      const copy: MachineTradeDetail = {
        ...source,
        id: newId,
        status: 'selling',
        viewCount: 0,
        likeCount: 0,
        likedByMe: false,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
        expiredAt,
        daysRemaining: computeDaysRemaining(expiredAt),
        isExpired: false,
        images,
        coverImageUrl: images[0]?.thumbUrl ?? source.machineImageUrl,
        isOwner: true,
      };
      mockMachineTrades.unshift(copy);
      return copy;
    }

    const existing = await pool.query<{ seller_id: string }>(
      `SELECT seller_id FROM machine_trades WHERE id = $1 AND is_hidden = FALSE`,
      [tradeId]
    );
    if (!existing.rows[0]) throw new AppError(404, 'NOT_FOUND', 'Trade listing not found');
    if (existing.rows[0].seller_id !== userId && !hasMinRole(role, Role.ADMIN)) {
      throw new AppError(403, 'FORBIDDEN', 'Only the owner can republish this listing');
    }

    const expiredAt = listingExpiryIso();
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const insert = await client.query<{ id: string }>(
        `INSERT INTO machine_trades (
           trade_type, machine_id, brand_id, seller_id, price, condition, quantity,
           region_label, country_code, state_id, city_id, district_id, description, status, expired_at
         )
         SELECT trade_type, machine_id, brand_id, seller_id, price, condition, quantity,
                region_label, country_code, state_id, city_id, district_id, description, 'selling', $2
         FROM machine_trades
         WHERE id = $1
         RETURNING id`,
        [tradeId, expiredAt]
      );
      const newId = insert.rows[0].id;
      await client.query(
        `INSERT INTO machine_trade_images
           (trade_id, sort_order, mime_type, width, height, file_size_bytes, image_data, thumbnail_data)
         SELECT $2, sort_order, mime_type, width, height, file_size_bytes, image_data, thumbnail_data
         FROM machine_trade_images
         WHERE trade_id = $1
         ORDER BY sort_order ASC, created_at ASC`,
        [tradeId, newId]
      );
      await client.query('COMMIT');
      return this.getById(newId, userId);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  async getImageBinary(imageId: string, variant: 'full' | 'thumb') {
    const pool = getPool();
    if (!pool) {
      const img = mockMachineTradeImages.get(imageId);
      if (!img) throw new AppError(404, 'NOT_FOUND', 'Image not found');
      if (mockMachineTradeHidden.has(img.tradeId)) {
        throw new AppError(404, 'NOT_FOUND', 'Image not found');
      }
      return {
        mimeType: img.mimeType,
        data: variant === 'thumb' ? img.thumbnailData : img.imageData,
      };
    }
    const result = await pool.query<{
      mime_type: string;
      image_data: Buffer;
      thumbnail_data: Buffer;
      is_hidden: boolean;
    }>(
      `SELECT i.mime_type, i.image_data, i.thumbnail_data, t.is_hidden
       FROM machine_trade_images i
       JOIN machine_trades t ON t.id = i.trade_id
       WHERE i.id = $1`,
      [imageId]
    );
    const row = result.rows[0];
    if (!row || row.is_hidden) throw new AppError(404, 'NOT_FOUND', 'Image not found');
    return {
      mimeType: row.mime_type,
      data: variant === 'thumb' ? row.thumbnail_data : row.image_data,
    };
  },

  async toggleLike(tradeId: string, userId: string) {
    const pool = getPool();
    if (!pool) {
      const trade = mockMachineTrades.find((t) => t.id === tradeId);
      if (!trade || mockMachineTradeHidden.has(tradeId)) {
        throw new AppError(404, 'NOT_FOUND', 'Trade listing not found');
      }
      const key = tradeLikeKey(userId, tradeId);
      if (mockMachineTradeLikes.has(key)) {
        mockMachineTradeLikes.delete(key);
        trade.likeCount = Math.max(0, trade.likeCount - 1);
        return { liked: false, likeCount: trade.likeCount, sellerId: trade.sellerId };
      }
      mockMachineTradeLikes.add(key);
      trade.likeCount += 1;
      return { liked: true, likeCount: trade.likeCount, sellerId: trade.sellerId };
    }

    const existing = await pool.query<{ seller_id: string }>(
      `SELECT seller_id FROM machine_trades WHERE id = $1 AND is_hidden = FALSE`,
      [tradeId]
    );
    if (!existing.rows[0]) throw new AppError(404, 'NOT_FOUND', 'Trade listing not found');

    const liked = await pool.query(
      `SELECT 1 FROM machine_trade_likes WHERE user_id = $1 AND trade_id = $2`,
      [userId, tradeId]
    );
    if (liked.rowCount) {
      await pool.query(`DELETE FROM machine_trade_likes WHERE user_id = $1 AND trade_id = $2`, [
        userId,
        tradeId,
      ]);
      await pool.query(
        `UPDATE machine_trades SET like_count = GREATEST(like_count - 1, 0) WHERE id = $1`,
        [tradeId]
      );
    } else {
      await pool.query(`INSERT INTO machine_trade_likes (user_id, trade_id) VALUES ($1, $2)`, [
        userId,
        tradeId,
      ]);
      await pool.query(`UPDATE machine_trades SET like_count = like_count + 1 WHERE id = $1`, [tradeId]);
    }
    const count = await pool.query<{ like_count: number }>(
      `SELECT like_count FROM machine_trades WHERE id = $1`,
      [tradeId]
    );
    return {
      liked: !liked.rowCount,
      likeCount: count.rows[0]?.like_count ?? 0,
      sellerId: existing.rows[0].seller_id,
    };
  },

  async createReport(tradeId: string, reporterId: string, input: CreateTradeReportInput) {
    const pool = getPool();
    if (!pool) {
      const trade = mockMachineTrades.find((t) => t.id === tradeId);
      if (!trade || mockMachineTradeHidden.has(tradeId)) {
        throw new AppError(404, 'NOT_FOUND', 'Trade listing not found');
      }
      if (mockMachineTradeReports.some((r) => r.tradeId === tradeId && r.reporterId === reporterId)) {
        throw new AppError(409, 'ALREADY_REPORTED', 'You already reported this listing');
      }
      const report: MachineTradeReport = {
        id: randomUUID(),
        tradeId,
        reporterId,
        reason: input.reason,
        description: input.description,
        status: 'pending',
        createdAt: new Date().toISOString(),
        trade: {
          id: trade.id,
          tradeType: trade.tradeType,
          machineName: trade.machineName,
          brandName: trade.brandName,
          price: trade.price,
          status: trade.status,
          sellerName: trade.sellerName,
        },
      };
      mockMachineTradeReports.unshift(report);
      return report;
    }

    const trade = await pool.query(`SELECT id FROM machine_trades WHERE id = $1 AND is_hidden = FALSE`, [
      tradeId,
    ]);
    if (!trade.rowCount) throw new AppError(404, 'NOT_FOUND', 'Trade listing not found');

    try {
      const result = await pool.query<{
        id: string;
        trade_id: string;
        reporter_id: string;
        reason: string;
        description: string | null;
        status: string;
        created_at: string;
        resolved_at: string | null;
      }>(
        `INSERT INTO machine_trade_reports (trade_id, reporter_id, reason, description)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [tradeId, reporterId, input.reason, input.description ?? null]
      );
      const row = result.rows[0];
      return {
        id: row.id,
        tradeId: row.trade_id,
        reporterId: row.reporter_id,
        reason: row.reason as TradeReportReason,
        description: row.description ?? undefined,
        status: row.status as TradeReportStatus,
        createdAt: row.created_at,
        resolvedAt: row.resolved_at ?? undefined,
      } satisfies MachineTradeReport;
    } catch (error: unknown) {
      const code = typeof error === 'object' && error && 'code' in error ? String((error as { code: string }).code) : '';
      if (code === '23505') {
        throw new AppError(409, 'ALREADY_REPORTED', 'You already reported this listing');
      }
      throw error;
    }
  },

  async listReports(options: { sellerId?: string } = {}) {
    const pool = getPool();
    if (!pool) {
      if (!options.sellerId) return mockMachineTradeReports;
      const sellerTradeIds = new Set(
        mockMachineTrades.filter((t) => t.sellerId === options.sellerId).map((t) => t.id)
      );
      return mockMachineTradeReports.filter((r) => sellerTradeIds.has(r.tradeId));
    }

    const params: string[] = [];
    const sellerFilter = options.sellerId
      ? (params.push(options.sellerId), 'WHERE t.seller_id = $1')
      : '';

    const result = await pool.query<{
      id: string;
      trade_id: string;
      reporter_id: string;
      reason: string;
      description: string | null;
      status: string;
      created_at: string;
      resolved_at: string | null;
      reporter_name: string | null;
      trade_type: TradeType;
      machine_name: Record<string, string> | string;
      brand_name: Record<string, string> | string;
      price: number;
      trade_status: TradeStatus;
      seller_name: string | null;
    }>(
      `SELECT r.id, r.trade_id, r.reporter_id, r.reason, r.description, r.status,
              r.created_at, r.resolved_at,
              ru.display_name AS reporter_name,
              t.trade_type, t.price, t.status AS trade_status,
              m.name AS machine_name, b.name AS brand_name,
              su.display_name AS seller_name
       FROM machine_trade_reports r
       JOIN machine_trades t ON t.id = r.trade_id
       JOIN machines m ON m.id = t.machine_id
       JOIN brands b ON b.id = t.brand_id
       JOIN users ru ON ru.id = r.reporter_id
       JOIN users su ON su.id = t.seller_id
       ${sellerFilter}
       ORDER BY r.created_at DESC
       LIMIT 200`,
      params
    );

    return result.rows.map(
      (row): MachineTradeReport => ({
        id: row.id,
        tradeId: row.trade_id,
        reporterId: row.reporter_id,
        reporterName: row.reporter_name ?? undefined,
        reason: row.reason as TradeReportReason,
        description: row.description ?? undefined,
        status: row.status as TradeReportStatus,
        createdAt: row.created_at,
        resolvedAt: row.resolved_at ?? undefined,
        trade: {
          id: row.trade_id,
          tradeType: row.trade_type,
          machineName: row.machine_name,
          brandName: row.brand_name,
          price: row.price,
          status: row.trade_status,
          sellerName: row.seller_name ?? 'Unknown',
        },
      })
    );
  },

  async resolveReport(reportId: string, _adminId: string, status: 'resolved' | 'dismissed') {
    const pool = getPool();
    if (!pool) {
      const report = mockMachineTradeReports.find((r) => r.id === reportId);
      if (!report) throw new AppError(404, 'NOT_FOUND', 'Report not found');
      report.status = status;
      report.resolvedAt = new Date().toISOString();
      return report;
    }
    const result = await pool.query<{
      id: string;
      trade_id: string;
      reporter_id: string;
      reason: string;
      description: string | null;
      status: string;
      created_at: string;
      resolved_at: string | null;
    }>(
      `UPDATE machine_trade_reports
       SET status = $2, resolved_by = $3, resolved_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [reportId, status, _adminId]
    );
    const row = result.rows[0];
    if (!row) throw new AppError(404, 'NOT_FOUND', 'Report not found');
    return {
      id: row.id,
      tradeId: row.trade_id,
      reporterId: row.reporter_id,
      reason: row.reason as TradeReportReason,
      description: row.description ?? undefined,
      status: row.status as TradeReportStatus,
      createdAt: row.created_at,
      resolvedAt: row.resolved_at ?? undefined,
    } satisfies MachineTradeReport;
  },

  async stats(): Promise<MachineTradeStats> {
    const pool = getPool();
    if (!pool) {
      const visible = mockMachineTrades.filter((t) => !mockMachineTradeHidden.has(t.id));
      const active = visible.filter(
        (t) => !CLOSED_STATUSES.includes(t.status) && !isExpiredTrade(t.status, t.expiredAt)
      );
      const popular = [...visible]
        .sort((a, b) => b.likeCount - a.likeCount || b.createdAt.localeCompare(a.createdAt))
        .slice(0, 10)
        .map((t) => {
          const { images: _i, description: _d, ...item } = t;
          return {
            ...item,
            daysRemaining: computeDaysRemaining(t.expiredAt),
            isExpired: isExpiredTrade(t.status, t.expiredAt),
            coverImageUrl: mockCoverUrl(t),
          } as MachineTradeListItem;
        });
      return {
        totalActive: active.length,
        totalSell: active.filter((t) => t.tradeType === 'sell').length,
        totalBuy: active.filter((t) => t.tradeType === 'buy').length,
        totalExpired: visible.filter((t) => t.status === 'expired' || isExpiredTrade(t.status, t.expiredAt)).length,
        totalReportsPending: mockMachineTradeReports.filter((r) => r.status === 'pending').length,
        popular,
      };
    }

    const counts = await pool.query<{
      total_active: string;
      total_sell: string;
      total_buy: string;
      total_expired: string;
      total_reports_pending: string;
    }>(
      `SELECT
         COUNT(*) FILTER (
           WHERE is_hidden = FALSE
             AND status NOT IN ('expired', 'cancelled', 'sold', 'purchased')
             AND expired_at > NOW()
         )::text AS total_active,
         COUNT(*) FILTER (
           WHERE is_hidden = FALSE
             AND trade_type = 'sell'
             AND status NOT IN ('expired', 'cancelled', 'sold', 'purchased')
             AND expired_at > NOW()
         )::text AS total_sell,
         COUNT(*) FILTER (
           WHERE is_hidden = FALSE
             AND trade_type = 'buy'
             AND status NOT IN ('expired', 'cancelled', 'sold', 'purchased')
             AND expired_at > NOW()
         )::text AS total_buy,
         COUNT(*) FILTER (
           WHERE is_hidden = FALSE AND (status = 'expired' OR expired_at <= NOW())
         )::text AS total_expired,
         (SELECT COUNT(*)::text FROM machine_trade_reports WHERE status = 'pending') AS total_reports_pending
       FROM machine_trades`
    );
    const row = counts.rows[0];
    const popularResult = await this.list(
      {
        sort: 'popular',
        page: 1,
        limit: 10,
        includeExpired: false,
        likedOnly: false,
        mineOnly: false,
      },
      undefined,
      { admin: false }
    );

    return {
      totalActive: parseInt(row?.total_active ?? '0', 10),
      totalSell: parseInt(row?.total_sell ?? '0', 10),
      totalBuy: parseInt(row?.total_buy ?? '0', 10),
      totalExpired: parseInt(row?.total_expired ?? '0', 10),
      totalReportsPending: parseInt(row?.total_reports_pending ?? '0', 10),
      popular: popularResult.items,
    };
  },

  async expireOverdue(): Promise<number> {
    const pool = getPool();
    if (!pool) {
      let count = 0;
      const now = Date.now();
      for (const trade of mockMachineTrades) {
        if (
          (trade.status === 'selling' || trade.status === 'reserved') &&
          new Date(trade.expiredAt).getTime() <= now
        ) {
          trade.status = 'expired';
          trade.isExpired = true;
          trade.daysRemaining = computeDaysRemaining(trade.expiredAt);
          trade.updatedAt = new Date().toISOString();
          count += 1;
        }
      }
      return count;
    }

    const result = await pool.query(
      `UPDATE machine_trades
       SET status = 'expired'
       WHERE status IN ('selling', 'reserved')
         AND expired_at <= NOW()`
    );
    return result.rowCount ?? 0;
  },
};
