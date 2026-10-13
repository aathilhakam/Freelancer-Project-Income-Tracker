# FreelanceFlow — Developer Guide

Full-stack **Freelancer Project & Income Tracker**, built with a React/Vite client and a Node.js/Express API backed by MongoDB.

[Back to main project README](../README.md)

## Requirements

- Node.js and npm
- MongoDB deployment with replica-set/transaction support
- Local environment configuration based on the committed `.env.example` templates

## Quick Start

Run from this `freelanceflow` folder:

```bash
npm install
cp server/.env.example server/.env
cp client/.env.example client/.env
```

In `server/.env`, follow the precise variable names in `server/.env.example` and `server/config/env.js`, including the MongoDB connection and authentication settings. Never put actual secrets into `.env.example`.

The local development setup used during the project had an Express API on port `5001` and Vite on port `5175`. If your setup differs, update both the backend port and the frontend API target.

Example `client/.env` for a direct API URL:

```dotenv
VITE_API_URL=http://127.0.0.1:5001/api
```

If `client/vite.config.js` has a working `/api` proxy, `VITE_API_URL=/api` is also suitable.

### Start the backend

```bash
cd server
npm start
```

### Start the frontend (separate terminal)

```bash
cd client
npm run dev
```

Browser URL used during local development: `http://127.0.0.1:5175`.

## Source Layout

```text
client/
  src/
    components/             Reusable UI, forms, charts and app layout
    context/AuthContext.jsx Authentication state
    hooks/useData.js        Data-fetching hooks
    pages/                  Dashboard, records, details, analytics, auth, settings
    services/api.js         Client API requests
  vite.config.js            Vite dev server configuration

server/
  app.js                    Express app configuration
  server.js                 MongoDB connection + HTTP startup
  config/                   Environment and database utilities
  controllers/              Authentication and record handlers
  middleware/               Cross-cutting request middleware
  models/                   Mongoose schemas
  routes/                   API routing
  services/                 Finance, workspace and sample-data utilities
  validators/               Input validation
  tests/api.test.js         API tests
```

## Modules

- **Authentication:** Register, login, protected sessions/routes.
- **Clients:** CRUD operations and client information.
- **Projects:** Client-linked projects, fees, statuses, priorities, start dates and deadlines.
- **Payments:** Payments linked to projects with date, method, reference and notes.
- **Finance:** Payment totals and remaining balances.
- **Dashboard/analytics:** Business summaries and graphical reporting.

## Backend Connectivity Checks

Check whether the API is listening:

```bash
lsof -nP -iTCP:5001 -sTCP:LISTEN
```

Check the authentication endpoint:

```bash
curl -i http://127.0.0.1:5001/api/auth/me
```

An `HTTP 401` response such as `{"message":"Please sign in to continue."}` is expected if you are not authenticated; it confirms the endpoint is reachable.

If startup reports `EADDRINUSE`, another process already occupies the port. Check the process before terminating it. Do not launch multiple backends on the same port.

## MongoDB Notes

The provided `server.js` verifies MongoDB transaction support using the `hello` command and requires a replica set or compatible MongoDB topology. A standalone MongoDB instance may connect successfully but still fail this startup check. Follow your existing MongoDB setup configuration rather than removing the check without reviewing transaction usage.

## Testing

Tests are in `server/tests/api.test.js`. Check `server/package.json` for the available npm scripts before selecting a test command.

Recommended checks:

- User registration, login, logout, protected access
- Client and project CRUD
- Payment validation and financial totals
- Filtering, search, pagination
- Data isolation between users
- Mobile responsiveness and error messaging

## Git and Documentation

The Git repository is rooted **one directory above** this folder (`Freelancer_Tracker/` on the development machine). To commit changes to both application code and top-level documentation, run Git commands from that repository root.

```bash
cd ..
git status
git add README.md freelanceflow/README.md docs/screenshots/
git commit -m "docs: add professional project documentation"
git push origin main
```

Only run `git push` after verifying the staged changes and checking the configured remote.

## Further documentation

See the [main README](../README.md) for screenshots, a higher-level feature overview, and the public repository link.
