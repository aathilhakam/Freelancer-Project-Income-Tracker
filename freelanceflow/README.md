# FreelanceFlow

A full-stack Freelancer Project & Income Tracker. Manage clients, projects, received payments, and financial performance in a responsive workspace.

## Features

- Registration, login, persistent HTTP-only cookie sessions, protected routes, and logout.
- Client and project CRUD, detail views, status/client filters, search, sorting, and pagination.
- Payment recording, editing, deletion, date/client filters, history, and CSV export.
- Live dashboard with received income, active projects, outstanding balances, client count, monthly income, and project status charts.
- Analytics with year/date filters, income by client, completed projects, monthly comparison, and a print-friendly report (save as PDF through the browser).
- Name, email, password, and display currency settings.
- Responsive navigation, accessible dialogs, form validation, loading states, error feedback, and deletion confirmations.
- Automated integration tests for authentication, CRUD, ownership, calculations, payment validation, concurrency, and session revocation.

## Technologies

**Frontend:** React 18, Vite, JavaScript/JSX, Tailwind CSS, shadcn/ui-style local Button and Dialog components using Radix primitives, React Router, Axios, Recharts, Lucide, React Hook Form, Zod, and Sonner.

**Backend:** Node.js, Express, MongoDB, Mongoose, JWT, bcryptjs, dotenv, CORS, Helmet, express-rate-limit, cookie-parser, and Zod. Tests use Node’s test runner and Supertest.

## Prerequisites

- Node.js 20.19+ and npm 10+.
- Your locally installed MongoDB 7+ service on port 27017. Standalone MongoDB is supported.

## Installation

From this directory:

```sh
npm install
cp server/.env.example server/.env
```

Generate a JWT signing secret and paste the output into `JWT_SECRET` in `server/.env`:

```sh
node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"
```

Do not commit `.env` files. The supplied example contains placeholders only.

If your network blocks the main npm registry, the dependencies can be installed from the public mirror used during local verification:

```sh
npm install --registry=https://registry.npmmirror.com
```

TLS verification remains enabled. No global npm registry or certificate settings are changed.

### Local MongoDB

Use your existing MongoDB installation. On macOS with Homebrew:

```sh
brew services start mongodb-community
```

If Homebrew installed a versioned MongoDB formula, use that service name instead. Set the connection string in `server/.env`:

```dotenv
MONGODB_URI=mongodb://127.0.0.1:27017/freelanceflow
```

The Express backend loads `.env` at startup and calls `connectDatabase()` in `server/config/db.js`, which connects with Mongoose. React calls the Express API and never connects directly to MongoDB. MongoDB creates the `freelanceflow` database and its collections when data is first saved.

Database files are managed by your installed MongoDB service outside this project. No project database folder or replica-set initialization script is required.

## Environment variables

| Variable                      | Location                    | Purpose                                                |
| ----------------------------- | --------------------------- | ------------------------------------------------------ |
| `PORT`                        | server/.env                 | API port, default 5001                                 |
| `MONGODB_URI`                 | server/.env                 | Existing local MongoDB connection                      |
| `JWT_SECRET`                  | server/.env                 | Random signing secret, at least 32 characters          |
| `CLIENT_ORIGIN`               | server/.env                 | Allowed browser origin, normally http://127.0.0.1:5175 |
| `NODE_ENV`                    | server/.env                 | development locally; production enables Secure cookies |
| `VITE_API_URL`                | client/.env (optional)      | Default /api; Vite proxies requests to API             |
| `TEST_MONGODB_URI`            | test environment            | MongoDB URI for isolated test databases                |
| `SEED_EMAIL`, `SEED_PASSWORD` | seed environment (optional) | Local demo account configuration                       |

Use **127.0.0.1 consistently**, rather than mixing it with localhost, so cookie and origin checks match.

## Run locally

Start both services from `freelanceflow/`:

```sh
npm run dev
```

Open **http://127.0.0.1:5175**. The API listens at **http://127.0.0.1:5001**. Register an account, add a client, create a project, then record a payment. Data persists in MongoDB.

Or use separate terminals:

```sh
npm run dev -w server
npm run dev -w client
```

To build and preview the frontend:

```sh
npm run build
npm run preview -w client
```

The production preview is a static build. For API calls, configure a same-origin `/api` reverse proxy or `VITE_API_URL` and matching `CLIENT_ORIGIN` before building. Local development is the supported assignment run mode; no deployment is required.

## Optional sample data

The app starts with real empty states. Sample values are never embedded in the dashboard. To create a separate demo user and persist illustrative clients, projects, and payments:

```sh
npm run seed
```

The seed prints its demo email and a randomly generated password. You may set `SEED_EMAIL` and `SEED_PASSWORD` in your ignored `server/.env` to choose local demo credentials. The script refuses to modify an existing demo account. If insertion fails, it removes only the new demo account and its partial records. Your own account is unaffected.

## Financial rules

- Amounts have at most two decimal places. The database stores integer cents.
- Received income is the sum of payment records, not project fees.
- Outstanding balance is project fee minus recorded payments, summed across all statuses (including cancelled projects with a remaining fee).
- Active projects are projects with **In Progress** status.
- Zero, negative, future-dated, and excessive payments are rejected.
- Project balances are calculated from payment records, so no separate stored balance can become stale. Each payment change writes one document. A per-user request queue prevents concurrent overpayments within the single local Express process. Run one backend process; multiple independent writers would need database-level coordination.
- A project fee cannot be reduced below the paid amount. Paid projects cannot move to another client.
- To delete a client, delete its projects first. To delete a project, delete its payments first. Financial history is never silently cascaded away.
- Currency selection affects formatting only. Use one actual currency for the account; there is no exchange-rate conversion.
- Income analytics date filters apply to payments. Project counts and outstanding balances always cover the full portfolio. Monthly chart uses the selected year within the payment date range.

## Architecture

```text
freelanceflow/
  client/
    src/
      components/       UI, layout, charts, reusable record forms
      pages/            auth, dashboard, records, details, analytics, settings
      context/          authentication and currency formatting
      hooks/            API loading and retry hook
      services/         Axios client
      lib/              formatting utilities
      App.jsx
      main.jsx
      styles.css
  server/
    config/             environment and Mongoose connection helper
    controllers/        authentication and scoped CRUD operations
    middleware/         session protection and error handling
    models/             User, Client, Project, Payment
    routes/             REST endpoint registration
    services/           financial calculations and optional seed
    validators/         request schemas
    tests/              MongoDB-backed integration tests
    app.js
    server.js
  README.md
```

## API overview

All record, dashboard, analytics, and user endpoints require the session cookie.

| Method           | Endpoint                                                      | Purpose                          |
| ---------------- | ------------------------------------------------------------- | -------------------------------- |
| POST             | /api/auth/register, /api/auth/login                           | Create account / sign in         |
| POST             | /api/auth/logout                                              | Revoke sessions and clear cookie |
| GET              | /api/auth/me                                                  | Current user                     |
| GET, POST        | /api/clients, /api/projects, /api/payments                    | List / create                    |
| GET, PUT, DELETE | /api/clients/:id, /api/projects/:id, /api/payments/:id        | Detail / update / delete         |
| GET              | /api/dashboard/summary?year=2026                              | Live business summary            |
| GET              | /api/analytics/income?year=2026&from=2026-01-01&to=2026-12-31 | Income analytics                 |
| GET              | /api/analytics/projects                                       | Project status analytics         |
| PUT              | /api/users/profile                                            | Name, email, display currency    |
| PUT              | /api/users/password                                           | Current and new password         |
| GET              | /api/health                                                   | API health                       |

Project requests use `fee` and payment requests use `amount` in major currency units. Responses expose formatted numeric major-unit amounts plus internal integer-cent fields. Ownership is checked on both records and their referenced clients/projects. Lists return the current user’s records; filtering and pagination run in the browser, suitable for assignment-sized portfolios.

## Security

Passwords are hashed with bcrypt. JWTs are carried in HttpOnly, SameSite=Strict cookies with seven-day expiry; production adds Secure. Mutating requests with a foreign Origin are rejected. Logout and password changes revoke existing tokens via a version on the user. Sessions never store passwords or tokens in localStorage. Helmet, request size limits, login rate limiting, server validation, and per-user scoping protect API requests. There is no password recovery or email verification flow in this assignment.

## Testing

Start your local MongoDB service first, then:

```sh
npm test
npm run build
```

Tests create and drop a uniquely named `freelanceflow_test_*` database on local port 27017. They never clear the application database. Set `TEST_MONGODB_URI` to use another local MongoDB instance if needed.

```sh
npm run format:check
```

Manual acceptance checks: register, refresh to verify persistence, create/edit/delete clients and projects, reject overpayments, edit/delete a payment, inspect dashboard charts, search and filter lists, update settings, export CSV, print analytics, and try the mobile navigation. Attempt a foreign record ID while signed in as a second user; it must be inaccessible.

## Screenshots

For your assignment README, capture the dashboard, clients, projects, payments, analytics, and a mobile view from the running application. Add the images to a `screenshots/` folder and link them here.

## Assignment submission

The assignment asks for a public GitHub repository, a public Google Drive demo video (3–5 minutes), and a PDF/Word document containing **only your name, repository link, and demo video link**. Publishing, recording, and repository management are left to you, as requested. No Git operations are performed by this project setup.
