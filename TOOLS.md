# Tools Used to Build SmartStock

SmartStock is built as a full-stack TypeScript inventory, POS, sales, and reporting system. The project is split into a React frontend and an Express backend.

## Core Stack

| Area | Tools |
| --- | --- |
| Frontend | React 18, Vite, TypeScript |
| Backend | Node.js, Express, TypeScript |
| Database | PostgreSQL |
| ORM and migrations | Prisma, Prisma Client |
| Styling | Tailwind CSS, PostCSS, Autoprefixer |
| Package manager | npm |
| Development runner | concurrently, tsx |

## Frontend Tools and Libraries

- React and React DOM: Builds the browser user interface.
- Vite: Runs the frontend development server and production build.
- TypeScript: Adds static typing across frontend code.
- Tailwind CSS: Provides utility-based styling.
- React Router DOM: Handles page routing and protected routes.
- TanStack React Query: Manages API fetching, caching, and server state.
- Axios: Sends HTTP requests to the backend API.
- React Hook Form: Builds and manages forms.
- Zod and `@hookform/resolvers`: Validates form and API data.
- Recharts: Renders dashboards and report charts.
- Lucide React: Provides UI icons.
- html5-qrcode: Supports camera barcode scanning.
- jsPDF: Generates PDF output.
- date-fns: Formats and handles dates.
- React Hot Toast: Shows toast notifications.

## Backend Tools and Libraries

- Node.js: JavaScript runtime for the API server.
- Express: Defines REST API routes and middleware.
- TypeScript: Adds static typing to backend code.
- Prisma: Defines the database schema, migrations, and generated database client.
- PostgreSQL: Stores application data.
- JSON Web Token: Handles access and refresh token authentication.
- bcrypt: Hashes user passwords.
- Zod: Validates request payloads.
- Helmet: Adds common HTTP security headers.
- CORS: Controls allowed frontend origins.
- express-rate-limit: Limits repeated API requests.
- Morgan: Logs HTTP requests during development.
- Cookie Parser: Reads authentication cookies.
- Multer: Handles file uploads.
- csv-stringify: Generates CSV exports.
- Decimal.js: Handles precise currency and decimal calculations.
- dotenv: Loads backend environment variables.

## Database and Data Model

- PostgreSQL is configured in `backend/prisma/schema.prisma`.
- Prisma Client is generated from the Prisma schema.
- Prisma migrations are stored in `backend/prisma/migrations`.
- The schema includes users, roles, permissions, products, suppliers, customers, stock movements, sales, refunds, notifications, audit logs, and system settings.

## Development and Quality Tools

- ESLint: Checks frontend and backend TypeScript code.
- TypeScript compiler: Runs type checks and production compilation.
- tsx: Runs backend TypeScript directly during development and seeding.
- concurrently: Runs frontend and backend development servers together from the root project.

## Main Project Commands

Run all installs:

```bash
npm install
npm run install:all
```

Start both frontend and backend:

```bash
npm run dev
```

Build both applications:

```bash
npm run build
```

Run lint checks:

```bash
npm run lint
```

Run type checks:

```bash
npm run typecheck
```

Generate Prisma Client:

```bash
npm run prisma:generate --prefix backend
```

Run database migrations:

```bash
npm run prisma:migrate --prefix backend
```

Seed development data:

```bash
npm run seed --prefix backend
```

## Local Services

- Frontend development server: `http://localhost:5173`
- Backend API server: `http://localhost:5000`
- Backend health check: `http://localhost:5000/health`

## System Features Supported by These Tools

- Inventory and product management
- Barcode scanning and barcode labels
- POS sales flow
- Stock-in and stock-out tracking
- Refunds and sale rollback behavior
- User authentication with JWT
- Role-based access control
- Dashboard charts and reports
- Supplier and customer records
- Notifications
- Audit logs
- CSV and PDF exports
