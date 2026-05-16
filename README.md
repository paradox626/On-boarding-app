# IT Support App

A Next.js 15 + Supabase application providing:

- **Tickets** – users submit support requests, agents triage, resolve, and comment (with internal staff-only notes).
- **Knowledge base** – staff publish articles; users read them.
- **Live chat** – users open a chat, an agent claims it, real-time messaging via Supabase Realtime.
- **Assets** – staff track IT inventory and assignment history.
- **Admin** – overview metrics and user role management.

Auth is handled by Supabase with three roles: `user`, `agent`, `admin`. RLS policies enforce access at the database layer.

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy `.env.local.example` to `.env.local` and fill in your Supabase URL and anon key.

3. Apply the SQL migrations in `supabase/migrations/` to your Supabase project, in order (`0001` → `0005`).

   You can either:
   - Paste each file into the Supabase SQL editor and run, or
   - Use the Supabase CLI: `supabase db push`.

4. Promote your first admin by running this in the SQL editor after signing up once:

   ```sql
   update public.profiles set role = 'admin' where email = 'you@example.com';
   ```

5. Run the dev server:

   ```bash
   npm run dev
   ```

## Project layout

```
src/
  app/              Next.js App Router pages
    tickets/        Ticket list, create, detail, comments
    kb/             Knowledge base list, article, new article
    chat/           Chat list, room (with realtime)
    assets/         Asset inventory (staff only)
    admin/          Admin dashboard (admin only)
    login/ signup/  Auth
  components/       Shared UI
  lib/
    supabase/       Browser + server Supabase clients
    types.ts        Domain types
  middleware.ts     Auth-gated routing
supabase/
  migrations/       SQL migrations
```
