import {
  bigint,
  datetime,
  decimal,
  mysqlSchema,
  varchar,
} from 'drizzle-orm/mysql-core';

export type MagentoProductReviewStatus = {
  sku: string | null;
  reviewCount: number;
  ratingAverage: string;
  mostRecentReviewAt: Date | null;
  approvedReviewCount: number;
  unpublishedReviewCount: number;
  approvedRatingAverage: string;
  unpublishedRatingAverage: string;
  approvedMostRecentReviewAt: Date | null;
  unpublishedMostRecentReviewAt: Date | null;
};

export const magAdditional = mysqlSchema('mag_additional');

export const magentoProductReviewStatus = magAdditional
  .view('magento_product_review_status', {
    sku: varchar('sku', { length: 64 }),
    reviewCount: bigint('review_count', { mode: 'number' }).notNull(),
    ratingAverage: decimal('rating_average', {
      precision: 7,
      scale: 2,
    }).notNull(),
    mostRecentReviewAt: datetime('most_recent_review_at', {
      mode: 'date',
    }),
    approvedReviewCount: bigint('approved_review_count', { mode: 'number' })
      .notNull(),
    unpublishedReviewCount: bigint('unpublished_review_count', {
      mode: 'number',
    }).notNull(),
    approvedRatingAverage: decimal('approved_rating_average', {
      precision: 7,
      scale: 2,
    }).notNull(),
    unpublishedRatingAverage: decimal('unpublished_rating_average', {
      precision: 7,
      scale: 2,
    }).notNull(),
    approvedMostRecentReviewAt: datetime('approved_most_recent_review_at', {
      mode: 'date',
    }),
    unpublishedMostRecentReviewAt: datetime(
      'unpublished_most_recent_review_at',
      { mode: 'date' },
    ),
  })
  .existing();

export type MagentoProductReviewStatusRow =
  typeof magentoProductReviewStatus.$inferSelect;
