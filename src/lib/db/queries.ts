import { and, asc, count, eq, gt, like, sql } from 'drizzle-orm';
import type { ResultSetHeader, RowDataPacket } from 'mysql2';

import { getDb, getMagentoPool } from './client';
import { magentoProductReviewStatus } from './schema';
import { SITES } from '../sites';

export const PRODUCT_REVIEW_ENTITY_ID = 1;
export const QUALITY_RATING_ID = 1;
export const APPROVED_STATUS_ID = 1;
export const QUALITY_RATING_OPTION_IDS: Record<number, number> = {
  1: 1,
  2: 2,
  3: 3,
  4: 4,
  5: 5,
};

export type SaveReviewInput = {
  reviewer: string;
  title: string;
  detail: string;
  rating: number;
  statusId: number;
  createdAt: Date;
};

export type CreateReviewInput = {
  sku: string;
  entityPkValue?: number;
  reviewer: string;
  title: string;
  detail: string;
  rating: number;
  createdAt: Date;
};

function isRating(rating: number): boolean {
  return Number.isInteger(rating) && rating >= 1 && rating <= 5;
}

export async function saveReview(reviewId: number, input: SaveReviewInput) {
  if (!Number.isInteger(reviewId)) {
    throw new Error('Invalid review id');
  }
  if (!isRating(input.rating)) {
    throw new Error('Rating must be a whole number from 1 to 5');
  }

  const conn = await getMagentoPool().getConnection();
  try {
    await conn.beginTransaction();

    const optionId = QUALITY_RATING_OPTION_IDS[input.rating];

    const [reviewResult] = await conn.execute<ResultSetHeader>(
      `UPDATE review SET status_id = ?, created_at = ? WHERE review_id = ? LIMIT 1`,
      [input.statusId, input.createdAt, reviewId],
    );
    if (reviewResult.affectedRows !== 1) {
      throw new Error(`Review #${reviewId} not found`);
    }

    await conn.execute<ResultSetHeader>(
      `UPDATE review_detail SET nickname = ?, title = ?, detail = ? WHERE review_id = ?`,
      [input.reviewer, input.title, input.detail, reviewId],
    );

    await conn.execute<ResultSetHeader>(
      `UPDATE rating_option_vote SET value = ?, percent = ?, option_id = ? WHERE review_id = ?`,
      [input.rating, input.rating * 20, optionId, reviewId],
    );

    await conn.commit();
    return { reviewId };
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
}

export async function createReview(input: CreateReviewInput) {
  if (!isRating(input.rating)) {
    throw new Error('Rating must be a whole number from 1 to 5');
  }
  const sku = input.sku.trim();
  if (!sku) {
    throw new Error('SKU is required');
  }

  const conn = await getMagentoPool().getConnection();
  try {
    await conn.beginTransaction();

    let entityPkValue = input.entityPkValue;
    if (!entityPkValue || !Number.isInteger(entityPkValue)) {
      const [productRows] = await conn.execute<
        Array<{ entity_id: number }> & RowDataPacket[]
      >(
        `SELECT entity_id FROM catalog_product_entity WHERE RTRIM(sku) = ? LIMIT 1`,
        [sku],
      );
      if (!productRows.length) {
        throw new Error(`No product found for SKU "${sku}"`);
      }
      entityPkValue = productRows[0].entity_id;
    }

    const siteIds = Object.keys(SITES).map(Number);
    const [siteRows] = await conn.execute<
      Array<{ store_id: number }> & RowDataPacket[]
    >(
      `SELECT s.store_id
       FROM catalog_product_website cpw
       JOIN core_website sw ON sw.website_id = cpw.website_id
       JOIN core_store s ON s.website_id = sw.website_id
       WHERE cpw.product_id = ? AND s.store_id IN (${siteIds.map(() => '?').join(',')}) AND s.is_active = 1`,
      [entityPkValue, ...siteIds],
    );
    if (siteRows.length !== 1) {
      throw new Error(
        siteRows.length === 0
          ? `No site assignment found for SKU "${sku}"`
          : `SKU "${sku}" maps to multiple sites; refusing to guess`,
      );
    }
    const storeId = siteRows[0].store_id;

    const optionId = QUALITY_RATING_OPTION_IDS[input.rating];

    const [reviewInsert] = await conn.execute<ResultSetHeader>(
      `INSERT INTO review (created_at, entity_id, entity_pk_value, status_id) VALUES (?, ?, ?, ?)`,
      [input.createdAt, PRODUCT_REVIEW_ENTITY_ID, entityPkValue, APPROVED_STATUS_ID],
    );
    const reviewId = reviewInsert.insertId;

    await conn.execute<ResultSetHeader>(
      `INSERT INTO review_detail (review_id, store_id, title, detail, nickname, customer_id) VALUES (?, ?, ?, ?, ?, NULL)`,
      [reviewId, storeId, input.title, input.detail, input.reviewer],
    );

    await conn.execute<ResultSetHeader>(
      `INSERT INTO review_store (review_id, store_id) VALUES (?, ?), (?, ?)`,
      [reviewId, 0, reviewId, storeId],
    );

    await conn.execute<ResultSetHeader>(
      `INSERT INTO rating_option_vote (option_id, remote_ip, remote_ip_long, customer_id, entity_pk_value, rating_id, review_id, percent, value)
       VALUES (?, NULL, NULL, NULL, ?, ?, ?, ?, ?)`,
      [optionId, entityPkValue, QUALITY_RATING_ID, reviewId, input.rating * 20, input.rating],
    );

    await conn.commit();
    return { reviewId };
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
}

export type ReviewPresenceFilter = 'with' | 'without';

export type ProductReviewRow = {
  reviewId: number | null;
  sku: string | null;
  reviewer: string | null;
  title: string | null;
  detail: string | null;
  rating: string | null;
  statusId: number | null;
  createdAt: Date | null;
  siteId: number | null;
  reviewEntityId: number | null;
  entityPkValue: number | null;
};

type ReviewQueryRow = {
  review_id: number | null;
  sku: string | null;
  reviewer: string | null;
  title: string | null;
  detail: string | null;
  rating: string | null;
  status_id: number | null;
  created_at: Date | null;
  site_id: number | null;
  review_entity_id: number | null;
  entity_pk_value: number | null;
};

const reviewSelectSql = `
  SELECT
    r.review_id,
    p.sku,
    rd.nickname AS reviewer,
    rd.title,
    rd.detail,
    r.entity_id AS review_entity_id,
    r.entity_pk_value,
    (
      SELECT ROUND(AVG(v.value), 1)
      FROM rating_option_vote v
      WHERE v.review_id = r.review_id
    ) AS rating,
    r.status_id,
    r.created_at,
    rd.store_id AS site_id
  FROM catalog_product_entity p
  INNER JOIN review r
    ON r.entity_pk_value = p.entity_id
    AND r.entity_id = (
      SELECT entity_id
      FROM review_entity
      WHERE entity_code = 'product'
    )
  INNER JOIN review_detail rd
    ON rd.review_id = r.review_id
    AND rd.store_id <> 0
`;

function mapReviewRow(row: ReviewQueryRow): ProductReviewRow {
  return {
    reviewId: row.review_id,
    sku: row.sku,
    reviewer: row.reviewer,
    title: row.title,
    detail: row.detail,
    rating: row.rating,
    statusId: row.status_id,
    createdAt: row.created_at,
    siteId: row.site_id,
    reviewEntityId: row.review_entity_id,
    entityPkValue: row.entity_pk_value,
  };
}

export async function getProductReviewsBySku(sku: string) {
  const [rows] = await getMagentoPool().query<
    Array<ReviewQueryRow> & RowDataPacket[]
  >(
    `${reviewSelectSql}
    WHERE RTRIM(p.sku) = ?
    ORDER BY r.created_at DESC
    `,
    [sku],
  );

  return rows.map(mapReviewRow);
}

export async function getReviewById(reviewId: string | number) {
  const [rows] = await getMagentoPool().query<
    Array<ReviewQueryRow> & RowDataPacket[]
  >(
    `${reviewSelectSql}
    WHERE r.review_id = ?
    ORDER BY r.created_at DESC
    LIMIT 1
    `,
    [reviewId],
  );

  return rows[0] ? mapReviewRow(rows[0]) : null;
}

export function getMagentoProductReviewSummary(limit = 10) {
  return getDb().select().from(magentoProductReviewStatus).limit(limit);
}

export type ReviewSummaryRow = {
  sku: string | null;
  reviewCount: number;
  ratingAverage: string;
  mostRecentReviewAt: Date | null;
  siteId: number | null;
};

export type ReviewSummaryOptions = {
  search?: string;
  presence?: ReviewPresenceFilter;
};

export async function getSkuSiteMap() {
  const [rows] = await getMagentoPool().query<
    Array<{ sku: string; site_id: number }> & RowDataPacket[]
  >(`
    SELECT RTRIM(cpe.sku) AS sku, MIN(rd.store_id) AS site_id
    FROM catalog_product_entity cpe
    INNER JOIN review r
      ON r.entity_pk_value = cpe.entity_id
      AND r.entity_id = (
        SELECT entity_id FROM review_entity WHERE entity_code = 'product'
      )
    INNER JOIN review_detail rd
      ON rd.review_id = r.review_id
      AND rd.store_id <> 0
    GROUP BY RTRIM(cpe.sku)
  `);

  return new Map(rows.map((row) => [row.sku, row.site_id]));
}

export async function getAllMagentoProductReviewSummaries({
  search = '',
  presence,
}: ReviewSummaryOptions = {}) {
  const conditions = [
    search ? like(magentoProductReviewStatus.sku, `%${search}%`) : undefined,
    presence === 'with'
      ? gt(magentoProductReviewStatus.reviewCount, 0)
      : presence === 'without'
        ? eq(magentoProductReviewStatus.reviewCount, 0)
        : undefined,
  ].filter((condition) => condition !== undefined);
  const where = conditions.length ? and(...conditions) : undefined;
  const db = getDb();
  const [totals] = await db
    .select({
      products: count(),
      reviews: sql<number>`coalesce(sum(${magentoProductReviewStatus.reviewCount}), 0)`,
      averageRating: sql<string>`coalesce(avg(${magentoProductReviewStatus.ratingAverage}), 0)`,
    })
    .from(magentoProductReviewStatus)
    .where(where);
  const rows = await db
    .select()
    .from(magentoProductReviewStatus)
    .where(where)
    .orderBy(asc(magentoProductReviewStatus.sku));
  const siteMap = await getSkuSiteMap();

  return {
    rows: rows.map((row) => ({
      sku: row.sku,
      reviewCount: Number(row.reviewCount),
      ratingAverage: row.ratingAverage,
      mostRecentReviewAt: row.mostRecentReviewAt,
      siteId: row.sku ? siteMap.get(row.sku.trim()) ?? null : null,
    })),
    products: Number(totals.products),
    reviews: Number(totals.reviews),
    averageRating: Number(totals.averageRating),
  };
}
