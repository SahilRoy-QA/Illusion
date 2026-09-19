# illusion — Architecture & System Design Documentation

## Core Architectural Invariants
1. **One Core Platform:** Single route tree, dynamic renderer library, unified data layer.
2. **Tenant Isolation at Boundary:** No component imports unscoped ports. `RequestContext` is checked and injected inside adapters.
3. **No-Code Guarantee:** All business-facing actions are performed via point, tap, drag, and typing plain words with real-time visual previews.
4. **Business Type is Data:** Templates seed `TenantConfig` once at creation; zero `if (businessType === ...)` in UI code.
5. **Dynamic Runtime Rendering:** Nav, forms, tables, dashboards, and public site sections render dynamically from `TenantConfig`.
6. **Permissions at Boundary:** Verified in adapter methods before database queries.
7. **Every Mutation Audited:** Includes actor, tenant, entity, diff, timestamp with redacting for sensitive values.
8. **Sensitive Fields Protected:** Sanitized in audit logs, exports, and public projections.
9. **Money in Minor Units:** Integer arithmetic for all monetary amounts; fixed rounding order.
10. **Time in UTC & Local Presentation:** Stored in ISO UTC; presented in tenant timezone.
11. **Soft Deletes Default:** Impact sentences displayed before deletion; Setup History provides undo.
12. **Explicit Public Projection:** Public pages only receive whitelisted fields.
13. **Optimistic Concurrency:** Version counter check-and-set prevents lost updates.
