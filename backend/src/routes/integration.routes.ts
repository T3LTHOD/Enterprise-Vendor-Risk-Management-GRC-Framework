import express, { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../database/connection';
import logger from '../utils/logger';

const router = express.Router();

router.get('/:org_id', async (req: Request, res: Response) => {
  try {
    const { org_id } = req.params;
    const result = await query(
      'SELECT id, integration_type, connection_name, is_active, last_sync FROM integrations WHERE organization_id = $1',
      [org_id]
    );
    res.json(result.rows);
  } catch (error) {
    logger.error('Error fetching integrations', error);
    res.status(500).json({ error: 'Failed to fetch integrations' });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const { organization_id, integration_type, connection_name, api_key } = req.body;

    if (!organization_id || !integration_type) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const integration_id = uuidv4();
    await query(
      `INSERT INTO integrations (id, organization_id, integration_type, connection_name, api_key)
       VALUES ($1, $2, $3, $4, $5)`,
      [integration_id, organization_id, integration_type, connection_name || integration_type, api_key]
    );

    logger.info('Integration created', { integration_id, integration_type });
    res.status(201).json({ id: integration_id, integration_type });
  } catch (error) {
    logger.error('Error creating integration', error);
    res.status(500).json({ error: 'Failed to create integration' });
  }
});

export default router;
