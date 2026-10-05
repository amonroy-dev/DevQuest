import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { getSessionUser } from "@/server/auth/session";

export default async function SignupPage() {
  const user = await getSessionUser();
  if (user) redirect("/dashboard");
  return <AuthForm mode="signup" />;
}
