# Merjane

Inventory and order processing for Aïn Sebaâ. Fastify, SQLite, Drizzle and strict TypeScript.

## Run & verify

Node.js 20+ and pnpm 9.1.4 (`corepack enable pnpm`, or use `npx pnpm@9.1.4`).

```sh
pnpm install --frozen-lockfile
pnpm demo       # Optional sample data; requires an empty database, never clears it
pnpm dev        # http://localhost:8888
pnpm test       # Unit + real SQLite/HTTP integration tests
pnpm lint
pnpm build      # Type-check + browser bundle
```

Settings: [.env.dev](./.env.dev). After browser/CSS edits, run `pnpm build:web` and refresh.
`pnpm start` starts the server without rebuilding or updating the schema.
Watch tests: `pnpm test:unit` / `pnpm test:integration`.

## Structure

```text
src/
  core/                         Configuration, DB, DI, router/const, web shell, shutdown
  features/
    inventory/                  Product availability
    orders/                     Order processing
      domain/
        models/                 One model per file
        enums/                  Named business types (where needed)
        const/                  Route paths, mappings and constants
        repos/                  Repository contracts only
        services/               Pure business rules (where needed)
      application/              Use-case orchestration (orders)
      repo/                     SQLite implementations
      presentation/             HTTP routes and UI
      shared/
        state/                  UI data, loading, errors and actions
        impl/                   HTTP repository implementations
        index.ts                Public feature contracts, models, enums and state
    notifications/shared/       Notification adapter and public port
  shared/                       Clock/errors, HTTP, DOM helpers, state, styles, test DB
  services/                     Two original protected notification files, unchanged
```

The feature layout is a convention, not empty scaffolding: folders exist only when used.
**UI → state → repository contract → implementation.** Cross-feature access goes through `shared`.

## Changes & benefits

| Update | Benefit |
| --- | --- |
| DDD feature slices; separate models, enums, constants, contracts and implementations | Clear ownership and smaller, testable responsibilities |
| Shared observable state requests injected repos; views never fetch directly | Predictable UI updates; state tests need no browser |
| API paths shared between routes and HTTP repos; string enums keep existing wire values | No duplicated route strings or accidental identifier drift |
| Pure stock rules with one injected clock reading per order | Deterministic date-boundary tests |
| Atomic SQLite updates; validate persisted products and request IDs | No partial stock updates; explicit `400`/`404`/`422` errors |
| Central styles, responsive dashboard, product hero transitions and reduced-motion support | Consistent presentation and accessible navigation |
| Isolated in-memory SQLite tests | Fast tests that never open/delete the development database |

**Moved/removed:** infrastructure moved from top-level `configuration`, `db`, `di`, `shutdown` into `core`; the mixed controller and `ProductService` were replaced; obsolete file-backed test helpers and empty legacy folders were removed.

**Merged:** duplicated controller/service stock handling became one domain rule service; shared HTTP error handling, styles and route definitions were consolidated. Unrelated features remain separate.

## Business behavior & compatibility

- Normal: decrement available stock; otherwise announce lead time, including zero days.
- Seasonal: sell only within the season; empty stock announces delay only if replenishment fits, otherwise notify unavailability. Preserve out-of-season physical stock.
- Expirable: sell until expiration has passed; then zero stock and notify expiration. Unexpired empty stock announces delay, not expiration.
- Season endpoints and replenishment exactly at season end are inclusive; expiration is strictly after its timestamp. Lead-time days remain fixed 24-hour periods.

The original `POST /orders/:orderId/processOrder` → `{orderId}` contract and DB schema are preserved. The rule corrections above were intentional and approved, not exact preservation of legacy quirks. Invalid products roll back the entire order before notifications.

**Limits:** protected notifications remain no-ops. Notifications run after commit; their failure cannot undo stock. No durable idempotency exists in the original schema: repeat API calls process again; the UI duplicate guard lasts only for the page session. The dashboard is a local exercise, not an authenticated production admin.

## Exercise checklist

- Covered: all three product categories, original mixed order, date boundaries, notification payloads, validation, rollback, HTTP/repository behavior and UI state.
- Verified: tests, strict TypeScript, lint and build; browser checks for filters, navigation, stock refresh, errors and mobile layout.
- Protected files unchanged; setup/test commands and architecture documented.
- Still required for delivery: commit/push to a public repository (preferably a fork) and reply to HR with its URL. These are not done locally. The two-hour submission deadline cannot be verified from the code.
