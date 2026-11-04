# Sanjeevani Group website

This is a Next.js website using PostgreSQL (Neon) and Prisma for its business directory, careers, applications, and CMS APIs. The API routes are part of the Next.js app; there is no separate backend service.

## Run locally

1. Install Node.js 20.9 or newer.
2. Create or select a PostgreSQL database (the project is configured for Neon).
3. Copy `frontend/.env.local.example` to `frontend/.env.local` and set `DATABASE_URL` (pooled) and `DATABASE_URL_UNPOOLED` (direct, used for migrations). Set a unique admin password of at least 12 characters and a random session secret of at least 32 characters (for example, generate one with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`). Do not commit `.env.local` or share any secrets.
4. Open a terminal in `frontend` and run `npm install`.
5. Run `npm run db:migrate:deploy` and `npm run db:seed` to create the schema and seed the site content.
6. Run `npm run dev` and open `http://localhost:3000`.

When this workspace is opened in VS Code, the **Sync GitHub updates** task checks the tracked branch every three minutes. It applies pushed commits automatically when the branch can be fast-forwarded and incoming commits do not touch locally edited or untracked files. Unrelated local work does not block an update. If incoming commits overlap local changes or the branch has diverged, it fetches updates but leaves them unapplied; commit/stash the overlapping changes or resolve the divergence to resume automatic updates. VS Code may ask you to allow the folder-open task the first time.

Open `/admin` to sign in to the legacy business directory CMS. Business directory records are stored in PostgreSQL. The admin password and signing secret are read only from server environment variables; sessions use a signed, HTTP-only, same-site cookie and expire after eight hours. Configure a strong password and secret before deploying.

The main navigation links to dedicated pages for About Us, Businesses, Media, Investors, Community, and Careers. The Businesses page includes the searchable company directory and A–Z filters.

The supplied business list contains 18 names, although the brief mentions 17; all 18 supplied names are included.

## Contributing

Contributions are welcome. Please open a pull request with a clear description of your changes.
