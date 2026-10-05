import { describe, expect, it } from "vitest";
import { isUnlocked } from "@/domain/progression/achievements";
import { levelForXp, rankForXp, thresholdForLevel } from "@/domain/progression/progression";
import { nextStreak } from "@/domain/progression/streak";
import { attemptXp, xpGrant } from "@/domain/progression/xp";
import { grade } from "@/domain/challenges/grade";
import { pairwiseOrderScore } from "@/domain/challenges/sequence";
import { challenges } from "../../content/challenges";

const bySlug = Object.fromEntries(challenges.map((challenge) => [challenge.slug, challenge]));

describe("progression", () => {
  it("reads level thresholds from the table", () => {
    expect(thresholdForLevel(1)).toBe(0);
    expect(levelForXp(0)).toBe(1);
    expect(levelForXp(100)).toBe(2);
    expect(levelForXp(249)).toBe(2);
    expect(levelForXp(250)).toBe(3);
    expect(levelForXp(1400)).toBe(7);
  });

  it("starts at Vibe Coder and ranks up at the published XP gates", () => {
    expect(rankForXp(0).title).toBe("Vibe Coder");
    expect(rankForXp(250).title).toBe("Junior AI Builder");
    expect(rankForXp(799).id).toBe("junior_ai_builder");
    expect(rankForXp(800).title).toBe("AI Developer");
  });

  it("pays only the improvement over XP already awarded", () => {
    expect(attemptXp(100, 80)).toBe(80);
    expect(xpGrant(0, 80)).toBe(80);
    expect(xpGrant(80, 50)).toBe(0);
    expect(xpGrant(80, 100)).toBe(20);
  });

  it("continues a streak only on the next UTC day", () => {
    expect(nextStreak(0, null, "2026-10-05")).toBe(1);
    expect(nextStreak(2, "2026-10-05", "2026-10-05")).toBe(2);
    expect(nextStreak(2, "2026-10-04", "2026-10-05")).toBe(3);
    expect(nextStreak(4, "2026-10-01", "2026-10-05")).toBe(1);
  });

  it("unlocks achievements from passes, rank, and streak", () => {
    expect(
      isUnlocked(
        { type: "challenge_passed", slug: "trace-the-login-click" },
        { passedSlugs: new Set(["trace-the-login-click"]), rankId: "vibe_coder", streak: 1 },
      ),
    ).toBe(true);
    expect(
      isUnlocked({ type: "rank", rankId: "junior_ai_builder" }, { passedSlugs: new Set(), rankId: "vibe_coder", streak: 1 }),
    ).toBe(false);
    expect(isUnlocked({ type: "streak", count: 3 }, { passedSlugs: new Set(), rankId: "vibe_coder", streak: 3 })).toBe(true);
  });
});

describe("challenge engines", () => {
  it("scores a correct login trace and rejects a reversed one", () => {
    const challenge = bySlug["trace-the-login-click"];
    const rubric = challenge.rubric as unknown as {
      correctOrder: string[];
      explanationByStep: Record<string, string>;
    };
    const perfect = grade(challenge.type, challenge.definition, challenge.rubric, {
      order: rubric.correctOrder,
      explanations: rubric.explanationByStep,
    });
    expect(perfect.passed).toBe(true);
    expect(perfect.overall).toBe(100);

    const reversed = grade(challenge.type, challenge.definition, challenge.rubric, {
      order: [...rubric.correctOrder].reverse(),
      explanations: rubric.explanationByStep,
    });
    expect(reversed.passed).toBe(false);
    expect(pairwiseOrderScore(rubric.correctOrder, [...rubric.correctOrder].reverse())).toBe(0);
  });

  it("accepts a session login and rejects a browser that talks to the database", () => {
    const challenge = bySlug["build-a-login"];
    const good = grade(challenge.type, challenge.definition, challenge.rubric, {
      nodes: ["browser", "login_api", "password_hasher", "user_database", "session_store"],
      edges: [
        { from: "browser", to: "login_api" },
        { from: "login_api", to: "user_database" },
        { from: "login_api", to: "password_hasher" },
        { from: "login_api", to: "session_store" },
      ],
      rationale: "The server stores a bcrypt hash and sets an httpOnly session cookie.",
    });
    expect(good.passed).toBe(true);

    const leaked = grade(challenge.type, challenge.definition, challenge.rubric, {
      nodes: ["browser", "login_api", "password_hasher", "user_database", "token_issuer"],
      edges: [
        { from: "browser", to: "login_api" },
        { from: "browser", to: "user_database" },
        { from: "login_api", to: "user_database" },
        { from: "login_api", to: "password_hasher" },
        { from: "login_api", to: "token_issuer" },
      ],
      rationale: "Hashed passwords and a signed token.",
    });
    expect(leaked.passed).toBe(false);
    expect(leaked.feedback.findings.some((finding) => finding.principle.includes("connection string"))).toBe(true);
  });

  it("requires a membership table and refuses a raw password", () => {
    const challenge = bySlug["design-users-and-orgs"];
    const good = grade(challenge.type, challenge.definition, challenge.rubric, {
      tables: [
        {
          name: "users",
          columns: [
            { name: "id", type: "uuid", pk: true },
            { name: "email", type: "text", unique: true },
            { name: "password_hash", type: "text" },
          ],
        },
        { name: "organizations", columns: [{ name: "id", type: "uuid", pk: true }, { name: "name", type: "text" }] },
        {
          name: "memberships",
          columns: [
            { name: "id", type: "uuid", pk: true },
            { name: "user_id", type: "uuid" },
            { name: "organization_id", type: "uuid" },
          ],
        },
      ],
      foreignKeys: [
        { fromTable: "memberships", fromColumn: "user_id", toTable: "users", toColumn: "id" },
        { fromTable: "memberships", fromColumn: "organization_id", toTable: "organizations", toColumn: "id" },
      ],
    });
    expect(good.passed).toBe(true);
    expect(good.overall).toBe(100);

    const plaintext = grade(challenge.type, challenge.definition, challenge.rubric, {
      tables: [
        {
          name: "users",
          columns: [
            { name: "id", type: "uuid", pk: true },
            { name: "email", type: "text", unique: true },
            { name: "password", type: "text" },
          ],
        },
        { name: "organizations", columns: [{ name: "id", type: "uuid", pk: true }] },
        { name: "memberships", columns: [{ name: "id", type: "uuid", pk: true }] },
      ],
      foreignKeys: [
        { fromTable: "memberships", fromColumn: "user_id", toTable: "users", toColumn: "id" },
        { fromTable: "memberships", fromColumn: "organization_id", toTable: "organizations", toColumn: "id" },
      ],
    });
    expect(plaintext.passed).toBe(false);
  });

  it("clears the invoice bug only when the line, cause, and fix agree", () => {
    const challenge = bySlug["invoice-that-isnt-yours"];
    const cleared = grade(challenge.type, challenge.definition, challenge.rubric, {
      line: 8,
      causeId: "missing_authz",
      fixId: "compare_owner",
    });
    expect(cleared.passed).toBe(true);
    const wrong = grade(challenge.type, challenge.definition, challenge.rubric, {
      line: 3,
      causeId: "sql_injection",
      fixId: "parameterize",
    });
    expect(wrong.passed).toBe(false);
  });

  it("lets one missed incident decision still pass, and a rewrite fail that stage", () => {
    const challenge = bySlug["double-charge-incident"];
    const almost = grade(challenge.type, challenge.definition, challenge.rubric, {
      choices: {
        symptom: "double_charge",
        mechanism: "retry_no_idempotency",
        fix: "idempotency_key",
        tests: "same_key_once",
        ship: "rewrite",
      },
    });
    expect(almost.passed).toBe(true);
    expect(almost.overall).toBe(80);

    const lost = grade(challenge.type, challenge.definition, challenge.rubric, {
      choices: {
        symptom: "site_down",
        mechanism: "hash_mismatch",
        fix: "disable_button",
        tests: "snapshot_css",
        ship: "rewrite",
      },
    });
    expect(lost.passed).toBe(false);
  });

  it("passes an explanation that covers the ideas a senior will ask about", () => {
    const challenge = bySlug["explain-the-login"];
    const score = grade(challenge.type, challenge.definition, challenge.rubric, {
      text: "The browser sends an HTTP POST. The API loads the Postgres row and bcrypt-compares the hash. It inserts a session and sets an HttpOnly cookie. A stolen cookie is the failure I worry about. I can revoke that session, which is harder with a stateless JWT.",
    });
    expect(score.passed).toBe(true);
  });
});
