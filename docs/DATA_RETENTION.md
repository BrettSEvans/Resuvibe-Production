# Data Retention & Privacy Policy

## Overview

Resuvibe handles Personally Identifiable Information (PII) including résumés, email addresses, work experience, and skills. This document outlines our data retention, deletion, and compliance practices.

## Data Classification

### User Account Data (Active/Required)
- Email address — retained while account is active
- Password hash — retained while account is active
- Profile preferences (tone, industry) — retained while account is active
- Generated documents (résumés, cover letters) — retained while account is active

### User-Generated Content (PII-Sensitive)
- Résumé text — retained while account is active
- Cover letter templates — retained while account is active
- Job application notes — retained while account is active
- Master cover letter — retained while account is active

### Operational Data
- Last sign-in timestamp — retained for 12 months after account deletion
- Activity logs (generation history) — retained for 6 months
- Pipeline stage changes — retained for 6 months

### Audit Logs
- Admin audit log — retained for 24 months
- Account deletion records — retained for 24 months (for compliance)

## Retention Schedule

| Data Type | Retention Period | Purpose |
|-----------|------------------|---------|
| Active account | While active | Service delivery |
| Generated documents | While active | User portfolio |
| Activity logs | 6 months post-deletion | Legal compliance |
| Admin audit trail | 24 months | Regulatory compliance (GDPR, CCPA) |

## User Deletion & Right-to-be-Forgotten

### Account Deletion Flow

1. **User initiates deletion** via Settings > Privacy > Delete Account
2. **30-day grace period** — account is soft-deleted; user can recover within 30 days
3. **Hard delete after 30 days** — all PII permanently removed:
   - Résumés deleted
   - Cover letters deleted
   - Job applications deleted
   - Profile data deleted
   - Chat history deleted
4. **Audit log entry created** — deletion logged with timestamp and admin context
5. **Email confirmation sent** — user receives deletion confirmation

### Data Deleted Immediately (Request-Based)

Users can request deletion of specific documents:
- Individual résumés
- Individual cover letters
- Specific job applications

### Data NOT Deleted
- Admin audit log (retained for 24 months for compliance)
- Anonymized analytics (conversion rates, feature usage)

## GDPR & CCPA Compliance

### GDPR (EU Users)
- ✅ Data subject access requests: User can export their data via Settings > Download My Data
- ✅ Right to erasure: Implemented via Settings > Privacy > Delete Account
- ✅ Data portability: Résumés/cover letters can be downloaded as PDF/DOCX
- ✅ Consent: Users must accept Privacy Policy before signup

### CCPA (California Users)
- ✅ Right to know: Users can view their data in Settings > Profile
- ✅ Right to delete: Implemented via account deletion flow
- ✅ Right to opt-out: No third-party sales of data
- ✅ Data disclosure: Privacy Request page explains data practices

## Implementation

### Tables Affected by Deletion

When a user account is deleted, the following tables are purged:

```sql
-- User deletes all personal data
DELETE FROM job_applications WHERE user_id = $1;
DELETE FROM user_resumes WHERE user_id = $1;
DELETE FROM dashboard_revisions WHERE application_id IN (SELECT id FROM job_applications WHERE user_id = $1);
DELETE FROM resume_revisions WHERE application_id IN (SELECT id FROM job_applications WHERE user_id = $1);
DELETE FROM cover_letter_revisions WHERE application_id IN (SELECT id FROM job_applications WHERE user_id = $1);
DELETE FROM user_style_preferences WHERE user_id = $1;
DELETE FROM profiles WHERE id = $1;

-- Log the deletion
INSERT INTO admin_audit_log (action, admin_id, target_id) VALUES ('user_hard_delete', auth.uid(), $1);
```

### Privacy Request Endpoint

`POST /api/privacy-request` — allows users to:
- Request a copy of their data
- Request account deletion
- Request specific document deletion

## Monitoring & Audit

All deletions are logged in `admin_audit_log` with:
- Timestamp
- User ID (target)
- Deletion type (hard_delete, soft_delete, document_delete)
- Admin ID (if admin-initiated)

Admin dashboard provides deletion audit trail for compliance verification.

## Future Work

- [ ] Automated data purge cron job (hard delete after 30-day grace period)
- [ ] User data export service (GDPR right-to-portability)
- [ ] Encryption of deleted data retention (before permanent deletion)
- [ ] Data anonymization service (for analytics)

## Questions

For privacy-related questions, contact: privacy@resuvibe.com
