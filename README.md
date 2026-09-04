<p align="center">
  <img src="frontend/public/icon.png" alt="MoneyMirror logo" width="100" />
</p>

# MoneyMirror

**Understand your money. Clearly.**

MoneyMirror is a personal finance web application that turns payment-related Gmail messages into searchable transactions, spending charts, recurring-payment insights, and AI spending analysis. It uses Google OAuth for sign-in, Gemini for transaction extraction and AI insights, and a separate background worker to sync emails while you browse the app.

[Features](#features) · [How it works](#how-it-works) · [Local setup](#local-setup) · [API reference](#api-reference)

## Features

| Feature | What you can do |
| --- | --- |
| Google sign-in | Sign in with Google and grant read-only Gmail access. |
| Gmail transaction import | Extract amount, currency, date, merchant, category, and confidence from matching emails. |
| Background syncing | Queue a sync at login or use **Sync now**, with status polling and transaction refresh after completion. |
| Dashboard | See this month's categorized expenses, category and transaction counts, and your eight most recent transactions. |
| Transaction explorer | Filter by this month, last month, or the last 12 months; search merchants; filter categories; sort by date or amount. |
| Financial charts | Explore monthly spending, category breakdowns, top merchants, and spending by day of the week. |
| Smart subscriptions | Detect recurring charges, inspect confidence and predicted billing dates, and confirm or dismiss detected subscriptions. |
| AI insights | Generate and refresh insights across spending, categories, subscriptions, and lifestyle, with priority and impact metadata. |

The interface and aggregate totals use **Indian rupees (INR)**. Transaction records can store other currency codes, but currency conversion is not implemented.

## Technology

| Layer | Main technologies |
| --- | --- |
| Frontend | React 19, Vite 7, React Router 7, Tailwind CSS 3 |
| Charts and UI | Recharts, Lucide React, Axios |
| Backend | Node.js, Express 5, Mongoose 8 |
| Storage | MongoDB for application data; Redis for background jobs |
| Authentication | Google OAuth 2.0, JSON Web Tokens, HTTP-only cookies |
| Email processing | Gmail API, `html-to-text`, `p-limit` |
| AI | Gemini through `@google/generative-ai` |
| Background work | BullMQ with a standalone sync worker |

The active Gemini calls use `gemini-3.1-flash-lite`, configured in [llmParser.js](backend/src/langchain/llmParser.js) and [insightService.js](backend/src/insights/insightService.js). Despite the directory name, the email parser calls the Google SDK directly; it does not use LangChain.

## How it works

```mermaid
flowchart TD
    Browser[React frontend] -->|Authentication and API requests| API[Express API]
    API <-->|Sign-in and consent| OAuth[Google OAuth]
    API <-->|Users, transactions, subscriptions| DB[(MongoDB)]
    API -->|Enqueue sync for a user| Queue[(Redis / BullMQ)]
    Queue --> Worker[Standalone sync worker]
    Worker -->|Fetch matching messages| Gmail[Gmail API]
    Worker -->|Parse email content| Gemini[Gemini API]
    Worker -->|Save transactions and sync logs| DB
    Browser -->|Poll sync status| API
    API -->|Generate AI insights from aggregates| Gemini
```

### Sign-in and email import

1. Google authorizes profile access and the `gmail.readonly` scope. MoneyMirror stores the Google access and refresh tokens against the user.
2. The API sets a `jwt` cookie with a seven-day lifetime, redirects to the dashboard, and queues a sync job.
3. The worker searches Gmail subjects for payment-related terms, fetches message bodies, converts HTML to readable text, and skips messages already imported.
4. Gemini processes emails in batches of **eight**, returning at most one extracted transaction per email. Structured transactions and a sync log are saved to MongoDB.
5. The frontend polls every **three seconds** and refreshes transaction data after it observes sync completion. Polling stops after approximately two minutes; the server job can continue.

New accounts begin with a sync timestamp **seven days in the past**. Later syncs search from the last recorded sync date. Each sync requests at most **100 matching messages**, with up to **five message fetches** running concurrently; Gmail pagination is not implemented.

The `email-sync` queue uses a job ID derived from the user ID to avoid enqueueing another job while one is waiting, active, or delayed. Jobs retry up to three attempts with exponential backoff. Worker concurrency defaults to five user jobs.

Syncing is triggered by login and manual requests. The file named `emailSyncCron.js` contains the worker's sync helper; the current application does not register a periodic cron schedule.

### Analytics and recommendations

- **Raw insights** use MongoDB aggregation. Monthly trends cover the trailing 12 months; category, merchant, and weekday analyses use a 365-day window.
- **Subscription detection** looks for at least two payments to the same merchant within the lookback window. It scores payment consistency and weekly, monthly, or yearly intervals, predicts the next charge, and saves detected subscriptions. Upcoming renewals cover the next seven days.
- **AI insights** make four concurrent Gemini requests using aggregated spending data. Results are grouped by topic and ranked by impact, urgency, and severity. The frontend caches the response in browser `localStorage`.

Subscription detection does not call Gemini. Importing emails and requesting AI insights do.

## Local setup

### Prerequisites

- Git, npm, and **Node.js 22.12 or later**. The locked Vite version requires Node `^20.19.0 || >=22.12.0`, and backend packages also require Node 20 or newer.
- A running MongoDB instance.
- A running Redis 7 instance.
- A Google Cloud project with the Gmail API enabled and an OAuth web client.
- A Gemini API key with access to the model used in the source.

### 1. Clone and install

```bash
git clone https://github.com/PriyanshChowhan/Money-Mirror.git
cd Money-Mirror
npm ci --prefix backend
npm ci --prefix frontend
```

The frontend and backend have separate package manifests and lockfiles. There is no root npm workspace or root start script.

### 2. Configure Google access

Enable the Gmail API and configure your project's OAuth consent screen. If the OAuth app is in testing mode, add the Google accounts you will use as test users. See Google's [Gmail setup guide](https://developers.google.com/workspace/gmail/api/quickstart/nodejs) for the project and consent setup.

Create an OAuth client of type **Web application** for MoneyMirror's server-side flow, following the [Google web-server OAuth guide](https://developers.google.com/identity/protocols/oauth2/web-server). Register this local redirect URI:

```text
http://localhost:5000/api/auth/google/callback
```

The URI must exactly match `google_redirect_uris` in the backend environment file. The application requests these scopes:

```text
https://www.googleapis.com/auth/gmail.readonly
https://www.googleapis.com/auth/userinfo.email
https://www.googleapis.com/auth/userinfo.profile
```

Create a Gemini key using Google's [API key guide](https://ai.google.dev/gemini-api/docs/api-key). The key belongs in the backend configuration.

### 3. Create the backend environment file

Create `backend/.env.development` with your own values:

```dotenv
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:5173

MONGODB_URI=mongodb://127.0.0.1:27017
JWT_SECRET=replace-with-a-long-random-secret

google_client_id=your-client-id.apps.googleusercontent.com
google_client_secret=your-google-client-secret
google_redirect_uris=http://localhost:5000/api/auth/google/callback

GEMINI_API_KEY=your-gemini-api-key

REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=
SYNC_WORKER_CONCURRENCY=5
```

Generate a random JWT secret with:

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

| Variable | Purpose |
| --- | --- |
| `NODE_ENV` | Selects development or production behavior, including cookie settings. |
| `PORT` | API port; defaults to `5000`. Keep the Vite proxy aligned if changed. |
| `FRONTEND_URL` | Frontend origin for CORS and the post-login redirect. |
| `MONGODB_URI` | Base MongoDB connection URI; the connector appends `/moneymirror`. |
| `JWT_SECRET` | Secret used to sign and verify application session tokens. |
| `google_client_id` | Google OAuth client ID. The lowercase variable name is required. |
| `google_client_secret` | Google OAuth client secret. |
| `google_redirect_uris` | One callback URL, despite the plural variable name. |
| `GEMINI_API_KEY` | API key used for email parsing and AI insights. |
| `REDIS_HOST` | Redis hostname; defaults to `localhost`. |
| `REDIS_PORT` | Redis port; defaults to `6379`. |
| `REDIS_PASSWORD` | Optional Redis password. |
| `SYNC_WORKER_CONCURRENCY` | Concurrent user sync jobs per worker; defaults to `5`. |

**MongoDB URI format:** [connectDB.js](backend/src/db/connectDB.js) directly appends `/moneymirror`. Supply a base URI without a database name, trailing slash, or query string. For example, an Atlas base URI can be `mongodb+srv://USERNAME:PASSWORD@YOUR_CLUSTER.mongodb.net`. If you need connection-string query options, adjust the connector to accept a complete URI first.

Keep environment files and credentials out of version control and Docker build contexts. Check the exclusions in your checkout before staging files or building images with local secrets present.

### 4. Start MongoDB and Redis

Use existing local services, or run these development containers if Docker is available:

```bash
docker run -d --name moneymirror-mongo -p 127.0.0.1:27017:27017 -v moneymirror-mongo:/data/db mongo:7
docker run -d --name moneymirror-redis -p 127.0.0.1:6379:6379 redis:7-alpine
```

If using a hosted MongoDB instance, configure its database credentials and network access instead of starting the local MongoDB container.

### 5. Run the API, worker, and frontend

Open **three terminals**, starting each in the repository root.

**Terminal 1 — API**

```bash
cd backend
node --watch --env-file=.env.development src/index.js
```

**Terminal 2 — Gmail sync worker**

```bash
cd backend
node --watch --env-file=.env.development src/workers/syncWorker.js
```

**Terminal 3 — frontend**

```bash
cd frontend
npm run dev -- --port 5173 --strictPort
```

Open [MoneyMirror locally](http://localhost:5173), select **Continue with Google**, and grant the requested access. The dashboard opens while the initial import runs. Use **Sync now** to request another import.

The frontend makes relative `/api` requests. [vite.config.js](frontend/vite.config.js) proxies these to `http://localhost:5000`, so no frontend environment file is required.

The explicit [`--env-file` option](https://nodejs.org/api/cli.html#--env-filefile) loads configuration before ES module imports execute. This matters because Redis connection options and the CORS origin are read during module initialization, before the entry file's `dotenv.config()` call runs.

## Available commands

| Directory | Command | Purpose |
| --- | --- | --- |
| `frontend` | `npm run dev` | Start Vite's development server. |
| `frontend` | `npm run build` | Build the frontend into `frontend/dist`. |
| `frontend` | `npm run preview` | Preview the built frontend; API routing must be configured separately. |
| `backend` | `npm run dev` | Run the API with nodemon; use the preloaded-environment commands above for reliable custom configuration. |
| `backend` | `node --env-file=.env.development src/workers/syncWorker.js` | Start the separate worker without watch mode. |

## API reference

Protected endpoints accept the `jwt` cookie or `Authorization: Bearer <token>`. The JWT must correspond to an existing user. Google OAuth access tokens are separate credentials and cannot replace the application JWT.

| Method | Endpoint | Authentication | Behavior |
| --- | --- | --- | --- |
| GET | `/api/auth/google` | Public | Redirect to Google's authorization screen. |
| GET | `/api/auth/google/callback` | OAuth callback | Exchange `code`, set the session cookie, redirect, and enqueue sync. |
| GET | `/api/auth/profile` | Required | Return the user's name and email. |
| GET | `/api/auth/frontend-protect` | Required | Return basic user data and `gmailConnected`. |
| POST | `/api/auth/logout` | Required | Clear the session cookie. |
| POST | `/api/gmail/sync` | Required | Return `202 Accepted` with `queued` or `already_syncing`. |
| GET | `/api/gmail/sync/status` | Required | Return the queue state and a failure reason when available. |
| GET | `/api/transactions/getTransactions` | Required | Return all user transactions, newest first. |
| GET | `/api/transactions/getTransactionsByRange` | Required | Filter using `range`, `start`, and/or `end`. |
| GET | `/api/insights/raw` | Required | Return monthly, category, merchant, and weekday aggregates. |
| GET | `/api/insights/ai` | Required | Generate Gemini insights and return grouped results with metadata. |
| GET | `/api/insights/raw/subscriptions` | Required | Detect and persist recurring charges; return subscriptions, renewals, and totals. |
| POST | `/api/insights/subscriptions/:id/confirm` | Required | Confirm a detected subscription belonging to the user. |
| POST | `/api/insights/subscriptions/:id/dismiss` | Required | Dismiss a detected subscription and suppress it from future detection results. |

Supported transaction ranges are `this-month`, `last-month`, and `last-12-months`. Explicit `start` and `end` dates override the corresponding range boundaries:

```text
GET /api/transactions/getTransactionsByRange?range=this-month
GET /api/transactions/getTransactionsByRange?start=2026-08-01&end=2026-08-31T23:59:59.999Z
```

## Project structure

```text
Money-Mirror/
├── .github/workflows/deploy.yml    # Build, push, and deploy on pushes to main
├── assets/                        # Screenshots from an earlier UI
├── backend/
│   ├── src/
│   │   ├── controllers/           # Auth, Gmail, transactions, insights handlers
│   │   ├── cron/emailSyncCron.js   # Per-user sync and token-refresh helper
│   │   ├── db/connectDB.js        # MongoDB connection
│   │   ├── helpers/gmail/         # OAuth, fetching, parsing, persistence
│   │   ├── insights/              # Aggregations, subscriptions, AI
│   │   ├── langchain/llmParser.js # Direct Gemini calls for email parsing
│   │   ├── middlewares/authjwt.js # JWT verification and user lookup
│   │   ├── models/                # User, Transaction, SyncLog, Subscription
│   │   ├── queues/syncQueue.js    # BullMQ queue, enqueueing, and status
│   │   ├── routes/                # Express API routes
│   │   ├── scripts/seedMockData.js # Development data generator
│   │   ├── utils/generateTokens.js
│   │   ├── workers/syncWorker.js  # Standalone queue consumer
│   │   ├── app.js                 # Middleware and route registration
│   │   └── index.js               # API entry point
│   ├── Dockerfile
│   ├── package.json
│   └── package-lock.json
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── assets/                # Login illustration and static assets
│   │   ├── components/            # Layout, navbar, protected routes
│   │   ├── hooks/useSyncStatus.js # Manual sync and status polling
│   │   ├── pages/                 # Login, dashboard, transactions, insights,
│   │   │                          # subscriptions, legal pages, 404
│   │   ├── App.jsx                # Application routes
│   │   └── main.jsx               # React entry point
│   ├── Dockerfile
│   ├── nginx.conf                 # Static serving and SPA fallback
│   ├── vite.config.js             # Development API proxy
│   ├── package.json
│   └── package-lock.json
├── nginx/default.conf             # Reverse proxy and TLS configuration
└── docker-compose.yml             # Nginx, frontend, API, Redis, worker
```

The dashboard's source filename is `Dasboard.jsx`. Smart subscriptions are embedded in `/insights`. Public pages are `/`, `/privacy`, and `/terms`; `/dashboard`, `/transactions`, `/insights`, and `/ai` require sign-in.

## Sample data

[seedMockData.js](backend/src/scripts/seedMockData.js) creates recurring payments, recent expenses, older transactions, and a manual subscription. It writes directly to MongoDB and does not call Gemini.

**Use a development database:** the script deletes all transactions and subscriptions for its hardcoded `userId` before inserting replacements. It does not create a user. First sign in to your local app, then replace the script's `userId` with that development user's MongoDB `_id`.

After checking the target database and user, run from `backend`:

```bash
node --env-file=.env.development src/scripts/seedMockData.js
```

## Author

[Priyansh Chowhan](https://github.com/PriyanshChowhan)
