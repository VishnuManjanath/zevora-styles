# Zevora Styles

Ethnic D2C e-commerce for **Zevora Styles** — kurtis, dupattas, and kurta sets. Built for integration with **Resolvr** (autonomous dispute resolution).

## Stack

| Layer | Tech |
|-------|------|
| Frontend | Next.js 15 + Tailwind — `frontend/` |
| Backend | Express + TypeScript — `backend/` |
| Database | MongoDB + Mongoose |
| Payments | Razorpay mock + COD |

## Ports

| Service | URL |
|---------|-----|
| Next.js storefront + admin | http://localhost:3000 |
| Express API | http://localhost:4000 |
| MongoDB | mongodb://localhost:27017/zevora |
| API docs | http://localhost:4000/api/docs |

## Quick start

MongoDB must run as a single-node **replica set** (the backend uses transactions for order/refund atomicity).

```bash
# First time: use docker-compose, it auto-initiates the replica set via healthcheck
docker compose up -d

# Already have a plain zevora-mongo container? Recreate it with replSet enabled:
docker rm -f zevora-mongo
docker run -d --name zevora-mongo -p 27017:27017 -v zevora_mongo_data:/data/db mongo:7 --replSet rs0
docker exec zevora-mongo mongosh --quiet --eval "rs.initiate({_id:'rs0', members:[{_id:0, host:'localhost:27017'}]})"

# Later, just: docker start zevora-mongo

# Backend
cd backend
cp .env.example .env
npm install
npm run seed
npm run dev          # http://localhost:4000

# Frontend (new terminal)
cd frontend
cp .env.local.example .env.local
npm install
npm run dev           # http://localhost:3000
```

## Frontend

Elegant, editorial-style ethnic fashion storefront (Cormorant Garamond serif + DM Sans, warm cream/terracotta palette) built with Next.js App Router, fully wired to the Express API:

- **Storefront**: home, shop/category browsing with sort, product detail with size/variant selection, cart, checkout (address book, Razorpay mock modal, COD), order confirmation.
- **Account**: order history, order tracking timeline, cancel order, addresses, dispute chat (report issue → messages → evidence upload → live-capture stub).
- **Admin** (dedicated login at `/admin/login`, separate from the customer login page): dashboard stats, product catalog CRUD, order status/tracking management, dispute review with HITL approve/reject, manual refunds, policy & auto-resolve cap configuration.

Set `NEXT_PUBLIC_API_URL` in `frontend/.env.local` to point at the backend (defaults to `http://localhost:4000`).

## Everything is live — no mock data

`npm run seed` only creates the **catalog** (categories, products, variants), the **policy pack**, and the **one admin account** needed to sign into `/admin/login`. It does **not** create any customers, addresses, orders, payments, deliveries, or disputes.

That means the demo is genuinely end-to-end:

1. A shopper registers on `/register` and shops normally.
2. An order only exists in the system — and only shows up in `/admin/orders` — because it was actually placed via the storefront checkout (Razorpay mock or COD).
3. A dispute only exists because a customer opened one from their real order in `/account/orders/:id`.

| Email | Password | Role |
|-------|----------|------|
| `admin@zevora.com` | `admin1234` | admin (sign in at `/admin/login`) |

Everything else — customer accounts, addresses, orders, disputes — is created by actually using the storefront.

## E-commerce features

- Auth (register, login, JWT)
- Catalog (categories, products, search, filters)
- Guest + user cart
- Addresses CRUD
- Checkout preview + create order
- **Razorpay mock** (initiate + success/fail)
- **COD** orders (pay on delivery)
- Order history, tracking, cancel (unpaid)
- Open dispute, messages, evidence upload, capture session
- Notifications (in-app + mock SMS/email log)
- Admin dashboard, products, orders, disputes, policy, HITL, refunds

## Deploying to Railway

This is a monorepo with two independently deployable apps (`backend/`, `frontend/`), plus a database. Railway deploys straight from GitHub, so push this repo first, then set up **three** pieces: a MongoDB database, the backend service, and the frontend service.

### 0. Push to GitHub

```bash
git add -A
git commit -m "Prepare for Railway deployment"
git push
```

### 1. Database — MongoDB Atlas (not Railway's Mongo plugin)

The backend uses Mongoose **transactions** (order/refund atomicity), which require MongoDB to run as a replica set. Railway's built-in Mongo template runs a single standalone `mongod`, so transactions fail there. MongoDB Atlas's free **M0** tier is a proper replica set out of the box, so use that instead:

1. Create a free cluster at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas).
2. Database Access → add a user + password.
3. Network Access → add `0.0.0.0/0` (allow access from anywhere, since Railway's outbound IPs aren't static).
4. Copy the connection string (`mongodb+srv://<user>:<password>@.../zevora?retryWrites=true&w=majority`) — this is your `MONGODB_URI`.

### 2. Backend service on Railway

1. Railway dashboard → **New Project → Deploy from GitHub repo** → select this repo.
2. On the created service: **Settings → Root Directory** → `backend`.
3. **Variables**, add:
   - `MONGODB_URI` — the Atlas connection string from step 1
   - `JWT_SECRET` — any long random string
   - `RESOLVR_API_KEY` — any long random string (share this with Resolvr)
   - `CORS_ORIGIN` — leave as `http://localhost:3000` for now, you'll update it in step 4
   - `NODE_ENV` — `production`
   - (`PORT` is injected automatically by Railway — don't set it manually)
4. **Settings → Networking → Generate Domain** to get a public URL like `zevora-backend.up.railway.app`.
5. Deploy will pick up `backend/railway.json` automatically (build: `npm run build`, start: `npm run start`, health check: `/api/health`).
6. Seed the production database once, from your machine, using the Atlas URI directly:
   ```bash
   cd backend
   MONGODB_URI="<atlas-uri>" JWT_SECRET=x RESOLVR_API_KEY=x npm run seed
   ```
   This only creates the catalog, policy pack, and the admin account — no mock orders (see below).

### 3. Frontend service on Railway

1. Same project → **New → GitHub Repo** → this repo again (creates a second service).
2. **Settings → Root Directory** → `frontend`.
3. **Variables**, add:
   - `NEXT_PUBLIC_API_URL` — the backend's public URL from step 2.4 (e.g. `https://zevora-backend.up.railway.app`)
4. **Settings → Networking → Generate Domain** to get the storefront's public URL.
5. Deploy picks up `frontend/railway.json` automatically (build: `npm run build`, start: `npm run start`).

### 4. Close the loop: update backend CORS

Now that the frontend has a public URL, go back to the **backend** service's variables and set:

```
CORS_ORIGIN=https://<your-frontend-domain>.up.railway.app
```

(Comma-separate multiple origins if needed, e.g. to also keep `http://localhost:3000` for local testing against the prod API.) Redeploy the backend for this to take effect.

### Known limitation

Admin-uploaded product images and dispute evidence uploads are written to local disk (`backend/uploads/`). Railway's filesystem is ephemeral, so uploaded files won't survive a redeploy. Fine for a live demo; swap in S3/Cloudinary if you need persistence.

## Resolvr integration

Header: `X-Resolvr-Key` (from `backend/.env`)

| Endpoint | Tool |
|----------|------|
| `GET /api/resolvr/orders/:orderId` | get_order |
| `GET /api/resolvr/orders/:orderId/delivery` | get_delivery_status |
| `GET /api/resolvr/customers/:userId/history` | get_customer_history |
| `POST /api/resolvr/refunds` | issue_refund (guardrailed) |
| `POST /api/resolvr/notify` | notify |
| `POST/PATCH /api/resolvr/disputes` | create/update_dispute |
| `GET /api/resolvr/policy` | get_policy_pack |
| `POST /api/resolvr/returns/pickup` | create_return_pickup |
| `POST /api/resolvr/inventory/restock` | restock_item |
| `POST /api/resolvr/payouts` | payout_link (COD refunds) |

Auto-resolve cap: **Rs 800** (80000 paise). Clause **4.2** = damaged on arrival.
