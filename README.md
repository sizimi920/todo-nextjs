# Project

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
# Project

This is a [Next.js](https://nextjs.org) project bootstrapped with `create-next-app`.

## Getting Started

First, run the development server:


```bash
npm run dev
// or
yarn dev
// or
pnpm dev
// or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Supabase public todos demo

This project includes a simple client-side demo that reads and inserts rows into a `todos` table in Supabase without authentication.

Required table schema (Postgres SQL):

```sql
create table if not exists todos (
  id serial primary key,
  task text not null,
  created_at timestamptz default now()
);
```

Notes:

- For the demo to work without auth, ensure Row Level Security (RLS) is disabled for the `todos` table, or add an explicit policy allowing INSERT/SELECT for anon users.
- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` must be present in `.env.local`.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.
# or
