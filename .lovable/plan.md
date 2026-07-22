## Plan

### Goal
Mark the `app_mcp_public_unauthenticated` security finding as ignored and update the project's security memory to reflect the accepted risk.

### Background
The MCP server is intentionally public and read-only. It exposes only three tools (`list_faq_guides`, `get_faq_guide`, `search_faq`) that fetch static public FAQ content from `guide-index.json`. No write, delete, or authenticated data access is possible.

### Steps
1. **Ignore the finding** via `security--manage_security_finding`:
   - `scanner_name`: `app_mcp`
   - `internal_id`: `app_mcp_public_unauthenticated`
   - Rationale: the MCP server is deliberately public for FAQ discoverability; tools are read-only, operate on public static data only, and cannot write or access per-user data.

2. **Update security memory** via `security--update_memory` to record:
   - The MCP server is intentionally unauthenticated.
   - It only reads public FAQ data.
   - This is an accepted risk, not a vulnerability to fix.

### No code changes required.
