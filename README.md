# Stockton Found Dogs

A community site for reporting and reuniting found dogs in Stockton, CA.
Finders post a photo, location, and details; the public browses a map or
list of unclaimed dogs; claimants submit a proof-of-ownership form; the
finder gets notified by email and reaches out directly. No accounts, no
public contact info.

## Local development

The app uses Postgres (Prisma) and Vercel Blob storage — both provisioned
from the Vercel dashboard. Point your local `.env` at the same instances
used in production (or a dev branch of them):

```bash
npm install
npx prisma migrate dev   # applies schema to the Postgres DB in DATABASE_URL
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Only `DATABASE_URL` is required to run locally — see "Dev-mode stand-ins"
below for what's mocked out otherwise.

## Dev-mode stand-ins (no external services needed)

This app is built so you can run the whole flow — post a dog, browse the
map, submit a claim, get notified, resolve the listing — with minimal setup.

- **Database**: Postgres via Prisma. `DATABASE_URL` in `.env` must point at
  a real Postgres instance — [Vercel Postgres/Neon](https://vercel.com/marketplace/neon)
  works well and is what production uses.
- **Email**: if `RESEND_API_KEY` is unset in `.env`, outgoing emails (magic
  links, claim notifications) are logged to the `DevEmail` table instead of
  sent, viewable at [/dev/emails](http://localhost:3000/dev/emails). Set
  `RESEND_API_KEY` (from [resend.com](https://resend.com), free tier covers
  this site's volume) to send real email — `/dev/emails` goes empty
  automatically once that's set.
- **Photo storage**: if `BLOB_READ_WRITE_TOKEN` is unset, uploads are saved
  locally to `public/uploads/`. Set it (from the Vercel dashboard's Storage
  tab) to upload to Vercel Blob instead — used automatically in production
  since Vercel's filesystem isn't persistent.
- **Map**: Leaflet + OpenStreetMap tiles, no API key required.
- **CAPTCHA**: not wired up yet. Anti-spam for now is a honeypot field plus
  IP-based rate limiting (`src/lib/rateLimit.ts`, in-memory — fine for a
  single instance, swap for Upstash Redis if this ever scales to multiple
  server instances). Add [Cloudflare Turnstile](https://www.cloudflare.com/products/turnstile/)
  before a public launch if spam becomes a problem.

## How it works

- **No accounts.** A finder posts a listing with their email. They get a
  private "manage" link (`/manage/[token]`) by email — no password, no
  login. Anyone with that link can resolve or delete the listing, so it's
  treated like a secret.
- **Claims are reviewed, not automatic.** Multiple people can claim the same
  dog. The finder sees every claim's proof answer and contact info in their
  manage page and decides who to actually contact — this discourages
  scammers who troll these sites.
- **Contact info stays one-directional.** The finder's email is never
  exposed via the public API (see the `select` clause in
  `src/app/api/dogs/[id]/route.ts`). Only the claimant's contact info is
  shared, and only with the finder, by email.
- **Listings expire.** `expiresAt` is set 30 days out at creation
  (`LISTING_LIFETIME_DAYS` in `src/lib/constants.ts`). There's no cron job
  wired up yet to actually expire/email about renewal — that's the next
  thing to add before a real launch (a scheduled job that flips `active` →
  `expired` past `expiresAt` and emails the finder a reminder a few days
  before).

## What's not built yet (roadmap)

- Lost-dog reports (the mirror flow — owners post a last-seen location and
  *do* show contact info), plus proximity matching between the two.
- Listing expiry cron job + renewal email.
- Admin moderation page / report-listing button.
- Real CAPTCHA (Turnstile).

## Deploying

Deploys cleanly to [Vercel](https://vercel.com):

1. Import the GitHub repo into Vercel.
2. Add the **Neon (Postgres)** and **Blob** storage integrations from the
   Vercel Marketplace/Storage tab — this sets `DATABASE_URL` and
   `BLOB_READ_WRITE_TOKEN` automatically.
3. Set `RESEND_API_KEY` and `EMAIL_FROM` so real email goes out (optional —
   without it, emails just log to `/dev/emails`).
4. Set `NEXT_PUBLIC_BASE_URL` to your production domain (used to build
   magic-link and claim-notification URLs in emails).
5. Deploy. The build runs `prisma migrate deploy` automatically
   (`package.json`'s `build` script), applying the schema to the fresh
   Postgres database.
