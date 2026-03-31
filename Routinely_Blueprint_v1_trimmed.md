**ROUTINELY**

Official Product Blueprint

*Version 1.0 --- Confidential --- Binding Reference Document*

  -----------------------------------------------------------------------
  *Your personal operating system. One app to manage your studies, work,
  fitness, finances, and personal life --- intelligently, beautifully,
  and on every platform. Web • iOS & Android • Desktop*

  -----------------------------------------------------------------------

**Table of Contents**

1\. What is Routinely

2\. Authentication & Account System

3\. Full Application Structure

4\. Onboarding Flow

5\. Sidebar Navigation

6\. Home Hub

7\. Routine System

8\. The Five Modes

9\. Custom Modes

10\. User Profile --- RPG System

11\. Achievement Unlock Toast

12\. Pomodoro Timer

13\. AI Layer --- All Features

14\. Settings

15\. Tech Stack

16\. Recommended Build Order

**1. What is Routinely**

Routinely is a personal operating system --- a single application that
helps users manage every area of their life in one place. Instead of
juggling five different apps for studying, work, fitness, finances, and
personal goals, everything lives inside Routinely.

The user switches between focused modes for deep, context-specific work,
then zooms back out to a clean home hub to see their entire life at a
glance. The app is built for students, professionals, and anyone who
wants to be more intentional about how they spend their time.

  -----------------------------------------------------------------------
  *Platform targets: Web (browser) • Mobile (iOS & Android) • Desktop
  (Windows & macOS)*

  -----------------------------------------------------------------------

**Core philosophy**

-   Modes are lenses, not silos --- zoom in for focused work, zoom out
    to see everything together.

-   Routines are the skeleton, tasks are the flesh --- recurring
    structure from routines, one-off additions from tasks.

-   Clean and minimal, but deeply rewarding --- the RPG gamification
    system adds motivation without cluttering the core experience.

-   Intelligence runs in the background --- the AI quietly generates
    achievements, spots patterns, surfaces summaries, and routes inputs
    to the right place without interrupting the user.

**2. Authentication & Account System**

The authentication system is the entry point of Routinely. Every user
flow --- whether they are a first-time visitor or a returning user ---
passes through this system. It must feel seamless, fast, and
trustworthy.

**2.1 --- Sign-in methods supported**

  -------------------------- --------------------------------------------
  **Method**                 **Details / Notes**

  Email & password           Standard credential login. Password must be
                             at least 8 characters. Enforced on sign-up.

  Google (OAuth)             One-tap Google account login via OAuth 2.0.
                             No password stored in Routinely\'s system.
  -------------------------- --------------------------------------------

  -----------------------------------------------------------------------
  *Security level: Basic --- email and password only. No two-factor
  authentication in v1.0. Can be added in a future release.*

  -----------------------------------------------------------------------

**2.2 --- Guest / trial mode**

New visitors can explore Routinely without creating an account. This
lowers the barrier to entry and lets the app sell itself before asking
for a commitment.

-   The guest mode is accessible from the landing/welcome screen via a
    \'Try it first\' or \'Explore as guest\' button.

-   Guest users get access to a limited but functional version of the
    app --- they can browse modes, set up a sample routine, and see the
    home hub.

-   Guest data is stored locally only (in browser/device storage) and is
    not synced across devices.

-   A persistent, non-intrusive banner reminds the guest that their data
    will be lost unless they create an account.

-   When a guest decides to sign up, their existing data (routines,
    tasks, modes selected) is migrated to their new account
    automatically --- no work is lost.

-   Guest mode has no access to: AI features, RPG profile, achievements,
    cross-device sync, or the Pomodoro session history.

**2.3 --- The full authentication flow**

**New user --- sign up**

-   User lands on the Routinely welcome screen (landing page).

-   They choose: \'Create account\', \'Continue with Google\' (OAuth),
    or \'Try it first\' (guest mode).

-   If email sign-up: enter full name, email address, and password.
    Password strength indicator shown in real time.

-   Email verification link is sent immediately. User is shown a \'Check
    your inbox\' screen.

-   User clicks the verification link and is redirected back,
    automatically logged in. Onboarding begins.

*Note: If the user signs up via Google OAuth, email verification is
skipped --- Google has already verified the email.*

**Returning user --- sign in**

-   User opens Routinely and is shown the sign-in screen.

-   They choose: email & password, or \'Continue with Google\'.

-   On success: taken directly to their Home Hub. On failure: clear
    error shown. After 5 failed attempts, a 15-minute cooldown is
    enforced.

**Forgot password**

-   User clicks \'Forgot password?\' on the sign-in screen.

-   They enter their email address. A password reset link is sent.

-   The link expires after 1 hour. User enters a new password and is
    redirected to sign in.

**Guest to full account conversion**

-   Guest user clicks the \'Create account\' banner or button at any
    point.

-   They complete the sign-up flow (email/password or Google).

-   After verification, their guest data (modes, routines, tasks) is
    automatically merged into the new account.

**Sign out & account deletion**

-   Sign out: available in Settings → Account. Clears the session token.
    Data remains intact in the cloud.

-   Delete account: Settings → Account → Delete account. User must type
    \'DELETE\' to confirm. All data is permanently purged within 24
    hours. Google-linked accounts are also unlinked.

**2.4 --- Session management**

-   Sessions use secure HTTP-only cookies (web) and encrypted local
    tokens (mobile/desktop).

-   Sessions persist for 30 days by default. Session tokens are
    refreshed automatically in the background.

-   If a session expires or is invalidated, the user is redirected to
    the sign-in screen with a friendly message.

**2.5 --- Authentication screens required**

  -------------------------- --------------------------------------------
  **Screen**                 **Purpose**

  Welcome / landing screen   Entry point --- options to sign up, sign in,
                             or try as guest.

  Sign up screen             Email, name, password fields + Google OAuth
                             button.

  Email verification screen  \'Check your inbox\' --- resend link option.

  Sign in screen             Email + password fields + Google OAuth
                             button + forgot password link.

  Forgot password screen     Enter email to receive reset link.

  Reset password screen      Enter new password + confirm --- accessed
                             via email link.

  Guest mode banner          Persistent reminder shown to all guest users
                             at the top of every screen.
  -------------------------- --------------------------------------------

**3. Full Application Structure**

  -----------------------------------------------------------------------
  *Top-level structure: Auth System → Guest Mode / Onboarding → Home Hub
  → Sidebar → Modes (5 built-in + custom) → User Profile (RPG) →
  Settings*

  -----------------------------------------------------------------------

  -------------------------- --------------------------------------------
  **Layer**                  **What it contains**

  Auth system                Welcome screen, sign up, sign in, password
                             reset, email verification, guest mode,
                             session management.

  Onboarding                 5-screen guided setup --- only shown to new
                             verified users.

  Home hub                   Unified dashboard --- mode summary cards,
                             current routine, missed routines.

  Sidebar                    Navigation between all modes, Pomodoro,
                             profile, settings.

  Modes                      Study, Professional, Fitness, Financial,
                             General, and user-created custom modes.

  User profile               RPG character, stats, skill trees,
                             achievements, badge collection.

  Settings                   Modes manager, appearance & themes,
                             notifications, account management.
  -------------------------- --------------------------------------------

**4. Onboarding Flow**

A guided, visual, multi-screen experience shown only to new verified
users after their first successful sign-up. Clean, warm, and
intentional. There should be an option to skip the onboarding process if
the user knows what they are doing.

**Screen 1 --- Welcome**

App name, a short tagline, and a single \'Get started\' button. Sets the
full visual tone. No clutter.

**Screen 2 --- What\'s your name?**

Simple text input. The name personalises the experience and becomes the
user\'s character name in the RPG profile. Pre-filled if the user signed
up via Google.

**Screen 3 --- Pick your modes**

A beautiful card grid showing all available modes --- Study,
Professional, Fitness, Financial, General, and a \'Create your own\'
card. Each card shows an icon and a one-line description. The user taps
to select. Must select at least one. More modes can be added or removed
later in Settings.

**Screen 4 --- Set up your first routine (optional)**

A friendly prompt to add one routine to get started --- or they can skip
it and do it inside a mode later.

**Screen 5 --- Character created**

An animated moment --- the user\'s avatar appears at level 1 with their
character name. They immediately receive their first achievement: the
\'First Step\' badge. The achievement unlock toast appears for the first
time here, naturally introducing the mechanic.

  -----------------------------------------------------------------------
  *Important: Users who converted from guest mode skip Screens 2 and 3
  --- their name and selected modes are already known. They go straight
  to Screens 4 and 5.*

  -----------------------------------------------------------------------

**5. Sidebar Navigation**

Already built as a Next.js + Tailwind CSS component (Sidebar.tsx). Dark,
Supabase-style collapsible sidebar. This is the primary navigation
mechanism on web and desktop.

**Behaviour**

-   Collapsed by default --- 52px wide, showing icons only. Compact and
    non-distracting.

-   Expands smoothly on hover --- slides to 220px wide. Labels, badges,
    and section names become visible.

-   Collapses cleanly when the mouse moves away.

-   Clicking a mode icon takes the user to that mode\'s home summary
    screen first.

-   On mobile --- the sidebar is replaced by a bottom tab bar with the
    same items.

**Sidebar items (top to bottom)**

-   App logo / name --- at the very top. Collapses to just the logo
    icon.

-   Home Hub --- first navigation item, always visible.

-   Pomodoro Timer --- always accessible from any screen.

-   \[Active mode icons\] --- one icon per mode the user has enabled, in
    the order they set.

-   \+ New Mode --- button to create a custom mode. Always at the bottom
    of the mode list.

-   Settings --- near the bottom.

-   User profile avatar --- at the very bottom. Clicking opens the RPG
    profile page.

**Badges on mode icons**

Each mode icon can display a small badge number showing pending items
(e.g. tasks due today, bills due soon). Badges are calculated
automatically from each mode\'s data.

**6. Home Hub**

The first screen the user sees after signing in every day. Mode-agnostic
--- it pulls data from all active modes and presents one unified, clean
view. The AI review is never pushed automatically --- it is generated
only when the user requests it.

**6.1 --- Mode summary cards**

One card per active mode. Each card is unique to its mode and shows the
most important snapshot at a glance. Tapping a card takes the user
directly into that mode.

  -------------------------- --------------------------------------------
  **Mode**                   **Summary card content**

  Study                      3 tasks due today • 2 hrs studied this week
                             • Maths exam in 4 days • Study streak: 5
                             days

  Financial                  ₦12,400 spent this month • ₦8,600 left in
                             budget • 1 bill due tomorrow • Savings goal:
                             62% complete

  Fitness                    Workout streak: 4 days • Today: Chest &
                             Triceps • Last session: Yesterday

  Professional               2 deadlines this week • 3 tasks in progress
                             • Next meeting: Today 3pm

  General                    Reading habit: 6 day streak • 2 personal
                             tasks today • Last journal entry: Yesterday
  -------------------------- --------------------------------------------

**6.2 --- Current & upcoming routine strip**

A highlighted section near the top of the home hub showing what the
master routine says the user should be doing right now or coming up
next. Always drawn from the master routine engine.

  -----------------------------------------------------------------------
  *Example: Now → Study session: Physics (until 4:00 pm) Next → Gym at
  6:00 pm*

  -----------------------------------------------------------------------

**6.3 --- Missed routines section**

A collapsible section below the mode summary cards. Shows any routines
from today or the past week that were not completed. For each missed
routine, the user can: mark it as done, reschedule it to another time,
or dismiss it.

**7. Routine System**

The routine system is one of the most important architectural decisions
in Routinely. It operates on two levels simultaneously --- mode-specific
and master --- and is the foundation that the home hub, AI layer, and
missed routines all depend on.

**7.1 --- Mode-specific routines**

Inside each mode, the user builds a weekly routine schedule day by day.
These routines belong to that mode and define its recurring structure
for the week.

-   Study mode example: \'Every Monday --- Maths 9--10am, Physics
    2--3pm\'

-   Fitness mode example: \'Every Tuesday & Thursday --- Gym 6--7pm\'

-   Financial mode example: \'Every Sunday --- Review weekly spending,
    Every 1st of the month --- Plan new budget\'

-   Professional mode example: \'Every Friday --- Weekly work review
    4--5pm\'

  -----------------------------------------------------------------------
  *AI-assisted creation: The user can describe their schedule in plain
  language and the AI will generate the routine for them. The user
  reviews, edits if needed, and confirms. (See Section 13 --- AI Feature
  2)*

  -----------------------------------------------------------------------

**7.2 --- Tasks on top of routines**

-   Routines --- repeat every week automatically. They are the default
    structure of every day.

-   Tasks --- added manually for specific days. They do not repeat
    unless explicitly set to. They are the exceptions and additions
    layered on top of the routine.

**7.3 --- Master routine**

All mode-specific routines automatically feed into one master timeline.
This is a unified, chronological view of everything the user has
scheduled across all modes for any given day or week. The master routine
is what the home hub reads from to show the current/next routine item
and identify missed ones. The user never has to manually sync anything
between modes --- it happens automatically.

**8. The Five Modes**

Every mode follows the same navigation pattern when entered: Mode home
summary → individual sections within the mode. Each mode is a
purpose-built tool for that area of life --- not a reskinned task list.
Sections within any mode can be toggled on or off in Settings → Modes
Manager.

**8.1 --- Study Mode**

Home summary shows: hours studied this week, tasks and assignments due
today, upcoming exams with countdown, current study streak, and next
scheduled study session.

Sections:

-   Courses & subjects --- Add all courses with lecturer name, credit
    units, and notes.

-   Timetable --- Weekly class schedule with day, time, and venue per
    course.

-   Study planner --- Build a study plan per subject with frequency and
    duration per week.

-   Assignments & deadlines --- Log assignments linked to specific
    subjects with due dates and completion status.

-   Exam tracker --- Exam dates per subject with live countdown timers.

-   Session history --- Log of all completed study sessions: subject,
    duration, date.

-   Routine --- Study-specific weekly routine schedule feeding into the
    master routine.

**8.2 --- Professional Mode**

Home summary shows: active projects count, tasks due this week, deep
work hours logged this week, and next meeting or deadline.

Sections:

-   Projects --- Add projects with descriptions, deadlines, and progress
    tracking.

-   Tasks & deadlines --- Task list linked to projects with priority
    levels and due dates.

-   Deep work schedule --- Schedule dedicated focused work blocks on
    specific days and times.

-   Meeting log --- Log meetings with notes, participants, date, and
    outcomes.

-   Routine --- Work-specific weekly routine schedule feeding into the
    master routine.

**8.3 --- Fitness & Health Mode**

Home summary shows: current workout streak, today\'s planned workout,
weekly active minutes, and last logged body metric (if enabled).

Sections:

-   Workout plans --- Build weekly workout plans day by day: exercise,
    sets, and reps.

-   Exercise log --- Log completed workouts with actual performance:
    weights used, reps done.

-   Body metrics --- Optional tracker for weight, measurements, or any
    custom metric the user defines.

-   Rest day planner --- Schedule and respect rest days with reminders
    so the user doesn\'t over-train.

-   Routine --- Fitness-specific weekly routine schedule feeding into
    the master routine.

**8.4 --- Financial Mode**

Home summary shows: total income this month, total expenses this month,
remaining budget across all categories, savings goal overall progress,
and next bill due date.

Sections:

-   Income tracker --- Log all income sources (salary, freelance,
    passive) with amounts and dates.

-   Expense tracker --- Log daily expenses with category, amount, and
    optional notes. Balance is calculated automatically per category.

-   Budget planner --- Allocate monthly income into spending categories
    (rent, food, transport, entertainment, savings, etc.). App
    calculates remaining balance per category as expenses are logged in
    real time.

-   Savings goals --- Named savings targets with deadline dates.
    Progress is tracked automatically as income is logged.

-   Bills & reminders --- Recurring bills with amounts and due dates.
    Reminders are sent before each due date.

-   Reports / detailed view --- OPTIONAL, user-toggled. Shows: pie chart
    of spending by category, income vs expenses bar chart over time,
    savings goal progress bars, and month-on-month comparison. Charts
    appear only in this section and only when the user enables it.

-   Routine --- Financial habit schedule (e.g. weekly spending reviews,
    monthly budget planning).

**8.5 --- General / Personal Mode**

Home summary shows: active personal goals, top habit streaks, tasks for
today, and last journal entry date (if journal is enabled).

Sections:

-   Personal goals --- Set short-term and long-term goals with progress
    tracking.

-   Habits --- Daily or weekly habits with streak tracking and
    completion history.

-   Daily tasks --- A simple personal to-do list for each day.

-   Journal --- Optional daily reflection: simple text entry per day.
    The AI can prompt with a question if the user enables it.

-   Routine --- Personal weekly routine schedule feeding into the master
    routine.

**9. Custom Modes**

Any user can create a mode that does not fit the five built-in
categories. Custom modes are fully first-class --- they behave exactly
like built-in modes in every way.

**Creation flow**

-   User taps \'+ New Mode\' in the sidebar.

-   Enters a mode name (e.g. \'Arabic Learning\', \'Side Project\',
    \'Spiritual Practice\').

-   Chooses an icon from a library.

-   Selects which sections to enable: Tasks, Habits, Routine, Notes,
    Timer, Tracker, Goals, Log.

-   Confirms --- the mode is created and appears in the sidebar
    immediately.

**What custom modes get automatically**

-   Their own home summary card on the Home Hub.

-   Their own mode-specific routine feeding into the master routine.

-   An AI-generated achievement system tailored to the mode name,
    sections, and goals set inside it (see Section 13 --- AI Feature 1).

-   Their own skill tree generated by the AI.

-   Their sections can be toggled on or off later in Settings → Modes
    Manager.

  -----------------------------------------------------------------------
  *Example: A user creates a mode called \'Arabic Learning\' with Tasks,
  Routine, and Tracker enabled. The AI automatically generates
  achievements like \'First Word\', \'Consistent Learner\',
  \'Conversationalist\', and \'Hundred Words\'.*

  -----------------------------------------------------------------------

**10. User Profile --- RPG System**

Accessed by clicking the user avatar at the bottom of the sidebar. Feels
like opening a character sheet in an RPG --- rewarding, personal, and
motivating --- while maintaining the clean aesthetic of the rest of the
app.

**10.1 --- Character overview**

-   Character name --- set during onboarding.

-   Avatar --- customisable colour and style.

-   Current level --- displayed as \'Level 7\' etc.

-   Character title --- changes as the user levels up. Examples: \'The
    Focused Scholar\', \'The Disciplined One\', \'The Life Architect\',
    \'The Balanced One\'.

-   XP bar --- visual progress to the next level.

-   XP sources: completing tasks, maintaining streaks, hitting goals,
    unlocking achievements.

**10.2 --- Master character stats**

Five core stats, each fed by a specific mode. Each stat has its own
level from 1 to 100 and contributes XP to the master character level. A
user active in only one mode will level up that stat quickly while
others stay low --- this design encourages well-rounded life management
across all modes.

  --------------------- --------------------- ----------------------------
  **Stat**              **Fed by**            **What builds it**

  Focus                 Study mode            Study sessions completed,
                                              Pomodoro sessions tagged to
                                              study.

  Drive                 Professional mode     Tasks completed on time,
                                              deep work hours logged.

  Vitality              Fitness mode          Workouts logged, workout
                                              streaks maintained.

  Wealth                Financial mode        Budgets kept under limit,
                                              savings goals reached.

  Balance               General mode          Personal habits maintained,
                                              journal entries written.
  --------------------- --------------------- ----------------------------

**10.3 --- Mode skill trees**

Each active mode has its own skill tree --- a branching set of skills
that unlock permanently as the user hits milestones in that mode.

  -------------------------- --------------------------------------------
  **Mode**                   **Example skills**

  Study                      Consistent, Night Owl, Exam Crusher, Speed
                             Reader, Deep Diver

  Professional               Deadline Keeper, Deep Worker, Project
                             Finisher

  Fitness                    Iron Streak, Heavy Lifter, Rest Day
                             Respector, Early Bird

  Financial                  Budget Master, Saver, Zero Waste, Bill
                             Slayer

  Custom modes               AI-generated skill tree based on mode name,
                             sections enabled, and goals set.
  -------------------------- --------------------------------------------

**10.4 --- Achievements & badges**

Milestone rewards displayed as a badge grid on the profile page. Locked
badges are visible but greyed out --- users can always see what they are
working toward. Built-in achievements are pre-defined. Custom mode
achievements are AI-generated.

  -------------------------- --------------------------------------------
  **Badge**                  **How to earn it**

  First Step                 Completed onboarding.

  Week Warrior               Stuck to a full week of routines across all
                             modes.

  Multi-Mode                 Activated 3 or more modes.

  Pomodoro Pro               Completed 50 Pomodoro sessions.

  Life Architect             Had all 5 built-in modes active
                             simultaneously.

  Debt-Free Mindset          Stayed under budget for 3 months straight.

  Scholar                    Studied every day for 30 days.

  Iron Will                  Maintained an active streak in every active
                             mode simultaneously.

  Goal Getter                Completed a personal goal in General mode.

  AI-generated badges        Automatically created per custom mode based
                             on its name and content.
  -------------------------- --------------------------------------------

**11. Achievement Unlock Toast Notification**

Every time the user earns an achievement --- whether from a built-in
milestone or an AI-generated one --- a toast notification appears on
screen. This is the moment that makes the RPG feel real.

**Design & behaviour**

-   Slides in from the top right of the screen smoothly.

-   Displays: the badge icon, the achievement name in bold, and a short
    flavour line describing what triggered it.

-   Subtle shimmer or glow effect on the badge icon --- signals \'this
    is a reward moment\'.

-   Gold or amber accent border --- visually distinct from regular app
    notifications.

-   Auto-dismisses after 4--5 seconds. Tapping the toast takes the user
    directly to their Achievements page.

-   Optional sound effect --- respects the user\'s notification
    settings.

-   On mobile: a light haptic vibration when the toast appears.

-   If multiple achievements unlock at once, they queue --- one appears
    after the other, never stacked.

  -----------------------------------------------------------------------
  *Example toast: 🏅 Week Warrior unlocked --- \"You stuck to your full
  routine for 7 days straight across all modes.\"*

  -----------------------------------------------------------------------

**12. Pomodoro Timer**

A standalone feature accessible from the sidebar at all times, from any
screen in the app. The Pomodoro timer is not locked to any single mode
--- it serves all of them.

**Core behaviour**

-   When starting a session, the user tags it to a mode and optionally
    to a specific task, subject, or project.

-   The session is automatically logged to the relevant mode\'s session
    history.

-   The session contributes XP to the relevant master character stat.

**Configurable settings**

  --------------------- --------------------- ----------------------------
  **Setting**           **Default**           **User can change?**

  Work duration         25 minutes            Yes

  Short break duration  5 minutes             Yes

  Long break duration   15 minutes            Yes

  Cycles before long    4 cycles              Yes
  break                                       

  Sound on/off          On                    Yes

  Notification on/off   On                    Yes
  --------------------- --------------------- ----------------------------

**13. AI Layer --- All Features**

The AI is powered by the Anthropic Claude API and runs quietly in the
background. It surfaces intelligence when it is useful and never
interrupts the user\'s flow. There is no persistent AI chatbot or
briefing pushed at the user --- everything is on-demand or happens
silently behind the scenes.

**AI Feature 1 --- Auto-generated achievements & skill trees**

When a custom mode is created, the AI analyses the mode name, the
sections the user has enabled, and any goals set inside it --- then
generates a full, contextually relevant set of achievements and skill
tree unlocks automatically. As the user progresses over time, the AI can
also suggest entirely new achievements based on patterns it notices in
their behaviour. All AI-generated achievements follow the exact same
visual design language as the built-in ones.

**AI Feature 2 --- AI-assisted routine creation**

Inside any mode, instead of building a routine manually from scratch,
the user can describe their schedule or preferences in plain language.
The AI interprets the description and generates a structured, day-by-day
weekly routine. The user reviews what was generated, makes any edits
they want, and confirms. Once confirmed, the routine feeds into the
master routine automatically.

*Example: a user types \'I have Maths, Physics, and Chemistry. I want to
study every weekday, heavier load mid-week, and I have classes in the
mornings\' --- the AI generates a full balanced study schedule from
that.*

**AI Feature 3 --- AI cross-mode routing**

When a user inputs anything --- through natural language input, routine
creation, or anywhere else in the app --- the AI reads the intent and
routes each piece of information to the correct mode automatically. If
an input spans multiple modes, it is split intelligently and placed
correctly across all relevant modes simultaneously. Every routing action
is clearly summarised and shown to the user before it is applied. The
user can undo or reassign anything the AI routed.

*Example: a user types \'I also need to study Chemistry on Wednesday at
4pm and set aside ₦5,000 for savings this month\' --- the AI creates a
study session in Study mode and a savings entry in Financial mode, then
shows the user exactly what was created and where.*

**AI Feature 4 --- Mode reviews & summaries**

Each mode can generate a detailed review pulling from all of its
sections on demand. The user requests it --- it is never pushed
automatically. Examples: a weekly study report covering hours studied,
subjects covered, assignments completed, and exam readiness; a monthly
financial snapshot covering income, spending by category, budget
adherence, and savings progress.

**AI Feature 5 --- Adaptive planning suggestions**

Over time, the AI notices patterns in how the user actually uses the app
versus what their routines say they should be doing. When a meaningful
pattern is detected --- for example, the user consistently skips
Thursday gym sessions, or always completes study tasks late at night ---
the AI gently surfaces a suggestion to adjust the routine to better fit
reality. These suggestions are always optional and non-intrusive. The AI
never modifies anything without explicit confirmation.

**AI Feature 6 --- Natural language input**

The user can type naturally to add anything to the app from anywhere.
The AI interprets the input and places it in the correct section of the
correct mode.

-   \'add a Chemistry exam on Friday\' → creates an exam entry in Study
    mode for Friday.

-   \'log ₦2,500 spent on food today\' → creates an expense entry in
    Financial mode under the food category.

-   \'remind me to review my budget every Sunday evening\' → creates a
    recurring routine entry in Financial mode.

*The AI confirms every placement before saving.*

**AI Feature 7 --- Conflict detection**

The master routine is continuously monitored for scheduling clashes
across all modes. If two items from different modes are scheduled at the
same time --- for example a study session and a gym session both at 6pm
on Tuesday --- the AI detects this and alerts the user immediately. The
user is offered options: keep one, reschedule one, or keep both (marking
them as a known overlap). The AI never silently resolves conflicts on
its own.

**14. Settings**

**Modes manager**

-   Add new modes --- built-in or custom.

-   Remove modes --- removing a mode hides it from the sidebar and home
    hub but does not delete its data.

-   Reorder modes --- drag to change their position in the sidebar.

-   Per-mode section toggles --- enable or disable individual sections
    within any mode.

**Appearance**

-   Dark / light mode toggle.

-   Preset themes: Midnight (deep dark blue-black), Arctic (clean white
    and ice blue), Forest (dark green tones), Amber (warm golden tones),
    Rose (soft pink and warm white).

-   Custom accent colour picker --- overrides the accent colour in any
    preset theme.

-   Live preview updates as the user makes changes --- no need to save
    and reload.

**Notifications & routines**

-   Set reminder times for routines --- how far in advance to be
    notified.

-   Configure which modes send notifications.

-   Set quiet hours --- a time window where no notifications are sent.

**Account**

-   Edit display name and avatar.

-   Change email address and password.

-   Link or unlink Google account.

-   Export all data --- downloads a full JSON or CSV export of every
    piece of data in every mode.

-   Delete account --- requires typing \'DELETE\' to confirm. All data
    is permanently purged within 24 hours.

**About**

App version number and build date. Credits.

**15. Tech Stack**

  --------------------- --------------------- ----------------------------
  **Layer**             **Technology**        **Notes**

  Frontend --- Web      Next.js + Tailwind    App router. Sidebar.tsx
                        CSS                   already built.

  Frontend --- Mobile   React Native          Shares business logic and
                                              API calls with web.

  Frontend --- Desktop  Tauri                 Wraps the Next.js web build.

  Backend               Node.js + PostgreSQL  REST API. Auth handled
                                              server-side.

  Authentication        JWT + Google OAuth    HTTP-only cookies on web,
                        2.0                   encrypted tokens on mobile.

  AI features           Anthropic Claude API  claude-sonnet-4-20250514
                                              model.

  File storage          To be decided         For avatar images and data
                                              exports.

  Sidebar component     Sidebar.tsx           Already built --- ready to
                                              integrate into layout.
  --------------------- --------------------- ----------------------------

**16. Recommended Build Order**

Build strictly in this order. Each phase builds directly on the last. Do
not skip phases or build out of sequence --- later phases depend on
foundations laid in earlier ones.

  --------------------- --------------------- ----------------------------
  **\#**                **Phase**             **What is built**

  1                     Project setup         Folder structure, Tailwind
                                              config, environment
                                              variables, Sidebar.tsx
                                              integrated into root layout.

  2                     Authentication system Welcome screen, sign-up,
                                              email verification, sign-in,
                                              forgot password, reset
                                              password, Google OAuth,
                                              guest mode, session
                                              management.

  3                     Onboarding flow       All 5 onboarding screens,
                                              character name, mode
                                              selection, first routine
                                              prompt, character creation
                                              animation, First Step
                                              achievement.

  4                     Home hub              Layout, mode summary cards,
                                              current routine strip,
                                              missed routines section.

  5                     Routine system        Mode-specific routine
                                              builder, master routine
                                              engine, routine-task
                                              separation logic.

  6                     Study mode            All sections: courses,
                                              timetable, study planner,
                                              assignments, exam tracker,
                                              session history, mode
                                              routine.

  7                     Financial mode        All sections: income,
                                              expenses, budget planner,
                                              savings goals, bills,
                                              optional reports with
                                              charts.

  8                     Professional mode     All sections: projects,
                                              tasks, deep work schedule,
                                              meeting log, mode routine.

  9                     Fitness mode          All sections: workout plans,
                                              exercise log, body metrics,
                                              rest day planner, mode
                                              routine.

  10                    General mode          All sections: goals, habits,
                                              daily tasks, optional
                                              journal, mode routine.

  11                    Custom mode creator   Mode creation flow, section
                                              picker, icon library, AI
                                              achievement generation on
                                              creation.

  12                    RPG profile system    Character overview, master
                                              stats, mode skill trees,
                                              achievement badge grid, XP
                                              engine.

  13                    Achievement toast     Toast component, queue
                        system                logic, animation, sound
                                              effect, haptic feedback on
                                              mobile.

  14                    Pomodoro timer        Full timer implementation,
                                              session tagging, automatic
                                              logging, XP contribution.

  15                    AI layer              All 7 AI features:
                                              achievement generator,
                                              routine creator, cross-mode
                                              routing, reviews, adaptive
                                              suggestions, natural
                                              language input, conflict
                                              detection.

  16                    Settings              Modes manager, appearance &
                                              themes, notifications,
                                              account management, data
                                              export, delete account.

  17                    Mobile packaging      React Native implementation,
                                              bottom tab bar navigation,
                                              haptic feedback,
                                              mobile-specific UI
                                              adjustments.

  18                    Desktop packaging     Tauri build,
                                              desktop-specific window
                                              management, system tray,
                                              native notifications.
  --------------------- --------------------- ----------------------------

*Routinely Product Blueprint v1.0 • This document is the single source
of truth for the entire build. • All decisions recorded here are
binding.*
