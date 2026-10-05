# Learning this codebase

Read this after [ARCHITECTURE.md](ARCHITECTURE.md). The goal is that you can point at a file and say why it exists.

## Start here

Run the app (`README.md`), sign in as `ada@devquest.local` / `devquest`, and open the mission **Debug the invoice API**. Then come back and follow that same click through the code.

You are not memorizing framework trivia. You are learning the shape of a web app by watching this one do a job.

## The pieces, in the order a request hits them

1. **Browser.** The invoice page is `src/app/(app)/play/[slug]/page.tsx`. It is a server component. It runs on the server, loads the mission, and sends HTML to the browser. The interactive part is `ChallengePlayer`, a client component. The split is the first lesson: the server may see the rubric; the browser may not.

2. **Proxy.** `src/proxy.ts` runs before the page. If you have no `dq_session` cookie, it redirects you to `/login`. It does not look you up. A cookie is a claim. The database checks the claim later.

3. **Session.** `src/server/auth/session.ts` hashes the cookie and loads `sessions`. The table stores the hash, not the cookie. Logout deletes that row. That is why "log out everywhere" is a database delete, not a secret buried in the browser.

4. **Page.** The play page calls `getChallengeView`, then `parsePublicDefinition`. Zod checks the JSON from Postgres before React sees it. If the seed is corrupt, the page says so instead of crashing inside a puzzle.

5. **Client form.** `src/components/challenges/debug-board.tsx` holds the line you clicked and the options you picked. That state disappears on a refresh unless we also saved an attempt. Holding it in React is fine because it is not the source of truth.

6. **Server action.** `submitChallenge` in `src/server/actions/challenge.ts` is the function the form calls. `"use server"` means the browser cannot read the file. It can only invoke the exported function. The action checks the session again. Do not trust the proxy alone. A direct call can skip the page.

7. **Service.** `recordAttempt` in `src/server/services/progress.ts` is the use case. It loads the challenge, including the rubric, and calls `grade`. Then it opens a transaction. The attempt row, the progress row, the XP, the streak, and the achievements commit together or not at all. That is the reason a transaction exists: money and XP are the same kind of problem. You do not want half of the update to stick.

8. **Domain.** `grade` in `src/domain/challenges/grade.ts` does not know your user id. It knows the puzzle and the answer. The invoice mission lives in `src/domain/challenges/debug.ts`. A wrong cause returns a finding: the principle, the production impact, and a hint. Tests in `tests/unit/domain.test.ts` call this without Next or Postgres. If you change the rule, change the test in the same edit.

9. **Database.** Prisma writes `attempts` (history) and `progress` (current standing). XP paid so far sits on `progress.xpAwarded`. A worse retry pays nothing. A better retry pays the difference. That rule is `xpGrant` in `src/domain/progression/xp.ts`.

10. **Response.** The action returns the score. `Debrief` renders "Cleared" or "Not cleared". `revalidatePath` tells Next the dashboard is stale so the XP bar updates on the next load.

## Why the invoice bug is the teacher

The handler in the mission already calls `getSession`. The caller is authenticated. The handler still returns any invoice id. Authentication answers "who are you?" Authorization answers "may you see this row?" Generated CRUD skips the second question all the time. The debrief is supposed to make that difference feel like a leaked customer, not a vocabulary card.

## Your character

`Character` is one row per player. The editor in `src/components/character-editor.tsx` changes local state immediately so the portrait moves, then `saveProfile` writes the row. Until you save, a refresh throws the edit away. That is the difference between UI state and stored state.

Rank is not stored as the source of truth. `rankForXp` computes it from total XP. The column on `players` is updated in the same transaction so you can inspect it in SQL. If those two ever disagree, trust the function and fix the writer.

## How a new mission gets in

1. Add a challenge object in `content/challenges.ts`.
2. Give it a level in `content/worlds.ts` and skill weights that sum to 1.
3. If it needs a new interaction, add a scorer next to the others and a branch in `grade` and in `ChallengePlayer`.
4. Re-seed: `npm run db:seed`.
5. Add a unit test that passes a good answer and a bad one.

You should not need a new table for a new puzzle. If you do, stop and ask whether the definition/rubric JSON is being asked to do something relational, like "list every attempt," which already has a table.

## Concepts this repo is here to make concrete

- **Client and server.** The portrait updates in the browser. The score is computed on the server. The browser cannot award itself XP.
- **Validation at the boundary.** Zod parses answers and catalog JSON. The domain functions then trust their inputs.
- **Derived data.** Level and rank come from XP. Skill percent comes from earned XP over possible XP.
- **Idempotent rewards.** The progress row remembers what was already paid. Retries do not farm points. The double-charge mission is the same idea aimed at Stripe.
- **Transactions.** Several writes that must agree share one `prisma.$transaction`.
- **Secrets.** Password hash, session token hash, `DATABASE_URL` in the environment. The rubric never goes to the client.
- **Migrations.** `prisma/migrations` is the history of the schema. Editing the live database by hand would drift from the repo.

## What to open when you are stuck

| Question | File |
| --- | --- |
| Why did this answer fail? | `src/domain/challenges/*.ts` |
| Why did my XP move? | `src/server/services/progress.ts` and `src/domain/progression/xp.ts` |
| What is on the dashboard? | `src/server/services/catalog.ts` |
| What is in the database? | `prisma/schema.prisma` |
| What is the mission text? | `content/challenges.ts` |
| Who is signed in? | `src/server/auth/session.ts` |

When you can describe a submit without saying "the framework handles it," you are ready to defend this design.
