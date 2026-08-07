# Zevora Styles

Ethnic D2C e-commerce for **Zevora Styles** — kurtis, dupattas, and kurta sets. Built for integration with **Resolvr** (autonomous dispute resolution).

## Stack

| Layer | Tech |
|-------|------|
| Frontend | Next.js (later) — `frontend/` |
| Backend | Express + TypeScript — `backend/` |
| Database | MongoDB + Mongoose |
| Payments | Razorpay mock (no real keys) |

## Ports

| Service | URL |
|---------|-----|
| Express API | http://localhost:4000 |
| Next.js (later) | http://localhost:3000 |
| MongoDB | mongodb://localhost:27017/zevora |

## Quick start

```bash
# Start MongoDB
docker compose up -d

# Backend
cd backend
cp .env.example .env
npm install
npm run seed    # seed products, users, demo order ORD-7842
npm run dev     # http://localhost:4000
```

## Demo accounts (after seed)

| Email | Password | Role |
|-------|----------|------|
| `arjun@demo.com` | `demo1234` | customer |
| `fake@demo.com` | `demo1234` | customer |
| `admin@zevora.com` | `admin1234` | admin |

## Demo fixtures

- Order: `ORD-7842` — Jaipur Kurti, Rs 1,299, serial `ZS-001-2847`
- Auto-resolve cap: Rs 800 (HITL triggers above this)
- Policy clause: `4.2` — damaged on arrival

## API overview

- `POST /api/auth/register` · `POST /api/auth/login`
- `GET /api/catalog/products` · `GET /api/catalog/products/:sku`
- `GET /api/cart` · `POST /api/cart/items`
- `POST /api/checkout/preview` · `POST /api/checkout/create-order`
- `POST /api/payments/initiate` · `POST /api/payments/mock/confirm`
- `GET /api/orders` · `GET /api/orders/:orderId`
- `POST /api/disputes` — open dispute
- `GET /api/admin/*` — admin routes (JWT + admin role)
- `GET /api/resolvr/*` — Resolvr integration (`X-Resolvr-Key` header)

## Resolvr integration

Resolvr (separate repo) calls internal routes with header:

```text
X-Resolvr-Key: <RESOLVR_API_KEY from .env>
```

Key endpoints:

- `GET /api/resolvr/orders/:orderId`
- `GET /api/resolvr/orders/:orderId/delivery`
- `GET /api/resolvr/customers/:userId/history`
- `POST /api/resolvr/refunds`
- `POST /api/resolvr/notify`
- `POST /api/resolvr/disputes` · `PATCH /api/resolvr/disputes/:id`
- `GET /api/resolvr/policy`

## Health check

```bash
curl http://localhost:4000/api/health
```
