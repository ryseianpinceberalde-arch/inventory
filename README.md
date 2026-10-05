# SmartStock Inventory and Sales Management System

SmartStock is a PERN-based inventory, barcode POS, sales, and analytics system for Philippine retail operations. It uses PostgreSQL through Prisma, Express APIs with JWT authentication and RBAC, and a responsive React dashboard.

## Technology Stack

- Frontend: React, Vite, TypeScript, Tailwind CSS, React Router, TanStack Query, React Hook Form, Zod, Recharts, Lucide React, Axios, date-fns, html5-qrcode, jsPDF, React Hot Toast
- Backend: Node.js, Express, TypeScript, PostgreSQL, Prisma, JWT, bcrypt, Zod, Helmet, CORS, Morgan, Express Rate Limit, Cookie Parser, Multer

## Requirements

- Node.js 20+
- PostgreSQL 14+
- npm

## PostgreSQL Setup

Create the development database:

```bash
createdb smartstock
```

Copy environment files:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Set strong values for `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` before production.

## Development

```bash
npm install
npm run install:all
npm run dev
```

The frontend runs at `http://localhost:5173` and the backend at `http://localhost:5000`.

## PayMongo GCash Payments

The POS creates GCash checkout sessions through the backend. To enable test payments, set `PAYMONGO_SECRET_KEY` in `backend/.env` to your PayMongo **test secret key** (`sk_test_...`), then restart the backend. The optional `PAYMONGO_PUBLIC_KEY` (`pk_test_...`) is not used by the current hosted-checkout flow.

For a hosted deployment, configure `PAYMONGO_SECRET_KEY` in the backend service's environment or secret settings. Do not commit secret keys to GitHub or put them in frontend environment variables. The repository's `.env` files are ignored by Git; `backend/.env.example` contains placeholders only.

If a secret key has been shared or exposed, regenerate it in the PayMongo Dashboard before using it. Use test keys during development, and only use live keys in a production deployment.

## Prisma

```bash
npm run prisma:generate --prefix backend
npm run prisma:migrate --prefix backend
npm run seed --prefix backend
```

Default development credentials are created only by the seed script and must be changed before production:

- Admin: `admin@smartstock.local` / `Admin123!`
- Manager: `manager@smartstock.local` / `Manager123!`
- Cashier: `cashier@smartstock.local` / `Cashier123!`
- Inventory Staff: `inventory@smartstock.local` / `Inventory123!`

## Production Build

```bash
npm run build
```

## Barcode Scanners

USB scanners work as keyboard input in the POS barcode field. Camera scanning is available from POS and barcode pages when the browser grants camera permission.

## Receipt Printers

Receipts are formatted for 58mm and 80mm thermal printers. Use the browser print dialog and select the installed receipt printer.

## Testing Checklist

After running migrations and seed data, verify login/logout, refresh tokens, protected routes, RBAC, product CRUD, barcode lookup, stock-in, stock-out, POS sale completion, rollback behavior on failed sales, refunds, notifications, reports, receipt printing, responsive layout, and production builds.

## Limitations

This implementation provides a complete working foundation with core inventory, POS, reporting, notifications, RBAC, and audit flows. Advanced production hardening still recommended: email delivery for password resets, full automated test coverage, background jobs for expiration alerts, richer import/export validation, and deployment-specific observability.
