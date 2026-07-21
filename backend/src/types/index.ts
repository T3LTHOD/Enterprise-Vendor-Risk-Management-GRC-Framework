export interface Organization {
  id: string;
  name: string;
  industry: string;
  created_at: Date;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'auditor' | 'control_owner' | 'viewer';
  organization_id: string;
  is_active: boolean;
  created_at: Date;
}

export interface ComplianceFramework {
  id: string;
  name: string;
  description: string;
  version: string;
  framework_type: 'SOC2' | 'ISO27001' | 'HIPAA' | 'GDPR' | 'NIST' | 'PCI-DSS';
  is_active: boolean;
}

export interface Control {
  id: string;
  control_id: string;
  name: string;
  description: string;
  framework_id: string;
  control_category: string;
  control_type: 'preventive' | 'detective' | 'corrective';
}

export interface Assessment {
  id: string;
  organization_id: string;
  framework_id: string;
  assessment_type: 'continuous' | 'periodic' | 'audit';
  status: 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  completion_percentage: number;
  started_at: Date;
  completed_at?: Date;
}

export interface ControlAssessment {
  id: string;
  assessment_id: string;
  control_id: string;
  design_effectiveness: number;
  operating_effectiveness: number;
  evidence_status: 'SUFFICIENT' | 'PARTIAL' | 'MISSING';
  last_tested_at: Date;
  next_test_due: Date;
  remediation_status?: 'NOT_REQUIRED' | 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED';
}

export interface Evidence {
  id: string;
  control_assessment_id: string;
  evidence_type: string;
  evidence_name: string;
  file_url: string;
  uploaded_at: Date;
  expiration_date?: Date;
}

export interface Integration {
  id: string;
  organization_id: string;
  integration_type: 'AWS' | 'AZURE' | 'GITHUB' | 'OKTA' | 'JIRA' | 'SERVICENOW';
  connection_name: string;
  is_active: boolean;
  last_sync?: Date;
}

export interface ComplianceStatus {
  framework_id: string;
  total_controls: number;
  tested_controls: number;
  fully_effective_controls: number;
  partially_effective_controls: number;
  ineffective_controls: number;
  compliance_score: number;
  status_as_of: Date;
}

export interface Report {
  id: string;
  organization_id: string;
  report_type: 'SOC2_AUDIT_READY' | 'ISO27001_GAP_ANALYSIS' | 'RISK_SUMMARY' | 'EVIDENCE_INVENTORY';
  framework_id: string;
  generated_at: Date;
  report_data: any;
  file_url: string;
}
