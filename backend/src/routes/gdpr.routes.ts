import express, { Request, Response } from 'express';
import { GDPRComplianceService } from '../services/GDPRComplianceService';
import { AlertingService } from '../services/AlertingService';
import logger from '../utils/logger';

const router = express.Router();

// GET /api/gdpr/status/:org_id
router.get('/status/:org_id', async (req: Request, res: Response) => {
  try {
    const { org_id } = req.params;
    const framework_id = req.query.framework_id as string;

    if (!framework_id) {
      return res.status(400).json({ error: 'framework_id required' });
    }

    const score = await GDPRComplianceService.calculateGDPRComplianceScore(org_id, framework_id);

    res.json({
      compliance_score: score,
      framework: 'GDPR',
      status: score >= 75 ? 'COMPLIANT' : 'NON_COMPLIANT',
      last_updated: new Date(),
    });
  } catch (error) {
    logger.error('Error fetching GDPR status', error);
    res.status(500).json({ error: 'Failed to fetch GDPR status' });
  }
});

// POST /api/gdpr/detect-personal-data
router.post('/detect-personal-data', async (req: Request, res: Response) => {
  try {
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'content required' });
    }

    const detection = await GDPRComplianceService.detectPersonalData(content);

    if (detection.personal_data_detected && detection.data_categories.length > 3) {
      // Alert on high-risk personal data detection
      await AlertingService.sendSlackAlert(process.env.SLACK_WEBHOOK_URL || '', {
        title: '⚠️ Personal Data Detected (GDPR)',
        message: `Multiple personal data categories detected: ${detection.data_categories.join(', ')}. Ensure lawful basis for processing.`,
        severity: 'HIGH',
        organization_id: req.body.organization_id || 'unknown',
      });
    }

    res.json(detection);
  } catch (error) {
    logger.error('Error detecting personal data', error);
    res.status(500).json({ error: 'Failed to detect personal data' });
  }
});

// POST /api/gdpr/create-dpa
router.post('/create-dpa', async (req: Request, res: Response) => {
  try {
    const { organization_id, processor_name, data_categories, processing_purposes } = req.body;

    if (!organization_id || !processor_name) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const dpa = await GDPRComplianceService.createDataProcessingAgreement(
      organization_id,
      processor_name,
      data_categories || [],
      processing_purposes || []
    );

    res.status(201).json({
      status: 'created',
      dpa_document: dpa,
      message: 'DPA created per GDPR Article 28. Both parties must sign before data processing begins.',
    });
  } catch (error) {
    logger.error('Error creating DPA', error);
    res.status(500).json({ error: 'Failed to create DPA' });
  }
});

// POST /api/gdpr/create-dpia
router.post('/create-dpia', async (req: Request, res: Response) => {
  try {
    const { organization_id, processing_name, data_categories, risk_assessment } = req.body;

    if (!organization_id || !processing_name) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const dpia_id = await GDPRComplianceService.createDPIA(
      organization_id,
      processing_name,
      data_categories || [],
      risk_assessment
    );

    res.status(201).json({
      dpia_id,
      status: 'created',
      message: 'DPIA created per GDPR Article 35. High-risk processing requires prior consultation with supervisory authority.',
    });
  } catch (error) {
    logger.error('Error creating DPIA', error);
    res.status(500).json({ error: 'Failed to create DPIA' });
  }
});

// POST /api/gdpr/dsar (Data Subject Access Request)
router.post('/dsar', async (req: Request, res: Response) => {
  try {
    const { organization_id, data_subject_id, request_type, data_requested } = req.body;

    if (!organization_id || !data_subject_id || !request_type) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const dsar_id = await GDPRComplianceService.handleDataSubjectAccessRequest(
      organization_id,
      data_subject_id,
      request_type,
      data_requested || []
    );

    res.status(201).json({
      dsar_id,
      request_type,
      status: 'received',
      response_deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      message: 'Data subject request received. Must respond within 30 days per GDPR Article 12.',
    });
  } catch (error) {
    logger.error('Error handling DSAR', error);
    res.status(500).json({ error: 'Failed to handle DSAR' });
  }
});

// POST /api/gdpr/right-to-be-forgotten
router.post('/right-to-be-forgotten', async (req: Request, res: Response) => {
  try {
    const { organization_id, data_subject_id, reason } = req.body;

    if (!organization_id || !data_subject_id) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    await GDPRComplianceService.rightToBeForgotten(organization_id, data_subject_id, reason);

    await AlertingService.sendSlackAlert(process.env.SLACK_WEBHOOK_URL || '', {
      title: '🗑️ Right to be Forgotten Executed',
      message: `Personal data for subject ${data_subject_id} has been erased per GDPR Article 17.`,
      severity: 'MEDIUM',
      organization_id,
    });

    res.json({
      status: 'executed',
      data_subject_id,
      message: 'Right to be forgotten processed. Personal data erased.',
    });
  } catch (error) {
    logger.error('Error processing right to be forgotten', error);
    res.status(500).json({ error: 'Failed to process right to be forgotten' });
  }
});

// POST /api/gdpr/log-consent
router.post('/log-consent', async (req: Request, res: Response) => {
  try {
    const { organization_id, data_subject_id, consent_type, consent_text, ip_address } = req.body;

    if (!organization_id || !data_subject_id || !consent_type) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    await GDPRComplianceService.logConsent(
      organization_id,
      data_subject_id,
      consent_type,
      consent_text,
      ip_address
    );

    res.status(201).json({
      status: 'logged',
      consent_type,
      timestamp: new Date(),
      message: 'Consent logged per GDPR Article 7.',
    });
  } catch (error) {
    logger.error('Error logging consent', error);
    res.status(500).json({ error: 'Failed to log consent' });
  }
});

// POST /api/gdpr/report-breach
router.post('/report-breach', async (req: Request, res: Response) => {
  try {
    const { organization_id, breach_date, discovery_date, affected_data_subjects, data_categories, breach_description } = req.body;

    if (!organization_id || !breach_date || !discovery_date) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const report_id = await GDPRComplianceService.createDataBreachReport(
      organization_id,
      new Date(breach_date),
      new Date(discovery_date),
      affected_data_subjects,
      data_categories || [],
      breach_description
    );

    // Send critical alert
    await AlertingService.sendSlackAlert(process.env.SLACK_WEBHOOK_URL || '', {
      title: '🚨 GDPR Data Breach Reported',
      message: `Data breach affecting ${affected_data_subjects} data subjects. Report ID: ${report_id}. Supervisory authority notification due within 72 hours.`,
      severity: 'CRITICAL',
      organization_id,
    });

    res.status(201).json({
      report_id,
      status: 'reported',
      authority_notification_deadline: new Date(new Date(discovery_date).getTime() + 72 * 60 * 60 * 1000),
      message: 'Breach reported. Must notify supervisory authority within 72 hours and affected individuals without undue delay.',
    });
  } catch (error) {
    logger.error('Error reporting breach', error);
    res.status(500).json({ error: 'Failed to report breach' });
  }
});

export default router;
