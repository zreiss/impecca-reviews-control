import { sql } from 'drizzle-orm';

import { db } from './client';
import type { MagentoProductReviewSummaryRow, ReviewIpRow } from './schema';
import { magentoProductReviewSummary } from './schema';

export async function getReviewIps(limit = 10) {
  return db.execute<ReviewIpRow[]>(sql.raw(`select * from mag_additional.review_ips limit ${limit}`));
}

export function getMagentoProductReviewSummary(limit = 10) {
  return db.select().from(magentoProductReviewSummary).limit(limit);
}

export type MagentoProductReviewSummaryResult = MagentoProductReviewSummaryRow;
