# RSUD Forms

RSUD Forms is an internal clinical form workspace for creating versioned form definitions, recording patient assessments, reviewing submissions, and producing assessment reports and PDFs.

## Features

- Schema-driven clinical forms with drafts and immutable submitted records
- Drag-and-drop form builder with conditional fields and live preview
- Main staff workspace with personal submission history
- Administrative submission directory with search and filters
- PDF print preview and direct PDF download
- Per-form assessment reports with volume, completion, and response insights
- Administrator-managed staff accounts, roles, password resets, and deletion safeguards
- Role-based access for `STAFF` and `ADMIN`
- Submission access audit events for viewing and PDF generation

## Technology

- Next.js 16 and React 19
- TypeScript and Tailwind CSS 4
- shadcn/ui with Base UI primitives
- Better Auth
- Prisma 7 with PostgreSQL/Neon
- FormePDF for server-generated PDF documents
- Vitest and Playwright

## Requirements

- [Bun](https://bun.sh/) 1.3 or newer
- PostgreSQL database; the current adapter is configured for [Neon](https://neon.tech/)

## Local setup

1. Install dependencies:

   ```bash
   bun install
   ```

2. Create the local environment file:

   ```bash
   cp .env.example .env.local
   ```

3. Configure the required values in `.env.local`:

   | Variable | Purpose |
   | --- | --- |
   | `DATABASE_URL` | Direct PostgreSQL connection used by Prisma migrations |
   | `DATABASE_URL_POOLED` | Pooled Neon connection used by the application and seed script |
   | `BETTER_AUTH_SECRET` | Random secret of at least 32 characters |
   | `BETTER_AUTH_URL` | Application origin, normally `http://localhost:3000` locally |

4. Apply migrations and seed the initial assessment form:

   ```bash
   bun run db:deploy
   bun run db:seed
   ```

5. Create the first administrator:

   ```bash
   bun run auth:create-admin
   ```

   The script explicitly creates the configured uppercase `ADMIN` role. Do not replace it with Better Auth's default lowercase `admin` role.

6. Start the development server:

   ```bash
   bun run dev
   ```

Open [http://localhost:3000](http://localhost:3000) and sign in with the administrator account.

## Roles and application areas

### Staff workspace

- `/` - available clinical forms
- `/forms/[slug]/new` - create or continue a submission
- `/submissions` - the signed-in staff member's submission history
- `/submissions/[id]` - submission details

Staff can access only submissions they created. Print and download endpoints enforce the same ownership check.

### Administration

- `/admin/submissions` - all submissions
- `/admin/reports` - assessment reports by form
- `/admin/forms/new` - drag-and-drop form builder
- `/admin/users` - staff and administrator management
- `/admin/account` - administrator account security

Administrators can review all submissions, manage drafts, create form versions, and manage user access. Accounts linked to protected clinical history cannot be deleted.

## PDF output

Submission detail pages and table actions provide two PDF operations:

- **Print** opens the generated PDF inline in a new browser tab.
- **Download** returns the same authenticated PDF with an attachment disposition.

Both main and admin routes generate PDFs on demand and disable caching of the response.

## Commands

| Command | Description |
| --- | --- |
| `bun run dev` | Start the development server |
| `bun run build` | Create a production build |
| `bun run start` | Run the production server |
| `bun run lint` | Run ESLint |
| `bun run typecheck` | Run TypeScript without emitting files |
| `bun run test` | Run the Vitest suite |
| `bun run test:e2e` | Run Playwright end-to-end tests |
| `bun run db:generate` | Regenerate the Prisma client |
| `bun run db:migrate` | Create/apply a development migration |
| `bun run db:deploy` | Apply committed migrations |
| `bun run db:seed` | Seed the initial form definition |
| `bun run auth:create-admin` | Create an uppercase `ADMIN` account |

## End-to-end test credentials

The Playwright suite skips authenticated scenarios unless these variables are available to the test process:

```bash
E2E_ADMIN_EMAIL=
E2E_ADMIN_PASSWORD=
E2E_STAFF_EMAIL=
E2E_STAFF_PASSWORD=
```

Run the complete verification set before deployment:

```bash
bun run typecheck
bun run lint
bun run test
bun run build
```

## Domain model

See [`CONTEXT.md`](./CONTEXT.md) for the project terminology and invariants around forms, immutable form versions, submissions, drafts, patient context, staff, and administrators.
