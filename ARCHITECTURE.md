# Architecture

DevQuest is a modular monolith. One Next.js process serves the pages and the server actions. One PostgreSQL database stores the curriculum and your progress. Docker Compose can run both. Nothing here is a microservice, a mobile client, or a code sandbox.

That shape is deliberate. The point of this repository is that you can follow a single action from a button to a row.

## The request path

```
Browser
  → Next.js page or server action
    → service (one use case)
      → domain (pure rules: scoring, XP, rank)
      → Prisma repository calls
        → PostgreSQL
```

Pages and actions are thin. They check who you are, call one function, and render the result. They do not decide whether a login diagram is safe. That decision lives in `src/domain/challenges`, which imports neither React nor Prisma. The unit tests hit that layer with no database.

`src/server/services` is where a use case becomes a transaction. `recordAttempt` grades the answer, writes the attempt, updates progress, pays XP once, and unlocks achievements. If any step throws, the transaction rolls back. A wrong answer is not an exception. It is a score with `passed: false` and a finding that says what would happen in production.

## Why a monolith

A login review, a schema grader, and an XP update share one player and one database. Splitting them into services would add network calls and hide the path this repo is supposed to teach. When a feature needs a new boundary later, the domain functions can move. They already do not know about HTTP.

## Frontend

The App Router in `src/app` is the UI. Authenticated pages sit in the `(app)` group and share a shell: portrait, rank, and navigation. Challenge screens are client components because they hold in-progress answers. They submit to a server action. They never receive the rubric. The server parses the public definition with Zod and passes only that to the browser.

The portrait is an SVG built from a few enums (archetype, palette, silhouette, collar, accent). It is a character you can see and edit. It is not a second game with its own rules.

## Backend

Server actions in `src/server/actions` are the HTTP edge for mutations. There is no separate REST API yet. A server action is still a server boundary: it validates input, calls a service, and returns `{ ok: true, data } | { ok: false, error }`.

`src/proxy.ts` only checks that a session cookie exists before a protected path is rendered. It does not open the database. The layout then loads the session and redirects if the token is missing or expired. The proxy stays a cheap gate. The database remains the authority. If the proxy also trusted the cookie as proof of identity, a forged or expired cookie would look logged in.

## Data

Prisma schema: `prisma/schema.prisma`. Migrations: `prisma/migrations`. Curriculum source: `content/`. The seed writes worlds, levels, challenges, skills, and achievements. Re-running the seed updates that catalog and does not wipe attempts.

Challenge `definition` (what the player sees) and `rubric` (how it is scored) are JSON. They do not share columns, because a trace and an incident are different shapes. The columns you filter on — type, difficulty, slug, published — are real columns.

`Attempt` is an append-only history. `Progress` is the current standing for one player and one challenge, with a unique pair so retries cannot insert a second score row. XP already paid is stored on `Progress.xpAwarded`. A later attempt pays only the improvement. That is what stops you from farming a mission.

Text columns hold rank ids and challenge types instead of Postgres enums. The domain module is the list of legal values. A new challenge type does not require a database enum migration. The tradeoff is that Postgres will not reject a typo; the seed and Zod do.

## Authentication

Passwords are hashed with bcrypt, cost 12. The cookie stores a random token. The `sessions` table stores only the SHA-256 hash of that token. A leaked database backup does not contain a usable cookie.

This is a small session module on purpose. A library such as Auth.js is what you would reach for in a larger product. Here the login path is short enough to read in one sitting: hash the password, create a row, set an httpOnly cookie.

Signup and the seeded player both create a `Player`, a `Character`, and a zeroed `PlayerSkill` row per skill. The dashboard assumes those rows exist.

## Scoring and progression

`grade()` in `src/domain/challenges/grade.ts` switches on challenge type, validates the answer, and returns a `Score`. Several answers can pass. The login mission accepts a session store or a token issuer. The incident accepts two ship plans. A browser-to-database edge fails even if the rest of the diagram is right.

Dimensions (correctness, reasoning, architecture, security, and the others) are filled only when the mission actually exercises them. The overall number is what XP uses. `passed` can be stricter than the percentage: a dangerous login can score well on structure and still be marked not cleared.

Level thresholds and rank gates live in `src/domain/progression/progression.ts` as data, not as a hidden formula. Skill percent is earned skill XP divided by the XP the published missions can award for that skill. Skills with no mission yet stay at zero. That is the map of what this build can teach, not a fake weakness.

## Logging and errors

`src/server/logger.ts` writes one JSON line per event. Login failures and challenge submits are the events that matter. Unexpected scoring failures are logged and returned as a short message. The attempt is not saved if the transaction throws.

Wrong answers are findings: the principle, what would happen in production, and a hint. The UI says "Not cleared" and leaves the form in place.

## Testing

`tests/unit/domain.test.ts` covers rank gates, streak rules, XP grants, and each challenge engine, including a deliberately bad login and a plaintext password. Those tests do not boot Next or Postgres.

CI applies the migration, seeds, runs the unit tests, lints, and builds the app against Postgres. That proves the SQL and the TypeScript compile. It does not click through the UI.

## Deployment

`docker-compose.yml` runs Postgres and the web process. The container entrypoint applies migrations, seeds, and starts `next start`. Environment configuration is `DATABASE_URL` in `.env`. Secrets for a real deploy would be injected the same way, not committed.

This is a single-user training app. It is not hardened as a public multi-tenant service. Signup is open on purpose so you can make your own player on your machine.

## What is intentionally absent

- A native phone or tablet app. The UI is a responsive web page.
- Executing your code, shell, or Git, or cloning a repository.
- An LLM grader. The explain mission matches concepts and phrases. `grade()` is the seam a model could replace later.
- The other ~44 levels. Worlds exist as rows so the map is honest about what comes next.

## Tradeoffs worth defending

| Decision | What you gain | What you give up |
| --- | --- | --- |
| Modular monolith | One path you can read | You cannot scale the grader separately |
| JSON rubrics | New missions without new tables | Weaker database constraints on the puzzle shape |
| Hand-rolled sessions | A login you can explain | You maintain cookie and expiry behavior |
| bcrypt instead of Argon2 | Installs anywhere, no native build | Argon2id is the newer preference |
| Partial XP on a failed attempt | A near miss still moves the bars | XP is not a pure "cleared missions" count |
| Concept checklist for explanations | Deterministic, testable feedback | It can be gamed by naming the words |
