# Reis Perfumes — Full-Stack Site (Public + Admin Gateway)

A production-shaped full-stack app for Reis Perfumes: a public storefront and a
hidden admin control panel, built on **Vite + React + TypeScript** with
**Supabase** (Postgres, Auth, Storage) as the persistent backend.

## What's real here

- **Database schema, RLS policies, and storage policies** — actual SQL migrations in
  `supabase/migrations/`, meant to be run against your Supabase project as-is.
- **Hidden admin gateway** — the admin login/dashboard live at a path defined by
  `VITE_ADMIN_PATH` (see below). Nothing on the public site links to it. Getting
  the URL still isn't enough: sign-in requires a real Supabase Auth account whose
  `profiles.role = 'admin'`, and every table is also protected by RLS server-side —
  so hiding the button is UX polish, not the actual security boundary.
- **Products, categories, contact methods, inquiries** — full CRUD from the admin
  panel, reading from real Supabase tables, RLS-scoped so the public only ever sees
  published products and enabled contact methods.
- **Image upload to Supabase Storage** — validated client-side (type/size), uploaded
  to the `product-images` bucket, with a safe replace flow (upload new → confirm →
  only then delete old).
- **Audit logging** — written by Postgres triggers on products/images/contact
  methods/workflows, not application code, so it can't be bypassed from the browser.
- **Workflow system** — a minimal but functional trigger → nodes → execution model:
  create/enable/disable/run/retry workflows, with a real execution history
  (pending/running/success/failed, retry count, error message). Node execution
  itself implements `log` fully; `condition`, `database_action`, `storage_action`,
  and `notification` are wired up as extension points — see
  `src/utils/workflowEngine.ts` for exactly what to fill in for your specific
  business logic. This is deliberately the useful subset, not a clone of n8n.

## What you still need to do

I can't connect to your live Supabase project or deploy this from my side — this
was built and reviewed for correctness, but not run against a live database or
built/deployed by me. Before you treat it as production:

1. Run both migrations against your Supabase project (SQL editor or `supabase db push`).
2. Create your own admin user and promote it — see
   `supabase/migrations/0003_seed_admin_note.sql`.
3. Fill in `.env` from `.env.example` and run `npm install && npm run build` yourself
   to confirm a clean build in your environment.
4. Walk through the end-to-end flow once yourself (create product → upload image →
   confirm it appears publicly → edit → delete) before pointing customers at it.

## Getting started

```bash
npm install
cp .env.example .env   # fill in your Supabase URL/key and admin path
npm run dev
```

## Environment variables

| Variable | Purpose |
|---|---|
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Your Supabase **anon/public** key only — never the service_role key |
| `VITE_ADMIN_PATH` | The admin gateway's URL path, e.g. `/gateway-7f3k1`. Pick your own unguessable value; it is not linked anywhere in the public site |

**Rotate any key that was ever pasted into a chat, doc, or prompt before you
treat this as production** — anon keys are safe to ship in a built frontend
(RLS is what actually protects your data), but a key that's been shared in
plaintext elsewhere is good hygiene to rotate regardless.

## Supabase setup

1. Create a Supabase project (or use an existing one).
2. In the SQL editor, run `supabase/migrations/0001_init.sql`, then
   `supabase/migrations/0002_storage.sql`.
3. In **Authentication → Users**, manually create your first admin user (there is
   no public sign-up form by design — admin accounts are provisioned, not
   self-registered).
4. Run the promotion query in `0003_seed_admin_note.sql` with that user's email.

## Admin usage

Visit `/<your VITE_ADMIN_PATH>/login`. From the dashboard you can manage:

- **Products** — create/edit/delete, publish/unpublish, upload/replace images, feature on homepage.
- **Contact Methods** — add/edit/enable/disable/delete WhatsApp, Telegram, phone, email channels. The public site's "Order" buttons pull from this automatically.
- **Inquiries** — everything submitted through the public contact form.
- **Workflows** — define trigger → node sequences, run manually, view execution history, retry failures.
- **Activity Log** — read-only feed of every database-level change, written by triggers.

## Security notes

- RLS is enabled on every table. Public (anon) access is read-only and scoped to
  published products, enabled contact methods, and categories — everything else
  (workflows, executions, audit logs, drafts) requires `profiles.role = 'admin'`.
  Inquiries are insert-only for the public (no read access), so a visitor can
  submit a message but never read anyone else's.
- Storage policies mirror this: public read on `product-images`, admin-only
  insert/update/delete.
- The admin route path is obscurity, not the security boundary — treat it as a
  nice-to-have that reduces noise, not as protection on its own.

## Project structure

```
src/
  lib/supabaseClient.ts        Supabase client init
  types/database.ts            Hand-written types (regenerate with `supabase gen types typescript` for full accuracy)
  context/AuthContext.tsx      Session + admin-role gate
  components/
    admin/ProtectedRoute.tsx   Route guard for the admin gateway
    layout/                    Public and admin shells
  pages/public/                Home, gallery, product detail, contact
  pages/admin/                 Login, dashboard, products, contact methods, inquiries, workflows, audit logs
  utils/
    validation.ts              Client-side input validation
    storage.ts                 Image upload/replace/delete helpers
    workflowEngine.ts           Minimal workflow execution engine
supabase/migrations/
  0001_init.sql                 Tables, RLS, audit triggers
  0002_storage.sql              Storage bucket + policies
  0003_seed_admin_note.sql      How to create your first admin
```

## Troubleshooting

- **"Missing VITE_SUPABASE_URL..."** — you haven't created `.env` from `.env.example`.
- **Admin login says "This account does not have admin access"** — the user exists
  but `profiles.role` isn't `'admin'` yet; run the promotion query.
- **Images don't show publicly** — check the product's `status` is `published` and
  the bucket is set to public (migration `0002` does this).
