# SmartStock System Design

This document describes the system's functional design, data ownership, consistency rules, and current operating constraints. It complements [SYSTEM_ARCHITECTURE.md](SYSTEM_ARCHITECTURE.md), which maps the software components, and [ERD.md](ERD.md), which shows the database relationships. Statements about current behavior are based on the implementation in this repository; open decisions are identified separately.

## Design goals and scope

SmartStock supports retail staff who maintain a product catalog, receive and adjust stock, ring up sales, process returns, and review operational reports. Access is permission-based: the system includes Admin, Manager, Cashier, and Inventory Staff roles, and supports configurable roles and user-specific permissions.

The design prioritizes:

- **Accurate stock and sales records:** stock-changing operations coordinate balance updates and history records in PostgreSQL transactions.
- **Server-owned business decisions:** the API checks permissions, product prices, stock availability, discounts, and payment verification rather than treating browser state as authoritative.
- **Traceable operations:** sales, stock movements, adjustments, refunds, and audit records retain the actors and references needed by operational screens and reports.
- **Practical retail workflows:** barcode-based product selection, held sales, multiple payment methods, and Manila business-date reporting are supported by the current application.

The implementation is a single web application and API backed by one PostgreSQL database. It does not define separate store databases, offline synchronization, multi-tenant data partitioning, or a deployment capacity target.

## Functional design

| Capability | Main records and behavior |
| --- | --- |
| Identity and permissions | Users belong to roles. Effective permissions combine role grants and user-specific grants. Protected API routes enforce permissions. |
| Catalog | Products are linked to categories and optionally to a primary supplier. Products can have additional barcode records and supplier relationships. Archived products are retained. |
| Receiving and stock control | Stock receipts record supplier and received items. Stock-out and adjustments record reasons. Large adjustments require approval; smaller differences are approved automatically by the current rule. |
| Point of sale | A sale contains line snapshots, a cashier, optional customer, payment records, and a unique receipt number. A cashier can hold and resume a cart. |
| Refunds | Refunds reference the original sale and returned line items. Return condition determines whether units go back into stock. |
| Notifications and audit | Inventory workflows create in-app alerts. Selected actions write audit entries with actor, action, record reference, and optional before/after data. |
| Reports | The API aggregates persisted sales, refund, inventory, supplier, and employee data. The browser renders and exports report results. Business-date calculations use Asia/Manila. |

## Data ownership and invariants

PostgreSQL is the persistent source of truth. The browser may hold a working POS cart and cache API responses, but the API reloads product and permission data and computes sale totals before committing a sale.

### Catalog and inventory

- `Product.currentStock` stores the current quantity used by inventory checks and the POS.
- Stock receipts, stock-outs, sales, refunds, and approved adjustments update product quantities and create `StockMovement` records within the relevant transaction.
- `StockReceipt` and its items preserve receipt-level supplier, cost, batch, and expiration information. `InventoryAdjustment` preserves the counted quantity, difference, request, and approval state.
- When an adjustment difference is less than 10 units in absolute value, the current service approves it immediately. Larger differences remain pending. Approval checks that stock has not changed since the physical count and disallows self-approval.
- Low-stock alerts are created when the resulting quantity is at or below the product's reorder level. They are stored as notifications, not sent through a separate messaging service.

### Sales and refunds

- `Sale` stores receipt-level totals and payment method. `SaleItem` snapshots selling price, historical cost, discount, line total, and profit so later catalog price changes do not rewrite the original sale line.
- `Payment` stores the method, amount, processor, and optional provider reference. `Refund` and `RefundItem` preserve refund amounts, quantities, methods, and item conditions.
- A sale's idempotency key and receipt number are unique in the database. The sale service locks on the idempotency key, checks for a prior sale, and reuses the existing receipt for a same-cashier retry.
- Product rows are locked while sale stock is checked and decremented. Sale, sale items, payment, stock updates, movements, and low-stock alerts are committed in one PostgreSQL transaction.
- Refund processing locks the original sale, limits returned quantities to the amount sold, and writes refund and inventory changes in a transaction. Refunds marked "Return to inventory" increment stock; other conditions do not.

`ERD.md` is the detailed schema reference. Prisma schema constraints, foreign keys, and migrations enforce additional uniqueness and relationship rules.

## Key transaction designs

### Complete a sale

1. Validate the request shape, required payment fields, and unique product lines.
2. For GCash, verify with PayMongo that the checkout is paid in PHP, belongs to the cashier, and matches the cart hash. For other methods, use the submitted tender amount subject to server-side validation.
3. Start a PostgreSQL transaction. Lock by idempotency key and, when present, checkout session. Return the existing sale for a permitted retry or reject a reused provider payment.
4. Lock product rows in a stable product-ID order; reload active product prices and available stock; compute line and sale totals on the server.
5. Check tender and verified payment amount. Create the sale, item snapshots, payment, stock updates, movement records, and any low-stock notifications.
6. Commit the database transaction, then write the sale audit event from the controller.

The database transaction prevents a partially recorded sale if one of its database writes fails. PayMongo is outside that transaction: a provider payment can succeed while the subsequent database operation fails. The current design verifies by API request and does not mount a webhook or automated payment-reconciliation worker.

### Receive or adjust stock

Stock receipt creation records the supplier delivery and its line items, locks the affected products in a stable order, updates quantity and cost, and records movements in one transaction. Adjustment requests capture the system count at request time. Approval rechecks that count under a lock before applying the physical count, so a stale approval cannot silently overwrite intervening stock changes.

## API and client behavior

- The API exposes JSON REST endpoints under `/api`; route groups cover authentication, catalog, suppliers, inventory, POS, sales, payments, reports, and administration.
- Successful responses use a common `success`, `message`, `data`, and `meta` envelope. Paginated endpoints include pagination metadata. Validation and application errors return a message and error details through centralized middleware.
- Request bodies are checked with Zod schemas on routes that declare validation middleware. Authentication and permission checks occur in Express middleware before protected controller logic.
- The frontend Axios client attaches the in-memory access JWT and sends credentials for the refresh cookie. If a request receives an eligible 401, the client attempts one coordinated refresh and retries the original request once.
- The API recalculates prices and totals from current catalog data when completing a sale. The client does not submit authoritative sale prices.
- Response serializers strip sensitive values and remove selected financial fields for users without the relevant permissions.

## Security design

- Access JWTs are held in frontend memory. Refresh JWTs travel in an HttpOnly cookie and are stored in the database as token hashes. Passwords are hashed with bcrypt.
- Each authenticated API request verifies the access token, reloads the active user and effective permissions, then evaluates the route's required permission.
- Express applies Helmet, an allowlist-based credentialed CORS policy, request rate limiting, and centralized error responses. Backend secrets are read from server environment configuration.
- PayMongo secret keys are used only by the backend. Hosted checkout redirects the cashier to PayMongo; server-side verification is required before recording a GCash sale.

## Failure handling and operating constraints

| Area | Current behavior | Design consequence |
| --- | --- | --- |
| Database writes | Business operations use PostgreSQL transactions where multiple records must stay consistent. Known Prisma conflicts map to API errors. | Conflicts can be retried by the client where appropriate; external side effects are not covered by database rollback. |
| GCash | The API calls PayMongo synchronously to create and verify checkout sessions. | Checkout depends on provider availability and network latency. There is no webhook consumer or automated reconciliation process in this repository. |
| Barcode enrichment | The API can query UPCitemdb and Open Food Facts. UPCitemdb credentials are optional and a trial endpoint is used without a key. | Online lookup depends on external availability and should be treated as catalog assistance, not as the persisted product source of truth. |
| Password reset | Reset tokens can be created and consumed. | Email delivery is not implemented, so production delivery needs a separate integration. |
| Background work | API requests run in the Express process; no worker or queue is defined. | Long-running or scheduled work has no separate execution path today. |
| Deployment and recovery | Local ports and environment settings are documented, but no production platform, backup policy, or recovery objective is defined. | Hosting, database backups, restore procedures, and availability targets must be selected for a real deployment. |
| Capacity | No expected user count, request rate, data volume, or latency objective is specified. | The repository does not provide evidence for a production capacity estimate or load-tested scaling plan. |

## Design decisions and implications

| Decision | Reason in the current system | Implication |
| --- | --- | --- |
| One relational database for operational state | Sales, stock, payments, permissions, alerts, and audit records have strong relationships and coordinated updates. | PostgreSQL availability and connection capacity are central to API availability. |
| Modular Express application | Route, controller, service, and validator modules group domains while deploying as one API. | Domain modules can evolve independently in code, but currently share runtime, configuration, and database resources. |
| Stored current stock plus movement history | POS and inventory screens need a direct balance, while staff need movement history. | All stock-changing paths must keep both representations aligned; database transactions cover the main operational paths. |
| Server-side price calculation | Prevents a browser-supplied price from determining the amount charged or recorded. | A sale uses catalog values when it is completed; the UI must handle a changed price or insufficient stock. |
| Database-backed authorization | Role and per-user permissions are configurable and checked for protected API requests. | Authenticated requests require database access to load the current user and permissions. |

## Open design decisions

The source repository does not define production answers for these concerns:

- Hosting topology, number of API instances, and frontend/API deployment process.
- Availability objectives, database backup frequency, restore testing, and recovery-point/recovery-time objectives.
- Expected traffic and inventory/history retention volumes, plus load-test thresholds.
- Payment reconciliation and operational handling for a successful provider payment followed by a failed sale commit.
- Delivery channel for password reset and any future outbound notifications.
- Centralized metrics, tracing, alerting, and log retention.

These are deployment and product decisions; this document records them as unresolved rather than assuming a provider or target capacity.
