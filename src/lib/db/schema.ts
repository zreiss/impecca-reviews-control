import {
  bigint,
  datetime,
  decimal,
  mysqlSchema,
  varchar,
} from 'drizzle-orm/mysql-core';

export type MagentoProductReviewSummary = {
  sku: string | null;
  reviewCount: number;
  ratingAverage: string;
  mostRecentReviewAt: Date | null;
};

export const magAdditional = mysqlSchema('mag_additional');

export const magentoProductReviewSummary = magAdditional
  .view('magento_product_review_summary', {
    sku: varchar('sku', { length: 64 }),
    reviewCount: bigint('review_count', { mode: 'number' }).notNull(),
    ratingAverage: decimal('rating_average', {
      precision: 7,
      scale: 2,
    }).notNull(),
    mostRecentReviewAt: datetime('most_recent_review_at', {
      mode: 'date',
    }),
  })
  .existing();

export type MagentoProductReviewSummaryRow =
  typeof magentoProductReviewSummary.$inferSelect;

export const reviewIps = magAdditional.view('review_ips', {}).existing();

export type ReviewIpRow = Record<string, unknown>;
