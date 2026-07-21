# Enterprise GRC Compliance Engine - Architecture

## Overview

This is a **cloud-native, scalable GRC platform** for SOC 2, ISO 27001, HIPAA, GDPR, NIST CSF, and PCI-DSS compliance.

## System Architecture

```
┌─────────────────────────────────────────────────────────┐
│               Frontend (React + Tailwind)               │
│  • Compliance Dashboard  • Real-time Monitoring         │
│  • Report Generation                                    │
└────────────────────┬────────────────────────────────────┘
                     │ REST API / WebSocket
                     ▼
┌─────────────────────────────────────────────────────────┐
│          Backend (Node.js + Express + TypeScript)       │
│  ┌──────────────────────────────────────────────────┐   │
│  │  API Routes (Auth, Compliance, Controls, Reports)   │
│  └──────────────────────────────────────────────────┘   │
└─────────┬──────────────────────────────────────┬─────────┘
          │                                      │
          ▼                                      ▼
┌──────────────────┐              ┌─────────────────────┐
│  PostgreSQL DB   │              │  Integration Layer  │
│  • Framework     │              │  • AWS / Azure      │
│  • Controls      │              │  • GitHub / Okta    │
│  • Assessments   │              │  • ServiceNow       │
│  • Evidence      │              │  • Jira / Slack     │
└──────────────────┘              └─────────────────────┘
```

## Key Components

### 1. **Compliance Framework Engine**
- Manages SOC 2, ISO 27001, HIPAA, GDPR, NIST CSF, PCI-DSS
- Pre-built control mappings
- Auto-calculated compliance scores

### 2. **Control Assessment Service**
- Automated control testing
- Evidence collection & validation
- Risk scoring (Inherent → Control → Residual)
- Quarterly/continuous testing workflows

### 3. **Integration Adapters**
- AWS: Security Hub, Config, IAM, CloudTrail
- Azure: Security Center, Policy, Defender
- GitHub: Repository security, code scanning
- Okta: Identity & access management
- ServiceNow: ITSM, incident management
- Jira: Remediation tracking

### 4. **Report Generation Engine**
- SOC 2 Type II Audit Ready
- ISO 27001 Gap Analysis
- Real-time compliance dashboards
- Evidence inventory

### 5. **Real-time Monitoring**
- Continuous control testing
- Alert thresholds
- Remediation deadline tracking
- Evidence expiration alerts

## Database Schema

Key tables: compliance_frameworks, controls, assessments, control_assessments, evidence, control_test_results, integrations, compliance_status, reports, audit_logs

## Security

✅ Audit Logging  ✅ Role-Based Access Control  ✅ Data Encryption  ✅ SOC 2 Aligned  ✅ Multi-tenancy
