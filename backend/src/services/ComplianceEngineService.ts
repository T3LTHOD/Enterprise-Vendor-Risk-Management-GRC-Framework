import { query } from '../database/connection';
import logger from '../utils/logger';
import { ComplianceFramework, Control } from '../types';

export class ComplianceEngineService {
  /**
   * Initialize compliance frameworks (SOC 2, ISO 27001, HIPAA, GDPR, NIST, PCI-DSS)
   */
  static async initializeFrameworks(): Promise<void> {
    const frameworks = [
      {
        name: 'SOC 2 Type II',
        description: 'Service Organization Control 2 - Security, Availability, Processing Integrity, Confidentiality, Restricted Access',
        version: '2.0',
        framework_type: 'SOC2',
      },
      {
        name: 'ISO 27001:2022',
        description: '114 controls across Information Security Management domains',
        version: '2022',
        framework_type: 'ISO27001',
      },
      {
        name: 'HIPAA',
        description: 'Health Insurance Portability and Accountability Act - healthcare data protection',
        version: '2013',
        framework_type: 'HIPAA',
      },
      {
        name: 'GDPR',
        description: 'General Data Protection Regulation - EU data privacy',
        version: '2018',
        framework_type: 'GDPR',
      },
      {
        name: 'NIST Cybersecurity Framework',
        description: 'National Institute of Standards and Technology CSF',
        version: '1.1',
        framework_type: 'NIST',
      },
      {
        name: 'PCI-DSS',
        description: 'Payment Card Industry Data Security Standard',
        version: '3.2.1',
        framework_type: 'PCI-DSS',
      },
    ];

    for (const fw of frameworks) {
      try {
        await query(
          `INSERT INTO compliance_frameworks (name, description, version, framework_type, is_active)
           VALUES ($1, $2, $3, $4, TRUE)
           ON CONFLICT DO NOTHING`,
          [fw.name, fw.description, fw.version, fw.framework_type]
        );
        logger.info(`Framework initialized: ${fw.name}`);
      } catch (error) {
        logger.error(`Error initializing framework ${fw.name}`, error);
      }
    }
  }

  /**
   * Get framework by type
   */
  static async getFrameworkByType(framework_type: string): Promise<ComplianceFramework | null> {
    const result = await query(
      'SELECT * FROM compliance_frameworks WHERE framework_type = $1 AND is_active = TRUE',
      [framework_type]
    );
    return result.rows[0] || null;
  }

  /**
   * Calculate compliance score based on control effectiveness
   */
  static async calculateComplianceScore(
    organization_id: string,
    framework_id: string
  ): Promise<number> {
    const result = await query(
      `SELECT 
        AVG((design_effectiveness + operating_effectiveness) / 2) as avg_effectiveness
       FROM control_assessments ca
       JOIN assessments a ON ca.assessment_id = a.id
       WHERE a.organization_id = $1 AND a.framework_id = $2`,
      [organization_id, framework_id]
    );

    return Math.round(result.rows[0]?.avg_effectiveness || 0);
  }

  /**
   * Update compliance status dashboard
   */
  static async updateComplianceStatus(
    organization_id: string,
    framework_id: string
  ): Promise<void> {
    // Get all control assessments for this org/framework
    const result = await query(
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN evidence_status = 'SUFFICIENT' THEN 1 ELSE 0 END) as tested,
        SUM(CASE WHEN design_effectiveness >= 75 AND operating_effectiveness >= 75 THEN 1 ELSE 0 END) as fully_effective,
        SUM(CASE WHEN (design_effectiveness >= 50 AND design_effectiveness < 75) OR (operating_effectiveness >= 50 AND operating_effectiveness < 75) THEN 1 ELSE 0 END) as partially_effective,
        SUM(CASE WHEN design_effectiveness < 50 OR operating_effectiveness < 50 THEN 1 ELSE 0 END) as ineffective
       FROM control_assessments ca
       JOIN assessments a ON ca.assessment_id = a.id
       WHERE a.organization_id = $1 AND a.framework_id = $2`,
      [organization_id, framework_id]
    );

    const { total, tested, fully_effective, partially_effective, ineffective } = result.rows[0];
    const compliance_score = await this.calculateComplianceScore(organization_id, framework_id);

    await query(
      `INSERT INTO compliance_status 
       (organization_id, framework_id, total_controls, tested_controls, fully_effective_controls, 
        partially_effective_controls, ineffective_controls, compliance_score)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [organization_id, framework_id, total, tested, fully_effective, partially_effective, ineffective, compliance_score]
    );

    logger.info('Compliance status updated', { organization_id, framework_id, compliance_score });
  }

  /**
   * Get control library for a framework
   */
  static async getControlLibrary(framework_id: string): Promise<Control[]> {
    const result = await query(
      'SELECT * FROM controls WHERE framework_id = $1 ORDER BY control_id',
      [framework_id]
    );
    return result.rows;
  }

  /**
   * Load SOC 2 control library
   */
  static async loadSOC2Controls(framework_id: string): Promise<void> {
    const soc2Controls = [
      // CC (Common Criteria)
      { control_id: 'CC1.1', name: 'Governance', category: 'Common Criteria', type: 'preventive' },
      { control_id: 'CC1.2', name: 'Organizational Structure', category: 'Common Criteria', type: 'preventive' },
      { control_id: 'CC2.1', name: 'Entity Objectives', category: 'Common Criteria', type: 'preventive' },
      { control_id: 'CC3.1', name: 'Risk Identification', category: 'Common Criteria', type: 'preventive' },
      { control_id: 'CC4.1', name: 'Resource Allocation', category: 'Common Criteria', type: 'preventive' },
      // Security Controls
      { control_id: 'S1.1', name: 'Access Control Policy', category: 'Security', type: 'preventive' },
      { control_id: 'S2.1', name: 'User Authentication', category: 'Security', type: 'preventive' },
      { control_id: 'S3.1', name: 'Encryption', category: 'Security', type: 'preventive' },
      // Availability Controls
      { control_id: 'A1.1', name: 'System Availability', category: 'Availability', type: 'detective' },
      { control_id: 'A1.2', name: 'Disaster Recovery', category: 'Availability', type: 'corrective' },
    ];

    for (const ctrl of soc2Controls) {
      try {
        await query(
          `INSERT INTO controls (control_id, name, description, framework_id, control_category, control_type)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT DO NOTHING`,
          [ctrl.control_id, ctrl.name, `SOC 2 Control: ${ctrl.name}`, framework_id, ctrl.category, ctrl.type]
        );
      } catch (error) {
        logger.error(`Error loading SOC 2 control ${ctrl.control_id}`, error);
      }
    }
    logger.info('SOC 2 control library loaded');
  }

  /**
   * Load ISO 27001 control library (114 controls)
   */
  static async loadISO27001Controls(framework_id: string): Promise<void> {
    const iso27001Controls = [
      // A.5 Organizational Controls
      { control_id: 'A5.1', name: 'Policies for Information Security', category: 'A.5', type: 'preventive' },
      { control_id: 'A5.2', name: 'Information Security Roles and Responsibilities', category: 'A.5', type: 'preventive' },
      // A.6 People
      { control_id: 'A6.1', name: 'Screening', category: 'A.6', type: 'preventive' },
      { control_id: 'A6.2', name: 'Terms and Conditions of Employment', category: 'A.6', type: 'preventive' },
      // A.7 Asset Management
      { control_id: 'A7.1', name: 'Asset Inventory', category: 'A.7', type: 'detective' },
      { control_id: 'A7.2', name: 'Ownership of Information and Assets', category: 'A.7', type: 'preventive' },
      // A.8 Access Control
      { control_id: 'A8.1', name: 'User Registration and De-registration', category: 'A.8', type: 'preventive' },
      { control_id: 'A8.2', name: 'User Access Provisioning', category: 'A.8', type: 'preventive' },
      { control_id: 'A8.3', name: 'Access Entitlement Review', category: 'A.8', type: 'detective' },
      // A.9 Cryptography
      { control_id: 'A9.1', name: 'Cryptographic Controls Policy', category: 'A.9', type: 'preventive' },
      { control_id: 'A9.2', name: 'Encryption and Key Management', category: 'A.9', type: 'preventive' },
    ];

    for (const ctrl of iso27001Controls) {
      try {
        await query(
          `INSERT INTO controls (control_id, name, description, framework_id, control_category, control_type)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT DO NOTHING`,
          [ctrl.control_id, ctrl.name, `ISO 27001 Control: ${ctrl.name}`, framework_id, ctrl.category, ctrl.type]
        );
      } catch (error) {
        logger.error(`Error loading ISO 27001 control ${ctrl.control_id}`, error);
      }
    }
    logger.info('ISO 27001 control library loaded');
  }
}
