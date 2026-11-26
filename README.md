# 🧳 Trip Vault
One place for every trip: documents (tickets, bookings, IDs), a to-do itinerary you can tick off, an AI planner, PDF itinerary import and a photo memory album.

**Stack:** Next.js 15 (App Router, Server Actions) · TypeScript · Neon Postgres · Vercel Blob · Anthropic API · deployed on Vercel.

## Run locally
```bash
npm install
cp .env.example .env.local   # fill in the values
npm run db:init              # creates the tables in Neon
npm run dev
```
## Deploy
Push to GitHub → import in Vercel → add a Blob store (Storage tab) → add the env vars from `.env.example` → deploy.

## Auth
Email + password sign-up, scrypt-hashed passwords, random session tokens (only their SHA-256 is stored), httpOnly cookies. Every trip action checks ownership.

## How it works
- `schema.sql` – trips, items, files tables
- `app/actions.ts` – all mutations (server actions) + AI + PDF import
- `components/Uploader.tsx` – browser uploads straight to Vercel Blob, then a server action saves the metadata
- `middleware.ts` – session auth helpers + route gate
