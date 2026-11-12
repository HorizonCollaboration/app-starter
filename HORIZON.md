# How this app is made

This app was started on Horizon, where people share problems and build open-source solutions together. It grew from a prototype the community tried and shaped. Horizon builds and changes it with AI, every version is checked automatically, and a person approves it before it goes live.

Read this before changing anything, whether you're a person or an AI.

## What it's made of

- **Next.js** (App Router) with **React** and **Tailwind**, styled with Horizon's theme.
- **Postgres** through **Drizzle**. Laravel Cloud provides the database as `DATABASE_URL`.
- **Sign-in by emailed link** (better-auth). There are no passwords.
- **Tests** with Vitest, against an in-memory Postgres (PGlite), so they need no database server.

## Where things go

- `src/app/`: pages and server actions. One folder per screen.
- `src/components/`: pieces of screens, as `PascalCase.tsx`.
- `src/lib/data/`: everything that reads or writes the database, as functions that take the database as their first argument (`listTasks(db, userId)`), so tests can pass the test database.
- `src/db/schema.ts`: the app's tables. Each person is a row in `user`, which it shares from the sign-in tables.
- `drizzle/`: database changes. Run `npm run db:generate` after changing the schema; never edit a file that's already there.
- `src/sampleData.ts`: made-up data the app can start with.
- `tests/`: a test for each main job the app does, using `testDatabase()` from `tests/db.ts`.

## Rules

1. **Check who's signed in, every time.** Every page that shows someone's data and every server action calls `requireUser()` from `src/lib/session.ts`, and only reads or changes rows that belong to that person (or that the brief says are shared). Never trust an id sent from the browser without checking it belongs to them.
2. **Check what people send.** Validate every server action's input with `zod`, with sensible length limits.
3. **Only ever add to the database.** Add tables and columns; never rename or remove them, so a new version never loses what people have entered.
4. **No new packages.** Use what's in `package.json`.
5. **Nothing leaves the app** except sign-in emails, sent by `src/lib/email.ts`. No other websites, scripts, fonts or images from elsewhere, and no AI services.
6. **No secrets in the code.** Settings come from environment variables that Horizon or Laravel Cloud sets.
7. **Made-up data only.** Sample data is realistic for the problem and clearly made up: no real people, contact details, addresses or record numbers.
8. **Style with the theme's names.** Colours and shapes come from `src/theme.css` as Tailwind classes like `bg-surface`, `text-ink`, `bg-primary` and `rounded-card`, never Tailwind's own colours like `blue-500` or values in square brackets.
9. **Works on a phone.** Nothing scrolls sideways on a 375px screen, tap targets are at least 44px (`min-h-11`), and every input has a label.
10. **Plain words.** Everyday British English. Buttons say what they do, and empty screens say what to do next.

## Fixed files

Horizon keeps these the same in every app, and rejects a version that changes them:

- `.github/`, `next.config.ts`, `drizzle.config.ts`, `eslint.config.mjs`, `tsconfig.json`, `vitest.config.mts`, `package.json`'s packages, `scripts/`
- `src/db/index.ts`, `src/db/auth-schema.ts` (the secret sign-in tables), `src/lib/auth.ts`, `src/lib/session.ts`, `src/lib/email.ts`, `src/app/api/auth/`, `src/app/sign-in/`
- `src/proxy.ts`, `src/middleware.ts` and `src/instrumentation*.ts`, which a Horizon app doesn't have
- `src/app/layout.tsx`, `src/app/globals.css`, `src/theme.css`, `src/components/Banner.tsx`, `src/horizon.json`
- `tests/db.ts`, `tests/sign-in.test.ts`, `HORIZON.md`, `LICENSE`
- Any file already in `drizzle/` (add new ones with `npm run db:generate`)

## Checks

`npm run check` runs the linter, the type check and the tests; `npm run build` must pass too. GitHub runs both on every change. The linter enforces several of the rules above: it rejects reaching other websites, reading settings, Node's system modules, dynamic imports and the sign-in tables.

## Running it yourself

You need Node.js 22 or later and a Postgres database.

```
npm install
DATABASE_URL=postgres://… npm run db:migrate
DATABASE_URL=postgres://… npm run dev
```

Without `RESEND_API_KEY`, sign-in links are printed in the terminal instead of emailed.
