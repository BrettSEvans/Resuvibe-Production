## Accept all 3 moderate dependency risks

Update the project's **Security Memory** to document these as accepted risks so future scans/agents know they're intentional:

1. **ajv ReDoS via `$data`** (transitive of `@lovable.dev/mcp-js`) — accepted: MCP tool schemas are fixed/not user-supplied; `$data` isn't used.
2. **esbuild dev-server request exposure** (transitive of `@lovable.dev/mcp-js`) — accepted: dev-time only, never runs in production.
3. **@hono/node-server path traversal on Windows** (transitive of `@lovable.dev/mcp-js`) — accepted: MCP runs on Deno (Lovable Cloud), not Node/Windows, and doesn't serve static files.

No package or code changes — `@lovable.dev/mcp-js@0.24.0` is already the latest published version and no upstream patch exists.

Single action: call `security--update_memory` to append an "Accepted dependency risks" section covering the three items above.
