import AuthCard from "@/components/AuthCard";
import { SetPasswordForm } from "@/components/AuthForms";

export const metadata = { title: "Choose a password | Lexta Business System" };

export default function SetPasswordPage() {
  return (
    <AuthCard title="Choose your password" lead="Use at least 10 characters. You will use it with your email to sign in.">
      <SetPasswordForm />
    </AuthCard>
  );
}
