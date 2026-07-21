import express, { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../database/connection';
import logger from '../utils/logger';

const router = express.Router();

router.get('/:org_id', async (req: Request, res: Response) => {
  try {
    const { org_id } = req.params;
    const result = await query(
      'SELECT * FROM reports WHERE organization_id = $1 ORDER BY generated_at DESC',
      [org_id]
    );
    res.json(result.rows);
  } catch (error) {
    logger.error('Error fetching reports', error);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

router.post('/generate', async (req: Request, res: Response) => {
  try {
    const { organization_id, report_type, framework_id, generated_by } = req.body;

    if (!organization_id || !report_type || !framework_id) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const statusResult = await query(
      'SELECT * FROM compliance_status WHERE organization_id = $1 AND framework_id = $2',
      [organization_id, framework_id]
    );

    const report_id = uuidv4();
    const report_data = {
      report_type,
      framework_id,
      generated_at: new Date(),
      compliance_status: statusResult.rows[0] || {},
      audit_ready: true,
    };

    await query(
      `INSERT INTO reports (id, organization_id, report_type, framework_id, generated_by, report_data)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [report_id, organization_id, report_type, framework_id, generated_by, JSON.stringify(report_data)]
    );

    logger.info('Report generated', { report_id, report_type });
    res.status(201).json({ id: report_id, report_data });
  } catch (error) {
    logger.error('Error generating report', error);
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

export default router;
