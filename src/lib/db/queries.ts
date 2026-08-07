import { and, asc, count, eq, gt, like, sql } from 'drizzle-orm';
import type { RowDataPacket } from 'mysql2';

import { getDb, getMagentoPool } from './client';
import { magentoProductReviewStatus } from './schema';

export type ReviewPresenceFilter = 'with' | 'without';

export type ProductReviewRow = {
  sku: string | null;
  reviewer: string | null;
  title: string | null;
  detail: string | null;
  rating: string | null;
  createdAt: Date | null;
};

export async function getProductReviewsBySku(sku: string) {
  const [rows] = await getMagentoPool().query<
    Array<{
      sku: string | null;
      reviewer: string | null;
      title: string | null;
      detail: string | null;
      rating: string | null;
      created_at: Date | null;
    }> &
      RowDataPacket[]
  >(
    `
    SELECT
      p.sku,
      rd.nickname AS reviewer,
      rd.title,
      rd.detail,
      (
        SELECT ROUND(AVG(v.value), 1)
        FROM rating_option_vote v
        WHERE v.review_id = r.review_id
      ) AS rating,
      r.created_at
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
    WHERE p.sku = ?
    ORDER BY r.created_at DESC
    `,
    [sku],
  );

  return rows.map((row) => ({
    sku: row.sku,
    reviewer: row.reviewer,
    title: row.title,
    detail: row.detail,
    rating: row.rating,
    createdAt: row.created_at,
  }));
}

export function getMagentoProductReviewSummary(limit = 10) {
  return getDb().select().from(magentoProductReviewStatus).limit(limit);
}

export type ReviewSummaryRow = {
  sku: string | null;
  reviewCount: number;
  ratingAverage: string;
  mostRecentReviewAt: Date | null;
};

export type ReviewSummaryOptions = {
  search?: string;
  presence?: ReviewPresenceFilter;
};

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

  return {
    rows: rows.map((row) => ({
      sku: row.sku,
      reviewCount: Number(row.reviewCount),
      ratingAverage: row.ratingAverage,
      mostRecentReviewAt: row.mostRecentReviewAt,
    })),
    products: Number(totals.products),
    reviews: Number(totals.reviews),
    averageRating: Number(totals.averageRating),
  };
}
