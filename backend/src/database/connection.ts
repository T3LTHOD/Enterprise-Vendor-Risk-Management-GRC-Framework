import { Pool, Client } from 'pg';
import logger from '../utils/logger';
import { initializeTables } from './schema';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost/grc_compliance',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
  logger.error('Unexpected error on idle client', err);
  process.exit(-1);
});

export const query = (text: string, params?: any[]) => pool.query(text, params);

export const initializeDatabase = async () => {
  const client = await pool.connect();
  try {
    await initializeTables(client);
    logger.info('Database schema initialized');
  } finally {
    client.release();
  }
};

export default pool;
