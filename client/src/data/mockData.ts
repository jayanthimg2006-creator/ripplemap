/**
 * Realistic mock scenario for RippleMap: Corporate Data Retention Policy Update
 * Tagline: "One change. Every consequence."
 * Matches types defined in client/src/types/analysis.ts
 */

import {
  DocumentItem,
  DocumentChange,
  AnalysisResult,
  AnalysisRequest,
} from '../types/analysis';

export const samplePrimaryDocument: DocumentItem = {
  id: 'doc-retention-policy',
  title: 'Corporate Data Retention Policy',
  category: 'Legal & Compliance',
  updatedAt: '2026-11-01T09:00:00Z',
  content: `CORPORATE DATA RETENTION POLICY (v4.2)
Section 4.1 - Log and Activity Data Retention:
All user activity records, audit logs, and transaction telemetry must be stored in secure active cold storage for a maximum period of 30 days following generation, after which automated cryptographic purging is executed to comply with revised privacy regulations. Deprecated 90-day retention windows are strictly revoked across all cloud environments.`,
};

export const sampleChange: DocumentChange = {
  primaryDocumentId: 'doc-retention-policy',
  changeDescription:
    'Reduced customer log and audit telemetry retention from 90 days to 30 days for regulatory privacy compliance.',
  oldText:
    'All user activity records, audit logs, and transaction telemetry must be stored in secure active cold storage for a minimum period of 90 days following generation.',
  newText:
    'All user activity records, audit logs, and transaction telemetry must be stored in secure active cold storage for a maximum period of 30 days following generation, after which automated cryptographic purging is executed to comply with revised privacy regulations.',
};

export const sampleRelatedDocuments: DocumentItem[] = [
  {
    id: 'doc-terms-of-service',
    title: 'Customer Terms of Service',
    category: 'Customer Contracts',
    updatedAt: '2026-08-15T10:00:00Z',
    content: `CUSTOMER TERMS OF SERVICE
Section 9.3 - User Data Availability and History:
Customers retain uninterrupted access to detailed activity audit logs and session history via the web dashboard for up to 90 days from the event date. Account administrators may download historical compliance reports covering any timeframe within this 90-day window.`,
  },
  {
    id: 'doc-security-sla',
    title: 'Enterprise Security SLA',
    category: 'Security & SLAs',
    updatedAt: '2026-09-01T12:00:00Z',
    content: `ENTERPRISE SECURITY SERVICE LEVEL AGREEMENT
Section 3.2 - Incident Investigation and Forensics:
In the event of a suspected security incident or compliance audit inquiry, the Security Operations Center (SOC) guarantees forensic log retrieval covering a rolling 60-day lookback window for all enterprise tier accounts to substantiate root-cause analysis.`,
  },
  {
    id: 'doc-backup-runbook',
    title: 'Backup & Archival Operations Runbook',
    category: 'Engineering & DevOps',
    updatedAt: '2026-10-10T14:30:00Z',
    content: `ENGINEERING RUNBOOK: LOG ARCHIVAL AND BACKUP ROTATION
Procedure 12.4 - Cold Storage Rotation Schedule:
Automated lifecycle policies transfer log archives from S3 Standard to S3 Glacier at Day 30. Glacier archives are retained through Day 90, after which lifecycle expiration rules trigger permanent deletion across all regions.`,
  },
  {
    id: 'doc-billing-guide',
    title: 'Billing Reconciliation & Audit Guide',
    category: 'Finance & Operations',
    updatedAt: '2026-07-20T08:00:00Z',
    content: `BILLING DISPUTES AND RECONCILIATION GUIDE
Section 2.1 - Usage Invoicing Disputes:
Customer usage disputes regarding API bandwidth and compute units must reference transaction telemetry from the preceding quarterly billing cycle (up to 90 days prior). Inquiries without supporting event logs cannot be credited.`,
  },
];

export const sampleAnalysisRequest: AnalysisRequest = {
  primaryDocument: samplePrimaryDocument,
  change: sampleChange,
  relatedDocuments: sampleRelatedDocuments,
};

export const sampleAnalysisResult: AnalysisResult = {
  summary:
    'Reducing the data retention window from 90 to 30 days creates critical downstream contractual breaches and operational discrepancies across 4 documents. Most critically, Customer Terms of Service promise 90 days of log access, and the Security SLA guarantees a 60-day forensic lookback.',
  overallSeverity: 'high',
  impacts: [
    {
      documentId: 'doc-terms-of-service',
      documentTitle: 'Customer Terms of Service',
      severity: 'high',
      impactSummary:
        'Direct contractual breach: Customers are promised 90 days of dashboard log access, but data will be purged at 30 days.',
      affectedSections: ['Section 9.3 - User Data Availability and History'],
    },
    {
      documentId: 'doc-security-sla',
      documentTitle: 'Enterprise Security SLA',
      severity: 'high',
      impactSummary:
        'SLA non-compliance: The Security Operations Center will be unable to fulfill the guaranteed rolling 60-day forensic investigation window.',
      affectedSections: ['Section 3.2 - Incident Investigation and Forensics'],
    },
    {
      documentId: 'doc-backup-runbook',
      documentTitle: 'Backup & Archival Operations Runbook',
      severity: 'medium',
      impactSummary:
        'Operational misalignment: S3 Glacier lifecycle policies continue storing logs until Day 90, directly violating the new 30-day maximum retention mandate.',
      affectedSections: ['Procedure 12.4 - Cold Storage Rotation Schedule'],
    },
    {
      documentId: 'doc-billing-guide',
      documentTitle: 'Billing Reconciliation & Audit Guide',
      severity: 'low',
      impactSummary:
        'Procedural friction: The 90-day dispute window assumes access to quarterly telemetry that will no longer exist after Day 30.',
      affectedSections: ['Section 2.1 - Usage Invoicing Disputes'],
    },
  ],
  conflicts: [
    {
      documentId: 'doc-terms-of-service',
      documentTitle: 'Customer Terms of Service',
      conflictingText:
        'Customers retain uninterrupted access to detailed activity audit logs and session history via the web dashboard for up to 90 days from the event date.',
      sourceText:
        'stored in secure active cold storage for a maximum period of 30 days following generation, after which automated cryptographic purging is executed',
      reason:
        'Dashboard users cannot access logs up to 90 days if automated purging deletes all telemetry at 30 days.',
    },
    {
      documentId: 'doc-security-sla',
      documentTitle: 'Enterprise Security SLA',
      conflictingText:
        'guarantees forensic log retrieval covering a rolling 60-day lookback window for all enterprise tier accounts',
      sourceText:
        'maximum period of 30 days following generation... Deprecated 90-day retention windows are strictly revoked',
      reason:
        'A 60-day forensic investigation window cannot be honored when records older than 30 days are permanently erased.',
    },
    {
      documentId: 'doc-backup-runbook',
      documentTitle: 'Backup & Archival Operations Runbook',
      conflictingText:
        'Glacier archives are retained through Day 90, after which lifecycle expiration rules trigger permanent deletion',
      sourceText:
        'maximum period of 30 days following generation... Deprecated 90-day retention windows are strictly revoked',
      reason:
        'DevOps lifecycle rules retain backups in AWS Glacier 60 days past the mandatory 30-day compliance cut-off.',
    },
    {
      documentId: 'doc-billing-guide',
      documentTitle: 'Billing Reconciliation & Audit Guide',
      conflictingText:
        'must reference transaction telemetry from the preceding quarterly billing cycle (up to 90 days prior)',
      sourceText:
        'stored in secure active cold storage for a maximum period of 30 days',
      reason:
        'Finance requires 90 days of transaction telemetry for quarterly disputes, which conflicts with the 30-day purge schedule.',
    },
  ],
  suggestions: [
    {
      documentId: 'doc-terms-of-service',
      documentTitle: 'Customer Terms of Service',
      originalSectionText:
        'Customers retain uninterrupted access to detailed activity audit logs and session history via the web dashboard for up to 90 days from the event date. Account administrators may download historical compliance reports covering any timeframe within this 90-day window.',
      suggestedText:
        'Customers retain uninterrupted access to detailed activity audit logs and session history via the web dashboard for up to 30 days from the event date. Account administrators requiring longer retention may configure automated weekly log exports to their own external cloud storage.',
      rationale:
        'Aligns customer dashboard expectations with the 30-day privacy purge while providing an external export solution for enterprise customers.',
      evidence:
        'Corporate Data Retention Policy Section 4.1 mandates cryptographic purging after 30 days.',
    },
    {
      documentId: 'doc-security-sla',
      documentTitle: 'Enterprise Security SLA',
      originalSectionText:
        'In the event of a suspected security incident or compliance audit inquiry, the Security Operations Center (SOC) guarantees forensic log retrieval covering a rolling 60-day lookback window for all enterprise tier accounts to substantiate root-cause analysis.',
      suggestedText:
        'In the event of a suspected security incident or compliance audit inquiry, the Security Operations Center (SOC) guarantees forensic log retrieval covering a rolling 30-day lookback window for all enterprise tier accounts, supplemented by anonymized security telemetry digests.',
      rationale:
        'Prevents breach of SLA terms by adjusting the lookback commitment to match the true data availability window.',
      evidence:
        'Telemetry is permanently erased at Day 30; longer lookbacks are physically and legally unfulfillable.',
    },
    {
      documentId: 'doc-backup-runbook',
      documentTitle: 'Backup & Archival Operations Runbook',
      originalSectionText:
        'Automated lifecycle policies transfer log archives from S3 Standard to S3 Glacier at Day 30. Glacier archives are retained through Day 90, after which lifecycle expiration rules trigger permanent deletion across all regions.',
      suggestedText:
        'Automated lifecycle policies transfer log archives from S3 Standard to S3 Glacier at Day 7. Glacier archives trigger automated cryptographic deletion at Day 30 across all production regions.',
      rationale:
        'Enforces the 30-day compliance rule at the cloud infrastructure tier to avoid regulatory penalties.',
      evidence:
        'Section 4.1 specifically revokes deprecated 90-day retention windows across all cloud storage environments.',
    },
    {
      documentId: 'doc-billing-guide',
      documentTitle: 'Billing Reconciliation & Audit Guide',
      originalSectionText:
        'Customer usage disputes regarding API bandwidth and compute units must reference transaction telemetry from the preceding quarterly billing cycle (up to 90 days prior). Inquiries without supporting event logs cannot be credited.',
      suggestedText:
        'Customer usage disputes regarding API bandwidth and compute units must be submitted within 30 days of invoice receipt, referencing transaction telemetry from the current billing cycle. Inquiries after 30 days cannot be reconciled against raw telemetry.',
      rationale:
        'Shortens the dispute filing window to match data availability, preventing unresolved billing disputes.',
      evidence:
        'Raw transaction telemetry is deleted on a rolling 30-day cycle pursuant to Section 4.1.',
    },
  ],
  analyzedAt: '2026-11-04T16:30:00.000Z',
};
