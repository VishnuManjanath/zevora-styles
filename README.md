# Zevora Styles

Ethnic D2C e-commerce for **Zevora Styles** — kurtis, dupattas, and kurta sets. Built for integration with **Resolvr** (autonomous dispute resolution).

## Stack

| Layer | Tech |
|-------|------|
| Frontend | Next.js (later) — `frontend/` |
| Backend | Express + TypeScript — `backend/` |
| Database | MongoDB + Mongoose |
| Payments | Razorpay mock + COD |

## Ports

| Service | URL |
|---------|-----|
| Express API | http://localhost:4000 |
| Next.js (later) | http://localhost:3000 |
| MongoDB | mongodb://localhost:27017/zevora |
| API docs | http://localhost:4000/api/docs |

## Quick start

```bash
docker start zevora-mongo   # or: docker run -d --name zevora-mongo -p 27017:27017 mongo:7

cd backend
cp .env.example .env
npm install
npm run seed
npm run dev
```

## Demo accounts

| Email | Password | Role |
|-------|----------|------|
| `arjun@demo.com` | `demo1234` | customer |
| `fake@demo.com` | `demo1234` | customer (fraud demos) |
| `admin@zevora.com` | `admin1234` | admin |

## Demo orders (after seed)

| Order | User | Purpose |
|-------|------|---------|
| `ORD-7842` | Arjun | HITL beat — Rs 1,299, serial `ZS-001-2847` |
| `ORD-7843` | fake@ | Fraud beat — serial `ZS-001-9912` |
| `ORD-7844` | Arjun | Auto-resolve under Rs 800 cap |
| `ORD-7840` | Arjun | Delivery delay (stuck at hub) |

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
