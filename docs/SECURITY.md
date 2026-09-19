# illusion — Security Specification & Honesty Disclosure

## Environment Security Disclosure
This application runs entirely in client-side modern web browsers using IndexedDB for storage.
- In-browser authentication and role verification are simulations designed for prototyping, testing, and multi-tenant UI generation.
- Real production security requires the included `db/schema.sql` Row Level Security (RLS) policies and a certified backend OAuth2/JWT verification gateway as specified in `docs/api.md`.

## Implemented Boundaries
1. **Tenant Isolation:** Enforced on every method of `LocalTenantRepository` and `LocalRecordRepository`. Cross-tenant record queries are rejected.
2. **Access Control:** Verified using `can(ctx, action)` in adapter method pre-conditions.
3. **Sensitive Field Scrubbing:** Fields marked `sensitive: true` (such as patient medical notes) are redacted in audit diffs, public projections, and non-privileged views unless `records.export_sensitive` is granted.
4. **Optimistic Locking:** Version counter incremented and verified on every write to prevent race conditions.
5. **Impersonation Auditing:** Platform administrator impersonation sessions trigger immutable audit trail records with actor identity, and display a persistent viewport banner indicating real business data is being modified.
6. **Plain-Sentence Authorization:** Role capabilities are expressed as human-friendly sentences, avoiding raw technical keys in user configuration interfaces.
