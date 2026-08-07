import 'dotenv/config';

import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';

type DbPool = ReturnType<typeof mysql.createPool>;

let pool: DbPool | undefined;

function getDbConfig() {
  const host = process.env.DB_HOST;
  const user = process.env.DB_USER;
  const password = process.env.DB_PASSWORD;
  const database = process.env.DB_NAME;

  if (!host || !user || !password || !database) {
    throw new Error('Missing DB env vars: DB_HOST, DB_USER, DB_PASSWORD, DB_NAME');
  }

  return { host, user, password, database };
}

export function getPool() {
  if (!pool) {
    const config = getDbConfig();

    pool = mysql.createPool({
      ...config,
      waitForConnections: true,
      connectionLimit: 10,
    });
  }

  return pool;
}

let magentoPool: DbPool | undefined;

export function getMagentoPool() {
  if (!magentoPool) {
    const { host, user, password } = getDbConfig();
    const database = process.env.MAGENTO_DB_NAME || 'magento';

    magentoPool = mysql.createPool({
      host,
      user,
      password,
      database,
      waitForConnections: true,
      connectionLimit: 10,
    });
  }

  return magentoPool;
}

function createDb() {
  return drizzle({ client: getPool() });
}

let db: ReturnType<typeof createDb> | undefined;

export function getDb() {
  if (!db) {
    db = createDb();
  }

  return db;
}
