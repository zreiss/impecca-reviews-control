import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';

const host = process.env.DB_HOST;
const user = process.env.DB_USER;
const password = process.env.DB_PASSWORD;
const database = process.env.DB_NAME;

if (!host || !user || !password || !database) {
  throw new Error('Missing DB env vars: DB_HOST, DB_USER, DB_PASSWORD, DB_NAME');
}

export const pool = mysql.createPool({
  host,
  user,
  password,
  database,
  waitForConnections: true,
  connectionLimit: 10,
});

export const db = drizzle({ client: pool });
