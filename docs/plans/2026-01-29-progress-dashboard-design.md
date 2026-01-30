# Personal Progress Dashboard — Design Document

**Date:** 2026-01-29
**Stack:** Next.js (App Router) + Supabase + Vercel
**Architecture:** Server Components + Server Actions + Supabase Realtime

---

## Overview

A mobile-first personal dashboard for tracking progress across 16 projects. Each project uses a milestone/task hierarchy to auto-calculate progress. The design is warm and colorful with light gamification (streaks, confetti on milestones, celebration messages).

---

## Data Model

### projects
| Column             | Type      | Notes                                      |
|--------------------|-----------|---------------------------------------------|
| id                 | uuid (PK) | Auto-generated                              |
| user_id            | uuid (FK) | References auth.users                       |
| name               | text      |                                              |
| emoji              | text      | Category icon e.g. "🎸" "📱" "✍️"            |
| color              | text      | Hex for gradient/accent                     |
| status             | enum      | on_track, at_risk, blocked, done            |
| is_spotlighted     | boolean   | Appears in focus section (max 3)            |
| sort_order         | int       | Grid ordering                               |
| progress_override  | int?      | Manual override 0-100, null = auto-calc     |
| current_streak     | int       | Days with activity                          |
| last_activity_date | date?     | For streak calculation                      |
| created_at         | timestamp |                                              |
| updated_at         | timestamp |                                              |

### milestones
| Column       | Type      | Notes                          |
|--------------|-----------|--------------------------------|
| id           | uuid (PK) |                                |
| project_id   | uuid (FK) | References projects            |
| title        | text      |                                |
| is_completed | boolean   |                                |
| due_date     | date?     |                                |
| completed_at | timestamp?|                                |
| sort_order   | int       |                                |

### tasks
| Column       | Type      | Notes                          |
|--------------|-----------|--------------------------------|
| id           | uuid (PK) |                                |
| milestone_id | uuid (FK) | References milestones          |
| title        | text      |                                |
| is_completed | boolean   |                                |
| completed_at | timestamp?|                                |
| sort_order   | int       |                                |

### Progress Calculation
- Auto: `completed_tasks / total_tasks` across all milestones in a project
- Manual override: If `progress_override` is set, use that value instead

### Streak Logic
- On task completion: Check `last_activity_date`. If today → no change. If yesterday → increment `current_streak`. Otherwise → reset to 1. Update `last_activity_date` to today.
- On dashboard load: If `last_activity_date` < yesterday → reset `current_streak` to 0.

---

## Page Structure

```
/                    — Dashboard home
/project/[id]        — Project detail
/login               — Single-user auth
```

### Navigation (Mobile-First)
- Bottom tab bar: **Dashboard** (home icon) + **All Projects** (grid icon)
- Project detail: tap card → slide in from right
- Swipe-back gesture to return
- Pull-to-refresh on dashboard

### Dashboard Home Layout (Top to Bottom)
1. **Master progress bar** — Aggregate across all 16 projects, animated fill, percentage label
2. **Spotlight section** — 1-3 cards for spotlighted projects: emoji, progress ring, next incomplete task, streak badge
3. **Upcoming deadlines** — Collapsible banner, milestones due within 7 days, sorted by urgency
4. **All projects grid** — 2-column (mobile), 4-column (desktop), each card: emoji + name + mini progress bar + status dot

### Project Detail Page
- Header: emoji + name + progress ring + status badge + streak
- Milestone list: collapsible sections, each with task checklist
- Progress chart (optional future addition)

---

## Design System

### Color System
- Each project has a user-chosen accent color (hex)
- Global palette: warm neutrals for backgrounds, vibrant accents per project
- Soft gradients on cards (project color → lighter shade)
- Dark mode via CSS variables

### Components
| Component         | Description                                                  |
|-------------------|--------------------------------------------------------------|
| ProgressRing      | Circular SVG progress for spotlight cards, animated on mount |
| ProgressBar       | Linear bar for master progress and grid cards, spring anim   |
| StatusBadge       | Colored dot + label (green/amber/red)                        |
| StreakBadge       | Flame icon + day count, pulses on increment                  |
| ProjectCard       | Emoji + name + mini progress bar + status dot, rounded-xl    |
| SpotlightCard     | Larger card with progress ring, next task, streak            |
| MilestoneList     | Collapsible sections within project detail                   |
| TaskItem          | Checkbox + title, strikethrough animation on complete         |
| ConfettiOverlay   | Triggers on milestone completion + celebration message        |
| DeadlineBanner    | Collapsible, amber/red gradient based on urgency             |

### Animations (Framer Motion)
- Progress bars/rings: spring physics on value change
- Cards: stagger-fade on dashboard load
- Checkbox: scale + check-draw animation
- Confetti: burst + "Nice work!" / "Milestone crushed!" message
- Streak badge: brief pulse on increment

---

## Auth & Real-Time

### Authentication
- Supabase Auth with email/password (single user)
- `middleware.ts` protects all routes except `/login`
- Session via HTTP-only cookie using `@supabase/ssr`
- No registration flow — seed user in Supabase dashboard

### Row Level Security
- All tables: RLS enabled
- Policy: `auth.uid() = user_id` on all project rows
- Milestones/tasks inherit access via project FK join

### Real-Time Sync
- Supabase Realtime subscriptions on projects, milestones, tasks
- Client subscribes on dashboard mount
- Server Actions handle all writes → triggers Realtime broadcasts
- Optimistic updates on client, reconciled with Realtime events

---

## Tech Stack Summary

| Layer        | Technology                        |
|--------------|-----------------------------------|
| Framework    | Next.js 15 (App Router)           |
| Styling      | Tailwind CSS 4                    |
| Animation    | Framer Motion                     |
| Database     | Supabase (Postgres)               |
| Auth         | Supabase Auth                     |
| Real-time    | Supabase Realtime                 |
| Deployment   | Vercel                            |
| SSR Auth     | @supabase/ssr                     |

---

## Implementation Phases

### Phase 1: Foundation
- Next.js project setup with Tailwind + Framer Motion
- Supabase project setup (database schema, RLS policies, auth)
- Auth flow (login page, middleware, session management)
- Base layout with bottom tab navigation

### Phase 2: Core Features
- Dashboard home page (master bar, spotlight, deadlines, grid)
- Project detail page (milestones, tasks, progress)
- Server Actions for CRUD operations
- Progress auto-calculation

### Phase 3: Delight
- Animations (progress bars, card transitions, checkbox)
- Confetti on milestone completion
- Streak tracking and badges
- Celebration messages

### Phase 4: Real-Time & Polish
- Supabase Realtime subscriptions
- Optimistic updates
- Pull-to-refresh
- Dark mode
- Mobile gesture navigation
