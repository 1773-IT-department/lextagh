import Link from "next/link";
import AuthCard from "@/components/AuthCard";
import { LoginForm } from "@/components/AuthForms";

export const metadata = { title: "Sign in | Lexta Business System" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const { next, error } = await searchParams;
  const safe = next && next.startsWith("/") && !next.startsWith("//") ? next : "/";
  return (
    <AuthCard title="Lexta Business System" lead="Sign in with the email Lexta invited you with.">
      {error === "link" && (
        <div className="alert error" role="alert">That link has expired or was already used. Sign in, or ask for a new reset link.</div>
      )}
      <LoginForm next={safe} />
      <p className="small" style={{ marginTop: 18, marginBottom: 0 }}>
        <Link href="/forgot-password">Forgot your password?</Link>
        <br />
        No login yet? Logins are by invitation. Ask your Lexta administrator.
      </p>
    </AuthCard>
  );
}
