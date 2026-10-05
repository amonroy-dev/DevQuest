"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/server/auth/session";
import { logger } from "@/server/logger";
import { recordAttempt } from "@/server/services/progress";

export async function submitChallenge(slug: string, answer: unknown) {
  const user = await requireUser();
  try {
    const result = await recordAttempt(user.id, slug, answer);
    if (result.ok) {
      revalidatePath("/dashboard");
      revalidatePath("/worlds");
      revalidatePath("/skills");
      revalidatePath("/profile");
      revalidatePath(`/play/${slug}`);
    }
    return result;
  } catch (error) {
    logger.error("challenge_submit_failed", {
      slug,
      error: error instanceof Error ? error.message : "unknown",
    });
    return { ok: false as const, error: "Scoring failed before anything was saved. Try the submit again." };
  }
}
