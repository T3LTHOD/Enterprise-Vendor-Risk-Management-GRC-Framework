import { Client } from 'pg';
import logger from '../utils/logger';

export const initializeTables = async (client: Client) => {
  const tables = [
    `CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email VARCHAR(255) UNIQUE NOT NULL,
      name VARCHAR(255) NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      role VARCHAR(50) NOT NULL,
      organization_id UUID NOT NULL,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS compliance_frameworks (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(100) NOT NULL,
      description TEXT,
      version VARCHAR(50),
      framework_type VARCHAR(50) NOT NULL,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS controls (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      control_id VARCHAR(100) NOT NULL,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      framework_id UUID REFERENCES compliance_frameworks(id),
      control_category VARCHAR(100),
      control_type VARCHAR(50),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS assessments (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      organization_id UUID NOT NULL,
      framework_id UUID REFERENCES compliance_frameworks(id),
      assessment_type VARCHAR(50),
      status VARCHAR(50) DEFAULT 'IN_PROGRESS',
      completion_percentage INT DEFAULT 0,
      started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      completed_at TIMESTAMP,
      created_by UUID REFERENCES users(id)
    )`,
    `CREATE TABLE IF NOT EXISTS control_assessments (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      assessment_id UUID REFERENCES assessments(id) ON DELETE CASCADE,
      control_id UUID REFERENCES controls(id),
      design_effectiveness INT,
      operating_effectiveness INT,
      evidence_status VARCHAR(50),
      last_tested_at TIMESTAMP,
      next_test_due TIMESTAMP,
      remediation_status VARCHAR(50),
      remediation_deadline TIMESTAMP,
      findings TEXT,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS evidence (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      control_assessment_id UUID REFERENCES control_assessments(id) ON DELETE CASCADE,
      evidence_type VARCHAR(100),
      evidence_name VARCHAR(255),
      file_url VARCHAR(500),
      file_hash VARCHAR(64),
      file_size INT,
      uploaded_by UUID REFERENCES users(id),
      uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      expiration_date TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS integrations (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      organization_id UUID NOT NULL,
      integration_type VARCHAR(100) NOT NULL,
      connection_name VARCHAR(255),
      api_key VARCHAR(500),
      is_active BOOLEAN DEFAULT TRUE,
      last_sync TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS control_test_results (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      control_id UUID REFERENCES controls(id),
      integration_id UUID REFERENCES integrations(id),
      test_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      test_status VARCHAR(50),
      evidence_collected_count INT,
      findings_count INT,
      test_result_details JSONB,
      remediation_recommended BOOLEAN
    )`,
    `CREATE TABLE IF NOT EXISTS compliance_status (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      organization_id UUID NOT NULL,
      framework_id UUID REFERENCES compliance_frameworks(id),
      total_controls INT,
      tested_controls INT,
      fully_effective_controls INT,
      partially_effective_controls INT,
      ineffective_controls INT,
      compliance_score INT,
      status_as_of TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS reports (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      organization_id UUID NOT NULL,
      report_type VARCHAR(100),
      framework_id UUID REFERENCES compliance_frameworks(id),
      generated_by UUID REFERENCES users(id),
      generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      report_data JSONB,
      file_url VARCHAR(500)
    )`,
    `CREATE TABLE IF NOT EXISTS audit_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      organization_id UUID NOT NULL,
      user_id UUID REFERENCES users(id),
      action VARCHAR(100),
      resource_type VARCHAR(100),
      resource_id VARCHAR(255),
      changes JSONB,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`
  ];

  for (const table of tables) {
    try {
      await client.query(table);
    } catch (error) {
      logger.error('Error creating table', { error });
    }
  }

  const indexes = [
    `CREATE INDEX IF NOT EXISTS idx_users_org ON users(organization_id)`,
    `CREATE INDEX IF NOT EXISTS idx_assessments_org ON assessments(organization_id)`,
    `CREATE INDEX IF NOT EXISTS idx_control_assessments_assessment ON control_assessments(assessment_id)`,
    `CREATE INDEX IF NOT EXISTS idx_evidence_control_assessment ON evidence(control_assessment_id)`,
    `CREATE INDEX IF NOT EXISTS idx_compliance_status_org ON compliance_status(organization_id)`,
    `CREATE INDEX IF NOT EXISTS idx_audit_logs_org ON audit_logs(organization_id)`,
  ];

  for (const index of indexes) {
    try {
      await client.query(index);
    } catch (error) {
      logger.error('Error creating index', { error });
    }
  }
};
