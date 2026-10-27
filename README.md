# 🎯 GATE Preparation Tracker

A minimalist, motivational personal website to track your GATE CS preparation journey. Built for the goal of **Under 100 Rank**.

**Stack:** Next.js 15 · Supabase (PostgreSQL) · Vercel (free hosting)

---

## Features

- 🎯 **Goal display** — "Under 100 Rank" always visible
- 📊 **Ring progress** — animated overall completion percentage
- 📚 **12 GATE CS subjects** with 6 tasks each (72 tasks total)
- ✅ **Daily goals** with auto-rollover tracking
- 🔥 **GitHub-style heatmap** — 365-day activity grid
- 😴 **Sleep mode** — start/stop sleep sessions with elapsed timer
- 🎯 **Current activity** status badge (Studying, On Break, etc.)
- 📋 **Weekly/Monthly plans** with inline editing
- 📝 **Daily reviews** with mood tracker
- 🐛 **Preparation problems** with public suggestion comments (moderated)
- 🔒 **Secure owner login** — bcrypt-hashed passphrase, HTTP-only cookies

---

## Prerequisites

- [Node.js 18+](https://nodejs.org/) installed
- A free [Supabase](https://supabase.com) account
- A free [Vercel](https://vercel.com) account

---

## Setup Guide

### Step 1 — Supabase Database

1. Go to [supabase.com](https://supabase.com) → **New project**
2. Choose a name and **strong database password** → Create project
3. Once created, go to **SQL Editor** (left sidebar)
4. Open `supabase/migrations/001_initial_schema.sql` in this project
5. **Copy the entire file** and paste it into the SQL editor
6. Click **Run** — this creates all tables, RLS policies, and seeds your 12 subjects + 72 tasks

### Step 2 — Get Supabase Credentials

From your Supabase project dashboard:
- **Settings → API** → Copy:
  - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
  - `anon / public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY`

### Step 3 — Generate the Owner Password Hash

Your owner passphrase is `UNDER100RANK`. You need to store a bcrypt hash of it in the database.

Run this in the Supabase SQL Editor (replace `UNDER100RANK` if you want a different phrase):

```sql
-- First, generate the hash using pgcrypto
SELECT crypt('UNDER100RANK', gen_salt('bf', 12));
```

Copy the output hash. Then insert your app config:

```sql
INSERT INTO app_config (deployment_date, target_year, timezone, owner_secret_hash)
VALUES (CURRENT_DATE, 2027, 'Asia/Kolkata', '<PASTE_HASH_HERE>');
```

> **Note:** The SQL migration already enables the `pgcrypto` extension. If you prefer to generate the hash with Node.js instead:
> ```bash
> node -e "const b=require('bcryptjs');b.hash('UNDER100RANK',12).then(h=>console.log(h))"
> ```

### Step 4 — Environment Variables

Create `.env.local` in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SESSION_SECRET=generate_a_random_64_char_string_here_use_openssl_rand_base64_48
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Generate a session secret:
```bash
# Option 1 (PowerShell)
[Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(48))

# Option 2 (if you have openssl)
openssl rand -base64 48
```

### Step 5 — Install & Run Locally

```bash
cd gate-tracker
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

To unlock owner editing, click the 🔒 icon and enter: **UNDER100RANK**

---

## Deploy to Vercel (Free)

### Option A — Vercel CLI
```bash
npm install -g vercel
vercel
```

Follow the prompts. When asked about environment variables, add all four from your `.env.local`.

### Option B — GitHub + Vercel Dashboard
1. Push this project to GitHub
2. Go to [vercel.com](https://vercel.com) → **New Project** → Import your repo
3. Add environment variables in the **Environment Variables** section:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `SESSION_SECRET`
4. Click **Deploy**

After deploying, update `NEXT_PUBLIC_APP_URL` in Vercel to your actual domain (e.g. `https://gate-tracker.vercel.app`).

---

## Project Structure

```
gate-tracker/
├── src/
│   ├── app/
│   │   ├── page.tsx              # Main page
│   │   ├── layout.tsx            # Root layout + metadata
│   │   ├── globals.css           # Design system
│   │   └── api/
│   │       ├── auth/
│   │       │   ├── login/        # POST — bcrypt verify, set session
│   │       │   └── logout/       # POST — destroy session | GET — check session
│   │       ├── tasks/            # GET (public) | PATCH (owner) tasks
│   │       ├── goals/            # GET/POST/PATCH/DELETE daily goals
│   │       ├── activity/         # GET/POST current activity status
│   │       ├── sleep/            # GET/POST sleep sessions (owner)
│   │       ├── problems/         # GET/POST/PATCH/DELETE problems + comments
│   │       ├── gameplan/         # GET/POST/PATCH/DELETE weekly/monthly plans
│   │       ├── reviews/          # GET/POST/DELETE daily reviews
│   │       └── heatmap/          # GET 365-day activity heatmap data
│   ├── components/
│   │   ├── AuthModal.tsx         # Owner login modal
│   │   ├── SubjectsSection.tsx   # 12 subjects + collapsible task lists
│   │   ├── DailyGoals.tsx        # Today's goals with add/check/delete
│   │   ├── Heatmap.tsx           # GitHub-style activity heatmap
│   │   ├── ActivitySection.tsx   # Current activity status
│   │   ├── SleepSection.tsx      # Sleep mode start/stop/history
│   │   ├── GamePlanSection.tsx   # Weekly/monthly plan editor
│   │   ├── ReviewSection.tsx     # Daily review with mood picker
│   │   └── ProblemsSection.tsx   # Problems + public comment moderation
│   └── lib/
│       ├── supabase.ts           # Supabase client (public + admin)
│       ├── session.ts            # Iron-session config
│       └── auth.ts               # Rate limiting + session helpers
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql  # Full schema + seed data
├── .env.example                  # Template for environment variables
├── package.json
└── README.md
```

---

## Security

| Feature | Implementation |
|---------|----------------|
| Owner auth | bcrypt hash comparison (server-side only) |
| Session | HTTP-only, `SameSite=Lax` cookie via iron-session |
| Rate limiting | 5 attempts / 10 min → 15-min lockout (in-memory) |
| Data access | Supabase RLS + service-role key only on server |
| Comment moderation | All public comments held for owner approval |

---

## The 12 Subjects & 72 Tasks

| # | Subject | Tasks |
|---|---------|-------|
| 1 | Operating Systems | Process management, Scheduling, Memory, Deadlocks, File systems, Virtual memory |
| 2 | Computer Organization & Architecture | Number systems, ALU, Memory hierarchy, Pipelining, I/O, Instruction sets |
| 3 | Theory of Computation | Regular languages, CFG, Pushdown automata, Turing machines, Decidability, Complexity |
| 4 | Compiler Design | Lexical analysis, Parsing, Semantic analysis, IR, Optimization, Code generation |
| 5 | General Aptitude | Verbal ability, Numerical ability, Logical reasoning, Data interpretation, Analytical, Mock tests |
| 6 | Engineering Mathematics | Linear algebra, Calculus, Probability, Statistics, Numerical methods, Transforms |
| 7 | Discrete Mathematics | Set theory, Graph theory, Combinatorics, Logic, Relations, Algebra |
| 8 | Programming & Data Structures | C fundamentals, Arrays/strings, Linked lists, Trees, Graphs, Hashing |
| 9 | Algorithms | Sorting/searching, Divide & conquer, Greedy, Dynamic programming, Graph algorithms, Complexity |
| 10 | Digital Logic | Boolean algebra, Logic gates, Combinational circuits, Sequential circuits, FSMs, A/D conversion |
| 11 | Computer Networks | Physical layer, Data link, Network layer, Transport layer, Application layer, Security |
| 12 | Database Management Systems | ER model, Relational model, SQL, Normalization, Transaction management, Indexing |

---

## Common Issues

**"System not configured" on login**
→ Make sure you ran the SQL migration AND inserted a row into `app_config` with your bcrypt hash.

**Tasks not loading**
→ Check your `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are correct in `.env.local`.

**Session not persisting after deploy**
→ Ensure `SESSION_SECRET` is set in Vercel environment variables (not just `.env.local`).

**Supabase RLS errors**
→ The migration sets up RLS policies automatically. If you see permission errors, re-run the full migration SQL.

---

*Built for GATE CS 2027. Under 100 Rank - let's go!*
