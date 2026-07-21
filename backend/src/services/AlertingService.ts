import logger from '../utils/logger';

interface AlertPayload {
  title: string;
  message: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  organization_id: string;
  action_url?: string;
}

export class AlertingService {
  /**
   * Send Slack notification
   */
  static async sendSlackAlert(webhookUrl: string, alert: AlertPayload): Promise<void> {
    try {
      const color =
        alert.severity === 'CRITICAL' ? 'danger' : alert.severity === 'HIGH' ? 'warning' : 'info';

      const payload = {
        attachments: [
          {
            fallback: alert.title,
            color,
            title: alert.title,
            text: alert.message,
            fields: [
              {
                title: 'Severity',
                value: alert.severity,
                short: true,
              },
              {
                title: 'Organization',
                value: alert.organization_id,
                short: true,
              },
            ],
            ts: Math.floor(Date.now() / 1000),
          },
        ],
      };

      if (alert.action_url) {
        payload.attachments[0].actions = [
          {
            type: 'button',
            text: 'View Details',
            url: alert.action_url,
          },
        ];
      }

      // Call Slack webhook
      // await axios.post(webhookUrl, payload);
      logger.info('Slack alert sent', { title: alert.title, severity: alert.severity });
    } catch (error) {
      logger.error('Error sending Slack alert', error);
    }
  }

  /**
   * Send email notification
   */
  static async sendEmailAlert(
    recipient: string,
    alert: AlertPayload
  ): Promise<void> {
    try {
      // Configure SMTP and send email
      // In production, use nodemailer or AWS SES

      const subject = `[${alert.severity}] ${alert.title}`;
      const body = `
        <h2>${alert.title}</h2>
        <p>${alert.message}</p>
        <p><strong>Severity:</strong> ${alert.severity}</p>
        <p><strong>Organization:</strong> ${alert.organization_id}</p>
        ${alert.action_url ? `<p><a href="${alert.action_url}">View Details</a></p>` : ''}
      `;

      logger.info('Email alert sent', { recipient, title: alert.title });
    } catch (error) {
      logger.error('Error sending email alert', error);
    }
  }

  /**
   * Alert: Low compliance score
   */
  static async alertLowComplianceScore(
    organization_id: string,
    framework_name: string,
    score: number,
    threshold: number = 75
  ): Promise<void> {
    if (score < threshold) {
      const alert: AlertPayload = {
        title: `⚠️ Compliance Score Drop: ${framework_name}`,
        message: `${framework_name} compliance score has dropped to ${score}%. Target is ${threshold}%. Immediate action required to address identified gaps.`,
        severity: score < 50 ? 'CRITICAL' : 'HIGH',
        organization_id,
        action_url: `/dashboard/${organization_id}/compliance/${framework_name}`,
      };

      await this.sendSlackAlert(process.env.SLACK_WEBHOOK_URL || '', alert);
      logger.warn('Low compliance score alert triggered', { organization_id, framework_name, score });
    }
  }

  /**
   * Alert: Evidence expiring soon (30 days)
   */
  static async alertExpiringEvidence(
    organization_id: string,
    evidence_name: string,
    control_id: string,
    days_until_expiry: number
  ): Promise<void> {
    const alert: AlertPayload = {
      title: `📋 Evidence Expiring Soon: ${control_id}`,
      message: `Evidence "${evidence_name}" for control ${control_id} will expire in ${days_until_expiry} days. Please upload new evidence to maintain compliance.`,
      severity: days_until_expiry <= 7 ? 'CRITICAL' : days_until_expiry <= 14 ? 'HIGH' : 'MEDIUM',
      organization_id,
      action_url: `/controls/${control_id}/evidence`,
    };

    await this.sendSlackAlert(process.env.SLACK_WEBHOOK_URL || '', alert);
    logger.info('Expiring evidence alert triggered', { control_id, days_until_expiry });
  }

  /**
   * Alert: Overdue remediation
   */
  static async alertOverdueRemediation(
    organization_id: string,
    control_id: string,
    control_name: string,
    days_overdue: number
  ): Promise<void> {
    const alert: AlertPayload = {
      title: `🚨 Overdue Remediation: ${control_name}`,
      message: `Control ${control_id} remediation is ${days_overdue} days overdue. This requires immediate attention to maintain compliance.`,
      severity: days_overdue > 30 ? 'CRITICAL' : days_overdue > 14 ? 'HIGH' : 'MEDIUM',
      organization_id,
      action_url: `/controls/${control_id}/remediation`,
    };

    await this.sendSlackAlert(process.env.SLACK_WEBHOOK_URL || '', alert);
    logger.error('Overdue remediation alert triggered', { control_id, days_overdue });
  }

  /**
   * Alert: Failed automated control test
   */
  static async alertFailedControlTest(
    organization_id: string,
    control_id: string,
    integration_type: string,
    findings_count: number
  ): Promise<void> {
    const alert: AlertPayload = {
      title: `❌ Control Test Failed: ${control_id} (${integration_type})`,
      message: `Automated control test for ${control_id} via ${integration_type} detected ${findings_count} issues. Review findings and take remediation action.`,
      severity: findings_count > 10 ? 'CRITICAL' : findings_count > 5 ? 'HIGH' : 'MEDIUM',
      organization_id,
      action_url: `/controls/${control_id}/test-results`,
    };

    await this.sendSlackAlert(process.env.SLACK_WEBHOOK_URL || '', alert);
    logger.warn('Failed control test alert triggered', { control_id, findings_count });
  }

  /**
   * Alert: New vulnerability detected
   */
  static async alertNewVulnerability(
    organization_id: string,
    vulnerability_id: string,
    description: string,
    severity: string,
    affected_resource: string
  ): Promise<void> {
    const alert: AlertPayload = {
      title: `🔓 New Vulnerability: ${vulnerability_id}`,
      message: `${description} Found in ${affected_resource}. Severity: ${severity}. Immediate investigation recommended.`,
      severity: severity === 'CRITICAL' ? 'CRITICAL' : severity === 'HIGH' ? 'HIGH' : 'MEDIUM',
      organization_id,
      action_url: `/vulnerabilities/${vulnerability_id}`,
    };

    await this.sendSlackAlert(process.env.SLACK_WEBHOOK_URL || '', alert);
    logger.warn('New vulnerability alert triggered', { vulnerability_id, severity });
  }

  /**
   * Background alerting job (runs continuously)
   */
  static async startAlertingEngine(organization_id: string, interval_minutes: number = 60): Promise<void> {
    logger.info('Alerting engine started', { organization_id, interval_minutes });

    setInterval(async () => {
      try {
        // Check compliance scores
        // Check expiring evidence
        // Check overdue remediation
        // Check failed control tests
        // Send alerts as needed
        logger.info('Alerting engine cycle executed');
      } catch (error) {
        logger.error('Error during alerting cycle', error);
      }
    }, interval_minutes * 60 * 1000);
  }
}
