# Routinely — Implementation Plan

> **Source documents:** Routinely Blueprint v1.0 + Technical Update v2.0  
> **All items in this plan are required before launch.**

---

## Phase 0 — Project Scaffold

- Initialise a **Next.js** project (App Router, TypeScript, Tailwind CSS)
- Install core dependencies: `dexie`, `@supabase/supabase-js`, `@google/generative-ai`, `uuid`
- Set up `.env.local` with:
  - `GEMINI_API_KEY` — server-side only, never exposed to client
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY` — server-side only, never exposed to client
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY` — client-side auth operations only
- Create `src/lib/supabaseClient.ts` — frontend Supabase client initialised with `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Used for all client-side auth calls (sign up, sign in, OAuth, session reads). Never used on the server.
- Create `src/lib/supabaseAdmin.ts` — server-side Supabase client initialised with `SUPABASE_SERVICE_ROLE_KEY`. Used only in backend API routes for sync and privileged writes.

---

## Phase 1 — Type System & Database Layer

1. **`src/types/index.ts`** — Define all TypeScript interfaces:
   - `TimerState`, `PomodoroSettings`, `TimerMode`, `TimerStatus`
   - One interface per DB table: `User`, `Mode`, `Task`, `Routine`, `Habit`, `HabitLog`, `PomodoroSession`, `Subject`, `TimetableEntry`, `Exam`, `StudySession`, `Assignment`, `IncomeEntry`, `ExpenseEntry`, `Budget`, `SavingsGoal`, `Bill`, `WorkoutPlan`, `WorkoutLog`, `BodyMetric`, `Project`, `MeetingLog`, `PersonalGoal`, `JournalEntry`, `Achievement`, `SkillUnlock`, `SyncQueue`

2. **`src/db/schema.ts`** — TypeScript-typed schema definitions mirroring the types above

3. **`src/db/index.ts`** — Dexie database class with all table definitions, indexes, and schema version. Every table carries: `id` (UUID), `user_id`, `created_at`, `updated_at`, `synced_at`, `is_deleted` (soft delete, default false)

> ⚠️ **After Phase 1 — Create Supabase SQL Schema before any sync work begins.**
>
> Run SQL migrations in Supabase that create every table defined in Section 4 of the Technical Update v2 document. The column names, types, and constraints must exactly match the Dexie schema so the push/pull sync engine can read and write without transformation. Do this before Phase 10 (sync backend routes) and before Phase 3.5 (auth) references user records in the cloud.
>
> The `users` table must include `onboarding_complete BOOLEAN DEFAULT false` so the onboarding guard in Phase 8.5 can function correctly.

---

## Phase 2 — Core Utilities

4. **`src/lib/pomodoro.ts`** — `saveSession()`, `loadSessions()`, `formatTime()`, `playSessionEndSound()` (Web Audio API chime — 880→660 Hz oscillator via `AudioContext`)

5. **`src/lib/sync.ts`** — Sync engine:
   - Push local changes where `updated_at > synced_at`
   - Pull remote changes where `updated_at > last_pull_timestamp`
   - Process offline queue
   - Last-write-wins on conflict
   - 30-second polling + immediate trigger on reconnect
   - Guest users: sync engine does nothing — `synced_at` is null for all records

6. **`src/lib/xp.ts`** — XP calculation, level-up thresholds, per-mode stat increments:
   - Focus → Study stat
   - Drive → Professional stat
   - Vitality → Fitness stat
   - Wealth → Financial stat
   - Balance → General stat

7. **`src/hooks/useMediaQuery.ts`** — `window.matchMedia` hook for responsive breakpoint detection

8. **`src/hooks/useLiveQuery.ts`** — Wrapper around Dexie's `liveQuery` for React state integration

---

## Phase 3 — Global Timer Context

9. **`src/contexts/TimerContext.tsx`** — `TimerProvider` + `useTimer()` hook using `useReducer`:
   - Tick via `Date.now()` timestamps, not interval decrement (prevents browser throttle drift):
     `timeRemaining = totalTime - Math.floor((Date.now() - startedAt) / 1000)`
   - Page Visibility API for tab-switch catch-up
   - `localStorage` key `routinely_timer_state` for browser-close recovery; if session would have ended while browser was closed, auto-log it as completed and start fresh
   - Auto-log completed sessions to `pomodoro_sessions` Dexie table via `saveSession()`
   - Web Audio API chime (`playSessionEndSound()`) + Browser Notification API on session end (respect user sound setting)
   - Achievement milestone checks (1st, 10th, 50th session)
   - Cycle count tracking; long break after N focus sessions; reset `cycleCount` to 0 after long break

---

## Phase 3.5 — Authentication

> **This phase must be completed before Phase 7 (bug fixes) and Phase 8 (layout wiring).** The `GuestBanner`, sidebar badges, home hub data, and all protected pages depend on knowing whether the current user is a guest or a signed-in account holder.

10. **`src/lib/auth.ts`** — Helper functions: `getCurrentUser()`, `isGuest()`, `createGuestSession()` (generates a UUID user record in Dexie with `is_guest: true`, no network touch), `getJWT()` for attaching tokens to backend requests

11. **`src/contexts/AuthContext.tsx`** — `AuthProvider` + `useAuth()` hook wrapping Supabase's `onAuthStateChange`; exposes `user`, `isGuest`, `signOut`, `loading`

12. **`src/app/(auth)/sign-up/page.tsx`** — Email + password sign-up form; calls `supabase.auth.signUp()`; on success, redirect to verify-email screen

13. **`src/app/(auth)/sign-in/page.tsx`** — Email + password sign-in using `supabase.auth.signInWithPassword()`; also "Continue as guest" button that calls `createGuestSession()`

14. **`src/app/(auth)/verify-email/page.tsx`** — "Check your inbox" instruction screen shown after sign-up; resend link option; listen for auth state change via `onAuthStateChange` to detect verification completion

15. **`src/app/(auth)/reset-password/page.tsx`** — "Forgot password" screen; calls `supabase.auth.resetPasswordForEmail()`; shows confirmation message

16. **`src/app/(auth)/update-password/page.tsx`** — Screen reached via reset email link; calls `supabase.auth.updateUser({ password })`

17. **Google OAuth** — Add "Sign in with Google" button on both sign-in and sign-up screens using `supabase.auth.signInWithOAuth({ provider: 'google' })`; configure redirect URL in Supabase dashboard; Google-authenticated users skip email verification

18. **Guest-to-account migration** — After email verification on sign-up (or immediately after Google OAuth):
    - Tag all local Dexie records with the new `user_id`
    - Run the sync engine immediately to push all local data to Supabase
    - Migration happens once, immediately after the session is confirmed
    - Show a progress indicator during migration; do not allow navigation away
    - Users who converted from guest mode skip Onboarding Screens 2 and 3 (name and modes already known)

19. **Route protection** — Middleware or layout-level check: unauthenticated users with no guest session are redirected to sign-in; guest users can access the full app but see the `GuestBanner`; after 5 failed sign-in attempts, enforce a 15-minute cooldown

---

## Phase 4 — SVG Icon Library

20. **`src/components/icons/icons.tsx`** — SVG icon definitions as React components across 6 categories (minimum 36 icons):
    - Education: book, graduation cap, pencil, microscope, calculator, globe
    - Health: heart, dumbbell, running figure, apple, moon, water drop
    - Finance: coin, wallet, chart bar, piggy bank, credit card, trending up
    - Work: briefcase, laptop, calendar, clock, target, chart line
    - Creative: music note, palette, camera, pen, film, microphone
    - Personal: star, home, leaf, sun, coffee, flame
    - Selected icon stored as a key string (e.g. `'book'`, `'dumbbell'`) in the mode record

21. **`src/components/icons/IconPicker.tsx`** — Scrollable grid (6 icons per row) with category filter at top; returns icon key string on selection; icon stroke colour adapts to sidebar theme (white when collapsed, same as label when expanded)

---

## Phase 5 — Shared UI Components

22. **`src/components/ui/PomodoroBar.tsx`** — Persistent timer bar:
    - Desktop: fixed top bar, `left: 52px`, `right: 0`, clears collapsed sidebar width
    - Mobile: floating pill above bottom tab bar
    - States: focus (`#1E1B4B` deep indigo, violet dot), paused (blinking dot, muted time colour), break (`#064E3B` deep green, emerald dot), hidden when idle
    - 500ms CSS `transition-colors` between focus and break states
    - Controls: Pause/Resume, Stop, Skip break

23. **`src/components/ui/GuestBanner.tsx`** — 40px in-document-flow banner (NOT `position: fixed` or `position: absolute`):
    - First child in app shell layout, above sidebar and content area, occupying real vertical space
    - `[Create free account]` and `[Sign in]` are real navigation buttons using `router.push`
    - Hidden entirely when `isGuest === false`
    - On mobile, stack to two lines if needed — do not overflow horizontally

24. **`src/components/ui/AchievementToast.tsx`** — Queued achievement unlock toasts with icon and flavour text; auto-dismiss after 5 seconds; tap to navigate to profile

25. **`src/components/ui/EmptyState.tsx`** — Reusable empty state component for any mode or section

---

## Phase 6 — Mode Section Components

> All section components must be fully functional — no placeholders, no "coming soon" states.

26. **`src/components/sections/TasksSection.tsx`** — Add task, mark complete, delete, due date, priority (`low | medium | high`)
27. **`src/components/sections/HabitsSection.tsx`** — Add habit (daily or weekly), daily check-in, streak display
28. **`src/components/sections/RoutineSection.tsx`** — Weekly schedule builder day-by-day with start/end times
29. **`src/components/sections/NotesSection.tsx`** — Free text entries with date stamps
30. **`src/components/sections/TimerSection.tsx`** — Links to global Pomodoro context via `useTimer()`; displays current session info
31. **`src/components/sections/TrackerSection.tsx`** — Log numeric value with date; history view
32. **`src/components/sections/GoalsSection.tsx`** — Add goal with target and progress bar
33. **`src/components/sections/LogSection.tsx`** — Simple log entries with text and timestamp

---

## Phase 7 — Bug Fixes

> Resolve all of the following before any new features are added.

34. **Fix 1 — Guest banner layout**: Remove `position: fixed` / `position: absolute` from `GuestBanner`; place as first child in app shell; add `padding-top: 40px` to main content wrapper only when `isGuest === true`; two-line wrap allowed on mobile

35. **Fix 2 — Home hub real data**: Remove all hardcoded or seeded data from the home hub; each mode summary card queries its own Dexie table on every mount and on back-navigation; show honest empty states ("No tasks yet", "No sessions this week") when no data; never show zeros formatted as meaningful stats

36. **Fix 3 — Sidebar badge real data**: Wire to live Dexie queries; hide badge entirely when value is 0; badge logic per mode:
    - Study = tasks due today + assignments overdue
    - Financial = bills due within 3 days
    - Professional = tasks due today or overdue
    - Fitness = 0 unless today's planned workout is unlogged (then 1)
    - General = habits not yet checked in today
    - Custom = tasks due today in that mode

37. **Fix 4 — Custom mode creation end-to-end**: Save `sections` as JSON array to `modes` table in Dexie on confirm; dynamic mode page reads `mode.sections` and renders the correct section component for each key; each section must be fully functional

38. **Fix 5 — SVG icon picker**: Replace emoji picker with `IconPicker` component; store `icon_key` string in mode record; sidebar renders via SVG component from icon library; stroke colour adapts to theme

39. **Fix 6 — Stats start at zero**: Remove all mock data, JSON fixtures, and hardcoded return values from every production screen:
    - RPG level = 1, XP = 0, all five character stats = 0 on first launch
    - The only pre-existing achievement is "First Step" (awarded at onboarding completion)
    - Guest users get the same empty-start experience

---

## Phase 8 — App Layout Wiring

40. **`src/app/layout.tsx`** — Wrap `{children}` with `<AuthProvider>` then `<TimerProvider>`
41. **`src/app/(app)/layout.tsx`** — Add `<GuestBanner />` in document flow at top; add `<PomodoroBar />`; apply `padding-top: 40px` to main content when `isGuest === true`; remove all hardcoded data
42. **`src/app/(app)/pomodoro/page.tsx`** — Remove all local timer state; use `useTimer()` from context; keep settings UI local
43. **`src/app/(app)/page.tsx`** (home hub) — Fully driven by live Dexie queries; no seeded data; re-queries on every mount
44. **`src/app/(app)/modes/new/page.tsx`** — Wire `IconPicker`; save sections array to Dexie; trigger AI achievement generation on confirm
45. **`src/app/(app)/modes/[id]/page.tsx`** — Dynamically render section components from `mode.sections` array read from Dexie
46. **`src/components/ui/Sidebar.tsx`** — Live badge queries via Dexie `useLiveQuery`; hide-when-zero logic; render mode icons via SVG icon library
47. **`src/app/(app)/settings/modes/page.tsx`** — Reads/writes from Dexie; activate/deactivate/reorder modes

---

## Phase 8.5 — Onboarding Flow

> Add after app layout is wired (Phase 8) but before final testing. Onboarding runs once: immediately after a new user completes sign-up (or taps "Continue as guest"). Users converting from guest mode skip Screens 2 and 3.

48. **Screen 1 — Welcome**: App name, short tagline, and a single "Get started" button; sets the visual tone; include a "Skip" option for users who know what they are doing

49. **Screen 2 — Name**: User enters their name; saved to `users.name` in Dexie; pre-filled if the user signed up via Google

50. **Screen 3 — Mode selection**: User picks which modes to activate from the 5 built-ins; a card grid showing Study, Professional, Fitness, Financial, General, and a "Create your own" card; must select at least one; selected modes inserted into `modes` table with `is_active: true`, unselected with `is_active: false`

51. **Screen 4 — First routine (optional)**: Friendly prompt to add one routine entry using the `RoutineSection` component; can skip and do it later inside a mode

52. **Screen 5 — Character created**: User's avatar appears at level 1 with their character name; user can choose from a predefined avatar set (avatar key saved to `users.avatar_key`); intro to the RPG stat system shown (Focus, Drive, Vitality, Wealth, Balance — all start at 0); award the "First Step" achievement automatically by inserting into the `achievements` table with `achievement_key: 'first_step'`, `earned_at: now()`; show `AchievementToast` for it; navigate to home hub

53. **Onboarding guard**: On app entry, if `users.onboarding_complete === false` (or field missing), redirect to onboarding; once Screen 5 is complete, set `onboarding_complete: true` so the flow never shows again

54. **Schema addition**: Add `onboarding_complete BOOLEAN DEFAULT false` to the `users` table in both the Dexie schema (Phase 1) and the Supabase SQL migration (Phase 1 note)

---

## Phase 9 — AI Backend Routes

> All routes use Gemini `gemini-1.5-flash`, temperature 0.7, max 1000 tokens. Prompt instruction on every call: "No preamble. Return only JSON."

55. **`src/app/api/ai/achievements/route.ts`** — Generate 6–8 achievements + skill tree for a new custom mode; triggered on mode creation; saves to `achievements` table with `is_ai_generated: true`, `earned_at: null`

56. **`src/app/api/ai/routine/route.ts`** — Generate weekly routine from plain-language description; returns review screen before saving

57. **`src/app/api/ai/review/route.ts`** — Generate mode weekly review/summary (max 150 words, plain text, no markdown)

58. **`src/app/api/ai/route-input/route.ts`** — Parse natural language input and route to correct mode/section; show confirmation card before saving

59. **`src/app/api/ai/suggestions/route.ts`** — Generate adaptive planning suggestions from usage patterns

60. **`src/app/api/ai/journal-prompt/route.ts`** — Generate daily journal prompt for General mode

61. **`src/app/api/ai/achievements/suggest/route.ts`** — Suggest new achievements based on user behaviour over time

62. **All AI routes**:
    - Validate JWT; allow guest requests flagged `is_guest: true` in request body
    - Rate-limit guests to 5 req/hr, signed-in users to 50 req/hr
    - On Gemini error return `{ success: false, message: 'Could not generate — please try again' }` — never crash the app
    - API key (`GEMINI_API_KEY`) is stored server-side only and never exposed to the client

---

## Phase 10 — Sync Backend Routes

> Requires Supabase SQL schema to be in place (see note after Phase 1) before implementation.

63. **`src/app/api/sync/push/route.ts`** — Receive sync data from client (records where `updated_at > synced_at`); validate JWT; write to Supabase using the service-role client (`supabaseAdmin`); update `synced_at` on success

64. **`src/app/api/sync/pull/route.ts`** — Return all records for a user from Supabase updated after `last_pull_timestamp`; validate JWT; never run for guest users

---

## Key Architectural Rules

> These apply throughout all phases without exception.

| Rule | Detail |
|---|---|
| Single source of truth | Every stat or count shown anywhere reads from the same Dexie table that writes it — no separate home hub store |
| Offline-first | All reads/writes go to Dexie first; Supabase is a background sync target, never a blocker |
| No seeded or mock data | No hardcoded data, JSON fixtures, or mocked return values in any production screen |
| Guest users | Identical full functionality with local-only storage; data migrates to Supabase automatically on account creation |
| Soft deletes | `is_deleted = true` everywhere; never hard-delete locally until sync confirms deletion on server |
| AI calls | Client → backend API route → Gemini; the API key is never in client-side code |
| Frontend Supabase client | Initialised with `NEXT_PUBLIC_SUPABASE_ANON_KEY`; used for auth only |
| Backend Supabase client | Initialised with `SUPABASE_SERVICE_ROLE_KEY`; used for data sync only in API routes |
| Supabase SQL schema | Must be created (as migrations) after Phase 1 and before Phase 10; schema must exactly mirror the Dexie table definitions from Section 4 of the Technical Update v2 document |
| Stats start at zero | RPG level 1, 0 XP, all five stats 0 on first launch; only pre-existing achievement is "First Step" awarded at end of onboarding |
