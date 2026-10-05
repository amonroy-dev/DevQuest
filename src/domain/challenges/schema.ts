import { z } from "zod";
import { clampScore, type Finding, type Score } from "@/domain/challenges/types";

const column = z.object({
  name: z.string(),
  type: z.string(),
  pk: z.boolean().optional(),
  unique: z.boolean().optional(),
});

export const schemaDefinition = z.object({
  brief: z.string(),
  columnTypes: z.array(z.string()),
});

export const schemaRubric = z.object({
  notes: z.string(),
});

export const schemaAnswer = z.object({
  tables: z.array(z.object({ name: z.string(), columns: z.array(column) })),
  foreignKeys: z.array(
    z.object({
      fromTable: z.string(),
      fromColumn: z.string(),
      toTable: z.string(),
      toColumn: z.string(),
    }),
  ),
});

export type SchemaDefinition = z.infer<typeof schemaDefinition>;
export type SchemaAnswer = z.infer<typeof schemaAnswer>;

const USER_NAMES = new Set(["user", "users", "account", "accounts"]);
const ORG_NAMES = new Set([
  "organization",
  "organizations",
  "org",
  "orgs",
  "team",
  "teams",
  "workspace",
  "workspaces",
]);
const MEMBER_NAMES = new Set([
  "membership",
  "memberships",
  "member",
  "members",
  "organizationmember",
  "organizationmembers",
  "orgmember",
  "orgmembers",
  "userorganization",
  "userorganizations",
  "organizationuser",
  "organizationusers",
  "teammember",
  "teammembers",
]);

export function normalizeName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function findTable(tables: SchemaAnswer["tables"], names: Set<string>) {
  return tables.find((table) => names.has(normalizeName(table.name)));
}

function hasPrimaryKey(table: SchemaAnswer["tables"][number]): boolean {
  return table.columns.some((column) => column.pk || normalizeName(column.name) === "id");
}

function isPlainPassword(name: string): boolean {
  const normalized = normalizeName(name);
  return normalized === "password" || normalized === "passwd" || normalized === "pwd";
}

export function scoreSchema(
  _definition: SchemaDefinition,
  _rubric: { notes: string },
  answer: SchemaAnswer,
): Score {
  const findings: Finding[] = [];
  let points = 0;
  const users = findTable(answer.tables, USER_NAMES);
  const orgs = findTable(answer.tables, ORG_NAMES);
  const members = findTable(answer.tables, MEMBER_NAMES);

  if (users) points += 10;
  else {
    findings.push({
      principle: "People who sign in need their own table.",
      productionImpact: "Without a user row there is nothing to authenticate, bill, or audit.",
      hint: "Add a users table with an id and an email.",
    });
  }

  if (orgs) points += 10;
  else {
    findings.push({
      principle: "The organization is its own thing, not a column of vibes on the user.",
      productionImpact: "You cannot invite a second company, or share one, if the company is not a row.",
      hint: "Add an organizations table.",
    });
  }

  if (members) points += 16;
  else {
    findings.push({
      principle: "A person in many organizations is a many-to-many relationship.",
      productionImpact:
        "organization_id on users means one person, one organization. The second company overwrites the first.",
      hint: "Add a membership (join) table between users and organizations.",
    });
  }

  for (const table of [users, orgs, members]) {
    if (!table) continue;
    if (hasPrimaryKey(table)) points += 5;
    else {
      findings.push({
        principle: `${table.name} needs a primary key.`,
        productionImpact: "Foreign keys and updates have no stable row to point at. Two users become indistinguishable.",
        hint: "Mark an id column as the primary key.",
      });
    }
  }

  const pointsAt = (from: SchemaAnswer["tables"][number] | undefined, to: SchemaAnswer["tables"][number] | undefined) => {
    if (!from || !to) return false;
    const fromName = normalizeName(from.name);
    const toName = normalizeName(to.name);
    return answer.foreignKeys.some(
      (key) => normalizeName(key.fromTable) === fromName && normalizeName(key.toTable) === toName,
    );
  };

  const memberToUser = pointsAt(members, users);
  const memberToOrg = pointsAt(members, orgs);
  if (memberToUser) points += 15;
  if (memberToOrg) points += 15;
  if (members && (!memberToUser || !memberToOrg)) {
    findings.push({
      principle: "A membership row has to point at both a person and an organization.",
      productionImpact: "An orphan membership cannot answer 'who is in this organization?'",
      hint: "Add foreign keys from the membership table to users and to organizations.",
    });
  }

  const emailUnique = Boolean(
    users?.columns.some((column) => normalizeName(column.name).includes("email") && column.unique),
  );
  if (emailUnique) points += 12;
  else if (users) {
    findings.push({
      principle: "The login identifier has to be unique.",
      productionImpact: "Two rows with the same email means the wrong person can pass the password check.",
      hint: "Mark email as unique on the users table.",
    });
  }

  const plaintext = answer.tables.some((table) => table.columns.some((column) => isPlainPassword(column.name)));
  if (!plaintext) points += 7;
  else {
    findings.push({
      principle: "Store a password hash, never the password.",
      productionImpact:
        "A database backup or a stolen read replica becomes a list of reusable passwords.",
      hint: "Remove the password column. The application stores password_hash.",
    });
  }

  const correctness = clampScore(points);
  const maintainability = clampScore(
    ((users && hasPrimaryKey(users) ? 1 : 0) +
      (orgs && hasPrimaryKey(orgs) ? 1 : 0) +
      (members && hasPrimaryKey(members) ? 1 : 0) +
      (emailUnique ? 1 : 0)) *
      25,
  );
  const security = plaintext ? 20 : 100;
  const passed = points >= 70 && !plaintext && Boolean(members && memberToUser && memberToOrg);
  const summary = passed
    ? "A person can belong to more than one organization, and the rows have keys to hang onto."
    : "The schema does not yet protect the relationship or the secret. The notes say which invariant failed.";

  return {
    passed,
    overall: correctness,
    dimensions: { correctness, maintainability, security },
    feedback: { summary, findings },
  };
}
