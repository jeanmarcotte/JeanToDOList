# JeanToDoList Project Guidelines

## Architecture: Separation of Concerns

### Server Actions (Backend)
- All database operations MUST be performed via Next.js Server Actions in the `actions/` directory
- Do NOT use Supabase directly from client components - RLS cannot be trusted for security
- Server actions use the Supabase service role key for privileged database access
- Types (interfaces) for database entities should be defined and exported from the server action file

### Client Components (Frontend)
- Client components handle UI state and user interactions only
- Import types from server action files, do not define database types in frontend code
- Call server actions for any data fetching or mutations
- Keep async operations limited to calling server actions and handling their responses

### Example Pattern
```typescript
// actions/tasks.ts
"use server";
export interface Task { id: number; title: string; ... }
export async function getTasks() { ... }

// app/page.tsx
'use client';
import { Task, getTasks } from '@/actions/tasks';
```

## ⚠️ CRITICAL: Environment Variables on Vercel

**NEVER use `NEXT_PRIVATE_` prefix for server-side env vars on Vercel.**

- `NEXT_PUBLIC_` vars = baked into client bundle at build time (visible to browser)
- `NEXT_PRIVATE_` vars = NOT reliably exposed to serverless functions on Vercel
- Plain env vars (no prefix) = available to server actions on Vercel ✅

**All server actions MUST use `SUPABASE_SERVICE_ROLE_KEY`** (not `NEXT_PRIVATE_SUPABASE_KEY`).

Standard pattern for all action files:
```typescript
"use server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function getSupabaseAdmin() {
    return createClient(supabaseUrl, supabaseServiceKey);
}
```

### Vercel Env Vars (jean-to-do-list project)
- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anon key (client-side)
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase service role key (server-side)
- `CRON_SECRET` — For scheduled jobs

### Vercel Project
- **Correct project name:** `jean-to-do-list` (NOT `jeantodolist`)
- **Domain:** tasks.jeanmarcotte.com
- **Deploy command:** `vercel --prod` (add `--force` for clean rebuild)
- **Link command:** `vercel link` → select `jean-to-do-list`

## File Structure
- `actions/` - Server actions with "use server" directive, contains types and database operations
  - `tasks.ts` - Main tasks CRUD + completed count
  - `priorities.ts` - Top 4 priorities with drag reorder
  - `goals.ts` - Long-term goals tracking
  - `purchases.ts` - Buy tab items
  - `stakes.ts` - Stakes/challenges with progress tracking
  - `habits.ts` - Habit tracking
  - `skip-days.ts` - Skip day management with auto-recovery
- `app/` - Next.js app router pages and layouts (client components for UI)
  - `components/` - All UI components (Celebration, GoalsTab, BuyTab, StakesTab, etc.)
- `lib/` - Shared utilities

## Features

### Tabs
- **Tasks** - Main task list with priority levels (High/Medium/Low), categories (SIGS/PPJ/Accounting/Personal), due dates
- **Buy** - Purchase tracking list
- **Stakes** - Challenges with target counts, deadlines, rewards/consequences
- **Habits** - Habit tracking

### Priorities (Added Feb 5, 2026)
- Top 4 active priorities shown above tabs
- Badge count on Priorities button
- Add/complete/dismiss/reorder functionality

### Goals (Added Feb 5, 2026)
- Long-term goals with target dates
- Badge count on Goals button
- Add/complete/delete functionality

### Celebration Feature (Added Jan 28, 2026)
- Every 50 completed tasks triggers a celebration popup
- Tracks ALL-TIME completed tasks (count from database)
- Auto-dismisses after 5 seconds or click to close
- Files: `app/components/Celebration.tsx`, `app/page.tsx`, `actions/tasks.ts`
- To test: Change `count % 50` to `count % 1` in page.tsx

### Mobile Optimizations
- Popup modal for full task text on mobile (tap to expand)
- Fixed date picker visibility (`colorScheme: 'dark'`)

## Deployment History

### Feb 6, 2026 — Desktop Bug Fix
- **Bug:** Desktop showed 0 Active, 0 Completed, no badge counts. iPhone worked fine.
- **Root cause:** `NEXT_PRIVATE_SUPABASE_KEY` env var not exposed to Vercel serverless functions
- **Fix:** Changed all 7 action files to use `SUPABASE_SERVICE_ROLE_KEY`
- **Also fixed:** Deleted orphan Vercel project `jeantodolist`, relinked CLI to `jean-to-do-list`
- **Lesson:** Use pipe method for env vars to avoid truncation: `grep KEY .env.local | cut -d= -f2 | vercel env add KEY production`

### Feb 4, 2026 — Buy Tab + Mobile Fixes
- Added Buy tab with new Supabase table
- Custom domain tasks.jeanmarcotte.com configured
- Removed broken email cron jobs
- Fixed Vercel env var (SUPABASE_SERVICE_ROLE_KEY)

---
*Last Updated: February 6, 2026 — Desktop bug fix session*
