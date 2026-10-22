import Link from "next/link";
import AuthCard from "@/components/AuthCard";
import { ForgotForm } from "@/components/AuthForms";

export const metadata = { title: "Reset password | Lexta Business System" };

export default function ForgotPasswordPage() {
  return (
    <AuthCard title="Reset your password" lead="We will email you a link to choose a new password.">
      <ForgotForm />
      <p className="small" style={{ marginTop: 18, marginBottom: 0 }}><Link href="/login">Back to sign in</Link></p>
    </AuthCard>
  );
}
