# Admin Guide

## Overview

Resuvibe administrators have elevated permissions to manage users, view audit logs, and handle compliance requests. This guide outlines admin capabilities, responsibilities, and workflows.

## Admin Role

### How to Grant Admin Role

Admins are assigned via the Supabase dashboard. To grant admin role:

1. Log into Supabase console for Resuvibe project
2. Navigate to SQL Editor
3. Run:
   ```sql
   INSERT INTO user_roles (user_id, role) VALUES ('<user_id>', 'admin');
   ```

### Verifying Admin Status

Run in Supabase SQL:
```sql
SELECT * FROM user_roles WHERE role = 'admin';
```

## Admin Capabilities

### 1. User Management

**View user profile:**
- Navigate to `/admin` (requires admin role)
- Search for user by email
- View profile data, resumes, applications

**Soft delete user account:**
- Marks account as deleted (soft delete)
- User data retained for 30-day recovery window
- Run via admin API: `POST /api/admin/soft-delete-user`

**Hard delete user account:**
- **Use with caution** — permanently deletes all user PII
- Triggered after 30-day grace period automatically
- Or via: `POST /api/admin/hard-delete-user`

### 2. Audit Logging

All admin actions logged to `admin_audit_log` table:
- User deletions
- Permission changes
- Policy modifications
- Sensitive data access

**View audit log:**
```sql
SELECT * FROM admin_audit_log 
ORDER BY created_at DESC 
LIMIT 100;
```

**Filter by action:**
```sql
SELECT * FROM admin_audit_log 
WHERE action = 'user_hard_delete' 
ORDER BY created_at DESC;
```

### 3. Data Access Control

Admins can view:
- All user profiles (via RLS policy "Admins can read all profiles")
- All job applications (with user context)
- All audit logs
- Generation usage statistics

**Admins cannot:**
- Delete user documents directly (must use soft/hard delete flow)
- Modify user credentials
- Bypass RLS (database enforces access control)

### 4. Privacy Requests (GDPR/CCPA)

Users can request:
- **Data export** — copy of all their data
- **Account deletion** — right-to-be-forgotten
- **Specific document deletion** — individual résumé/cover letter

**Handle privacy request:**

1. User submits request via Privacy Request page
2. Admin receives notification (email to admin@resuvibe.com)
3. Admin verifies request authenticity (check email match)
4. Admin executes deletion:
   ```sql
   -- Soft delete (30-day grace period)
   UPDATE profiles SET deleted_at = now() WHERE id = '<user_id>';
   
   -- OR hard delete (immediate, permanent)
   -- Call hard_delete function (see below)
   ```
5. Log action to audit trail
6. Send confirmation email to user

### 5. Account Linking

Admin can view linked accounts:
```sql
SELECT * FROM account_links WHERE primary_user_id = '<user_id>';
```

Admin can unlink accounts if requested:
```sql
DELETE FROM account_links WHERE id = '<link_id>';
```

## Workflows

### Handling a User Support Request

1. **Locate user:**
   ```sql
   SELECT * FROM profiles WHERE email = 'user@example.com';
   ```

2. **View their applications:**
   ```sql
   SELECT * FROM job_applications WHERE user_id = '<user_id>';
   ```

3. **Check audit trail:**
   ```sql
   SELECT * FROM admin_audit_log WHERE target_id = '<user_id>';
   ```

4. **Resolve issue** (e.g., recover soft-deleted account):
   ```sql
   UPDATE profiles SET deleted_at = NULL WHERE id = '<user_id>';
   ```

### Responding to a GDPR Request

**Data Export:**
1. Verify user identity
2. Export data:
   ```sql
   SELECT * FROM profiles WHERE id = '<user_id>';
   SELECT * FROM job_applications WHERE user_id = '<user_id>';
   SELECT * FROM user_resumes WHERE user_id = '<user_id>';
   ```
3. Send as ZIP file to user email
4. Log to audit: `privacy_request_export`

**Account Deletion:**
1. Verify user identity
2. Soft delete (30-day grace):
   ```sql
   UPDATE profiles SET deleted_at = now() WHERE id = '<user_id>';
   ```
3. Send confirmation email
4. Log to audit: `privacy_request_soft_delete`

### Responding to a Data Breach (If Required)

1. **Assess impact:**
   - Which users affected?
   - What data exposed?
   - Which time window?

2. **Preserve evidence:**
   ```sql
   SELECT * FROM admin_audit_log 
   WHERE action LIKE '%breach%' OR created_at > '<incident_start_time>';
   ```

3. **Notify users** (legal team involvement)

4. **Document in incident log**

## Security Best Practices for Admins

### Do:
- ✅ Always log admin actions (automatic via triggers)
- ✅ Verify user identity before deletions
- ✅ Use strong passwords and 2FA on admin account
- ✅ Review audit logs regularly for anomalies
- ✅ Encrypt sensitive exports before sending

### Don't:
- ❌ Share admin credentials
- ❌ Access user data without business justification
- ❌ Bypass audit logging
- ❌ Delete data without verification
- ❌ Ignore failed deletion logs

## Monitoring

### Weekly Admin Tasks

- [ ] Review `admin_audit_log` for unusual activity
- [ ] Check for failed deletion jobs
- [ ] Verify no lingering soft-deleted accounts past 30 days
- [ ] Review user complaints/support tickets

### Monthly Admin Tasks

- [ ] Audit admin user roster
- [ ] Check data usage trends (generation usage, storage)
- [ ] Verify RLS policies are enforced
- [ ] Review privacy requests handled

## Troubleshooting

### "User not found"
- Check if user is soft-deleted: `SELECT deleted_at FROM profiles WHERE email = '...';`
- Recover: `UPDATE profiles SET deleted_at = NULL WHERE email = '...';`

### "Permission denied" error
- Verify admin role: `SELECT has_role(auth.uid(), 'admin'::app_role);`
- Grant role if missing (see "How to Grant Admin Role" above)

### "Audit log entry not created"
- Check if audit trigger is active: `SELECT * FROM pg_trigger WHERE tgname LIKE '%audit%';`
- Verify user performing action is authenticated

## References

- [GDPR Compliance](../DATA_RETENTION.md#gdpr--ccpa-compliance)
- [Data Retention Policy](../DATA_RETENTION.md)
- [Supabase Edge Functions Security](../supabase/functions/SECURITY.md)
