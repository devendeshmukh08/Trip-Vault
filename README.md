# 🧳 Trip Vault
 
**Every ticket, booking, plan and memory for your trips — in one place.**
 
Trip Vault is a full-stack travel companion. Create a trip, upload every document related to it (itinerary PDFs, hotel bookings, train tickets, visas), build a day-by-day checklist you can tick off as you go, let AI draft or adapt your plan, and keep a photo memory album — all behind your own private account.
 
> Live demo: `https://trip-vault-lime.vercel.app/` &nbsp;|&nbsp; Source: `https://github.com/devendeshmukh08/Trip-Vault`
 
<!-- Add screenshots here: home, trip plan timeline, documents, memories -->
 
---
 
## ✨ Features
 
- **Accounts** – email + password sign-up and login. Every user only ever sees their own trips.
- **Trips** – name, destination, dates and an icon. Trip cards show a countdown ("In 12 days", "Happening now", "Completed") and overall progress.
- **Itinerary as a checklist** – add stops manually with an optional day and time, grouped into a day-by-day timeline. Tick items off as you cover them.
- **AI planner** – describe the trip you want and get a draft itinerary. If you already have a plan, the AI adapts it and avoids duplicates. Optionally replace only your unfinished items.
- **PDF itinerary import** – upload an itinerary PDF; the text is extracted on the server and turned into checklist items by AI. The PDF is also saved in Documents.
- **Document vault** – upload tickets, hotel bookings, IDs and more, organised by category (Itinerary, Hotel, Tickets, ID & Visa, Insurance, Other).
- **Memory album** – upload trip photos into a gallery.
- **Responsive, dark-mode aware UI** – timeline layout with a sticky sidebar on desktop, stacked on mobile.
## 🧱 Tech stack
 
| Layer | Choice |
|---|---|
| Framework | Next.js 15 (App Router, Server Components, Server Actions) |
| Language | TypeScript, React 19 |
| Database | Neon (serverless Postgres) via `@neondatabase/serverless` |
| File storage | Vercel Blob (client-side direct uploads) |
| AI | Anthropic API (`@anthropic-ai/sdk`) |
| PDF text extraction | `unpdf` |
| Auth | Custom: `scrypt` password hashing + database-backed sessions |
| Styling | Plain CSS (`app/globals.css`), `next/font` (Plus Jakarta Sans) |
| Hosting | Vercel |
 
## 🗺️ Architecture
 
```
Browser ──► Next.js (Vercel)
              ├─ Server Components  → read data from Neon
              ├─ Server Actions     → all writes (trips, items, files), AI, PDF import
              ├─ /api/blob          → issues upload tokens for Vercel Blob
              └─ middleware.ts      → cheap cookie check, redirects to /login
 
Browser ──(direct upload)──► Vercel Blob      (files never pass through serverless limits)
Server Action ──► Neon Postgres               (metadata, users, sessions)
Server Action ──► Anthropic API               (itinerary generation / extraction)
```
 
**Key design decisions**
 
- **Server Actions instead of a REST API** – less boilerplate, type-safe calls, and revalidation of pages after each mutation.
- **Direct-to-Blob uploads** – the browser uploads files straight to Vercel Blob, so large PDFs and photos avoid the ~4.5 MB serverless request limit. Only the file metadata is saved in Postgres.
- **Own authentication** – passwords are hashed with `scrypt` and a per-user salt. A login creates a random session token stored in an `httpOnly` cookie; only the SHA-256 hash of that token is stored in the database, so a database leak cannot be used to hijack sessions.
- **Ownership checks everywhere** – every trip-scoped action verifies that the trip belongs to the signed-in user. File URLs are validated before saving, and PDF import only fetches files already attached to the user's own trip.
- **Edge-safe middleware** – middleware only checks that a session cookie exists (the Edge runtime can't use Node crypto or run these queries); the real session validation happens in `getUser()` / `requireUser()` on the server.
- **AI kept server-side** – the Anthropic key never reaches the browser.
## 📁 Project structure
 
```
trip-vault/
├─ app/
│  ├─ actions.ts            # Server Actions: auth, trips, items, files, AI, PDF import
│  ├─ layout.tsx            # Root layout + top nav
│  ├─ page.tsx              # Home: trip cards + new trip form
│  ├─ globals.css           # Design system / styles
│  ├─ login/page.tsx
│  ├─ signup/page.tsx
│  ├─ trips/[id]/page.tsx   # Trip view: Plan, Documents, Memories tabs
│  └─ api/blob/route.ts     # Upload token endpoint for Vercel Blob
├─ components/
│  ├─ AuthForm.tsx          # Shared login / signup form (client)
│  ├─ AuthShell.tsx         # Split-screen auth layout
│  └─ Uploader.tsx          # Direct-to-Blob uploader (documents, photos, PDF import)
├─ lib/
│  ├─ auth.ts               # Hashing, sessions, getUser / requireUser
│  ├─ db.ts                 # Neon client + row types
│  └─ ui.ts                 # Shared UI helpers and constants (gradients, dates, CATS)
├─ scripts/init-db.mjs      # Applies schema.sql to your database
├─ schema.sql               # Database schema
├─ middleware.ts            # Route gate
└─ .env.example
```
 
## 🗄️ Database schema
 
| Table | Purpose |
|---|---|
| `users` | id, email (unique), name, password_hash |
| `sessions` | token_hash (pk), user_id, expires_at |
| `trips` | id, user_id, name, destination, start/end date, emoji |
| `items` | id, trip_id, day, time, title, done |
| `files` | id, trip_id, kind (`doc` or `photo`), category, name, mime, size, url, caption |
 
Deleting a user cascades to their trips, items and files rows. Deleting a trip also removes its stored blobs.
 
## 🚀 Getting started
 
### Prerequisites
- Node.js 20+
- A [Neon](https://neon.tech) project (free tier is fine)
- An [Anthropic API key](https://console.anthropic.com) (billed separately from a Claude.ai subscription)
- A Vercel account (for Blob storage and deployment)
### 1. Install
```bash
git clone https://github.com/devendeshmukh08/Trip-Vault.git
cd Trip-Vault
npm install
```
 
### 2. Configure environment
```bash
cp .env.example .env.local
```
Fill in the values:
 
| Variable | Where to get it |
|---|---|
| `DATABASE_URL` | Neon dashboard → **Connect** → copy the connection string (reveal the password first) |
| `BLOB_READ_WRITE_TOKEN` | Vercel project → **Storage** → create a Blob store. For local use, run `vercel env pull .env.local` or copy the token |
| `ANTHROPIC_API_KEY` | Claude Console → **API Keys** → Create Key |
| `ANTHROPIC_MODEL` | Optional. Defaults to `claude-sonnet-5-5` |
 
### 3. Create the tables
```bash
npm run db:init
```
You should see `Schema ready ✔`. (Alternatively, paste `schema.sql` into the Neon SQL Editor and run it.)
 
### 4. Run
```bash
npm run dev
```
Open http://localhost:3000, create an account at `/signup`, and add your first trip.
 
## ☁️ Deploying to Vercel
 
1. Push the repo to GitHub.
2. Import it in Vercel.
3. Under **Storage**, create a **Blob** store and connect it to the project (this adds `BLOB_READ_WRITE_TOKEN`).
4. Under **Settings → Environment Variables**, add `DATABASE_URL`, `ANTHROPIC_API_KEY` and `ANTHROPIC_MODEL` for Production, Preview and Development.
5. **Redeploy** — environment variable changes only apply to new deployments.
Neon is already a hosted database, so there is nothing to deploy for it. Make sure you ran `npm run db:init` against the same database your `DATABASE_URL` points to.
 
## 🔒 Security notes
 
- Never commit `.env*` files. They are listed in `.gitignore`.
- If a key or database password is ever exposed, rotate it immediately.
- Uploaded files are stored on Vercel Blob with public, unguessable URLs. That is fine for a personal project or demo, but highly sensitive documents (passports, IDs) would call for private storage with signed, expiring links.
- AI itinerary output is a draft — always double-check opening hours, bookings and travel times.
## ⚠️ Known limitations
 
- No password reset or email verification yet (both need an email provider).
- Scanned image-only PDFs have no extractable text, so they can't be imported as itineraries (they can still be stored as documents).
- Trips and items can't be edited after creation yet — only added or deleted.
- Photos open in a new tab rather than an in-app lightbox.
- No automated tests yet.
## 🛣️ Roadmap
 
- [ ] Password reset and email verification
- [ ] Edit trips and itinerary items; drag-and-drop reordering
- [ ] Photo lightbox with captions
- [ ] Private file storage with signed URLs
- [ ] Packing checklist and expense tracker
- [ ] Read-only trip sharing link
- [ ] Demo account with seed data
- [ ] Unit and end-to-end tests (Vitest, Playwright)
## 📜 Scripts
 
| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run start` | Run the production build |
| `npm run db:init` | Apply `schema.sql` to the database in `.env.local` |
 
## 👤 Author
 
Built by **Deven Deshmukh** — [GitHub](https://github.com/devendeshmukh08)
 
## 📄 License
 
MIT — add a `LICENSE` file if you want to open-source it.
 
