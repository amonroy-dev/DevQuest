"use server";

import { z } from "zod";
import { prisma } from "@/server/db";
import { registerUser } from "@/server/auth/accounts";
import { verifyPassword } from "@/server/auth/password";
import { createSession, destroySession } from "@/server/auth/session";
import { logger } from "@/server/logger";
import { redirect } from "next/navigation";

const credentials = z.object({
  email: z.email(),
  password: z.string().min(1),
  next: z.string().optional(),
});

function safeNext(value: string | undefined): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/dashboard";
  return value;
}

export async function login(input: { email: string; password: string; next?: string }) {
  const parsed = credentials.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: "Enter the email and password for this machine's account." };
  }

  const email = parsed.data.email.toLowerCase();
  const user = await prisma.user.findUnique({ where: { email } });
  const valid = user ? await verifyPassword(parsed.data.password, user.passwordHash) : false;
  if (!user || !valid) {
    logger.warn("login_failed", { email });
    return { ok: false as const, error: "That email and password do not match." };
  }

  await createSession(user.id);
  logger.info("login_succeeded", { userId: user.id });
  return { ok: true as const, redirectTo: safeNext(parsed.data.next) };
}

const signupSchema = z.object({
  name: z.string().trim().min(1).max(40),
  email: z.email(),
  password: z.string().min(8).max(200),
});

export async function signup(input: { name: string; email: string; password: string }) {
  const parsed = signupSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: "Use your name, a real email, and a password of at least 8 characters." };
  }

  const created = await registerUser(parsed.data);
  if (!created.ok) return created;
  await createSession(created.userId);
  logger.info("account_created", { userId: created.userId });
  return { ok: true as const, redirectTo: "/profile" };
}

export async function logout() {
  await destroySession();
  redirect("/login");
}
