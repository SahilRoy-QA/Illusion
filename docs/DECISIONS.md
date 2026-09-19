# illusion — Decision Log

## ADR 001: Hexagonal Architecture with Dual Adapters
- **Decision:** Use Ports and Adapters with a fully functional IndexedDB local adapter for client-side execution and an HTTP adapter matching the OpenAPI spec.
- **Rationale:** Ensures browser-only runtime capability in AI Studio while preserving strict parity with a production PostgreSQL/Express backend.
- **Status:** Approved.

## ADR 002: Plain-Language Copy Layer with Banned-Term Scanner
- **Decision:** Isolate all business-facing copy into `src/copy/` and enforce a zero-technical-jargon scanner script.
- **Rationale:** Non-technical owners like Priya and Dr. Amit must never see technical jargon (e.g., entity, schema, CRUD, regex).
- **Status:** Approved.

## ADR 003: Setup History with Full Config Snapshots
- **Decision:** Automatically snapshot `TenantConfig` on every structural change with human-readable diffs and one-click rollback.
- **Rationale:** Gives non-technical users the confidence to explore without fear of breaking their system.
- **Status:** Approved.
