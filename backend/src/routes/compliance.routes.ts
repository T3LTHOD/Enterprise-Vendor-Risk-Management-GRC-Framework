import express, { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../database/connection';
import logger from '../utils/logger';

const router = express.Router();

router.get('/frameworks', async (req: Request, res: Response) => {
  try {
    const result = await query(
      'SELECT * FROM compliance_frameworks WHERE is_active = TRUE ORDER BY name'
    );
    res.json(result.rows);
  } catch (error) {
    logger.error('Error fetching frameworks', error);
    res.status(500).json({ error: 'Failed to fetch frameworks' });
  }
});

router.get('/assessments/:org_id', async (req: Request, res: Response) => {
  try {
    const { org_id } = req.params;
    const result = await query(
      `SELECT a.*, cf.name as framework_name FROM assessments a
       JOIN compliance_frameworks cf ON a.framework_id = cf.id
       WHERE a.organization_id = $1
       ORDER BY a.created_at DESC`,
      [org_id]
    );
    res.json(result.rows);
  } catch (error) {
    logger.error('Error fetching assessments', error);
    res.status(500).json({ error: 'Failed to fetch assessments' });
  }
});

router.post('/assessments', async (req: Request, res: Response) => {
  try {
    const { organization_id, framework_id, assessment_type, created_by } = req.body;

    if (!organization_id || !framework_id || !assessment_type) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const assessment_id = uuidv4();
    await query(
      `INSERT INTO assessments (id, organization_id, framework_id, assessment_type, created_by)
       VALUES ($1, $2, $3, $4, $5)`,
      [assessment_id, organization_id, framework_id, assessment_type, created_by]
    );

    logger.info('Assessment created', { assessment_id, organization_id, framework_id });
    res.status(201).json({ id: assessment_id, status: 'IN_PROGRESS' });
  } catch (error) {
    logger.error('Error creating assessment', error);
    res.status(500).json({ error: 'Failed to create assessment' });
  }
});

router.get('/status/:org_id/:framework_id', async (req: Request, res: Response) => {
  try {
    const { org_id, framework_id } = req.params;
    const result = await query(
      `SELECT * FROM compliance_status 
       WHERE organization_id = $1 AND framework_id = $2
       ORDER BY status_as_of DESC LIMIT 1`,
      [org_id, framework_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Compliance status not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    logger.error('Error fetching compliance status', error);
    res.status(500).json({ error: 'Failed to fetch compliance status' });
  }
});

export default router;
