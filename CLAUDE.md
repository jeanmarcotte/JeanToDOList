# JeanToDoList

Personal task management app with tasks, stakes, and habits tracking.

**Live:** https://jeantodolist.vercel.app

## Tech Stack
- Next.js (App Router)
- TypeScript
- Supabase (PostgreSQL)
- Vercel (hosting)

## Project Structure
```
app/
  page.tsx                    # Main app with tabs (Tasks/Stakes/Habits)
  components/
    Celebration.tsx           # Milestone celebration popup
    StakesTab.tsx             # Stakes management
    HabitsTab.tsx             # Habits tracking
actions/
  tasks.ts                    # Task CRUD operations
  stakes.ts                   # Stakes CRUD operations
  habits.ts                   # Habits CRUD operations
  skip-days.ts                # Skip day tracking
lib/
  constants.ts                # Categories and other constants
```

## Architecture: Separation of Concerns

### Server Actions (Backend)
- All database operations MUST be performed via Next.js Server Actions in `actions/`
- Do NOT use Supabase directly from client components
- Server actions use the Supabase service role key for privileged access
- Types (interfaces) for database entities are defined and exported from server action files

### Client Components (Frontend)
- Client components handle UI state and user interactions only
- Import types from server action files, do not define database types in frontend
- Call server actions for any data fetching or mutations

## Database Schema

### Tasks
- id, title, completed, priority (high/medium/low), category (SIGS/PPJ/Accounting/Personal), due_date, created_at

### Categories
- **SIGS** - SIGS Photography business
- **PPJ** - Papa's Programming Journey
- **Accounting** - Financial tasks
- **Personal** - Personal tasks

## Environment Variables
```
NEXT_PUBLIC_SUPABASE_URL=https://ogzmoitxcracuhhscjef.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_PRIVATE_SUPABASE_KEY=...
RESEND_API_KEY=...
CRON_SECRET=...
```

## Shared With
- **Operations Dashboard** - Uses same Supabase database
  - Quick Capture adds tasks here
  - Live task count displayed in sidebar

## Features
- ✅ Task management with priority and categories
- ✅ Stakes tracking
- ✅ Habits tracking
- ✅ Celebration popup every 50 completed tasks
- ✅ Skip day functionality
- ✅ Toronto timezone clock

## Commands
```bash
npm run dev     # Start dev server
npm run build   # Production build
```
