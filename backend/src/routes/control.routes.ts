import express, { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../database/connection';
import logger from '../utils/logger';

const router = express.Router();

router.get('/:framework_id', async (req: Request, res: Response) => {
  try {
    const { framework_id } = req.params;
    const result = await query(
      'SELECT * FROM controls WHERE framework_id = $1 ORDER BY control_id',
      [framework_id]
    );
    res.json(result.rows);
  } catch (error) {
    logger.error('Error fetching controls', error);
    res.status(500).json({ error: 'Failed to fetch controls' });
  }
});

router.get('/assessments/:assessment_id', async (req: Request, res: Response) => {
  try {
    const { assessment_id } = req.params;
    const result = await query(
      `SELECT ca.*, c.name, c.control_id, c.description
       FROM control_assessments ca
       JOIN controls c ON ca.control_id = c.id
       WHERE ca.assessment_id = $1`,
      [assessment_id]
    );
    res.json(result.rows);
  } catch (error) {
    logger.error('Error fetching control assessments', error);
    res.status(500).json({ error: 'Failed to fetch control assessments' });
  }
});

router.post('/assessments', async (req: Request, res: Response) => {
  try {
    const {
      assessment_id,
      control_id,
      design_effectiveness,
      operating_effectiveness,
    } = req.body;

    if (!assessment_id || !control_id) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const control_assessment_id = uuidv4();
    const next_test_due = new Date();
    next_test_due.setDate(next_test_due.getDate() + 90);

    await query(
      `INSERT INTO control_assessments
       (id, assessment_id, control_id, design_effectiveness, operating_effectiveness, evidence_status, last_tested_at, next_test_due)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        control_assessment_id,
        assessment_id,
        control_id,
        design_effectiveness || 0,
        operating_effectiveness || 0,
        'MISSING',
        new Date(),
        next_test_due,
      ]
    );

    logger.info('Control assessment created', { control_assessment_id });
    res.status(201).json({ id: control_assessment_id });
  } catch (error) {
    logger.error('Error creating control assessment', error);
    res.status(500).json({ error: 'Failed to create control assessment' });
  }
});

export default router;
