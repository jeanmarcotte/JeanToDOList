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

## File Structure
- `actions/` - Server actions with "use server" directive, contains types and database operations
- `app/` - Next.js app router pages and layouts (client components for UI)
- `lib/` - Shared utilities (avoid putting database clients here if they're only used server-side)
