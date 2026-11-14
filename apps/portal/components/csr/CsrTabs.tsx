import Link from "next/link";

/** The parts of the CSR tracker: activities for everyone, programmes for admin. */
export default function CsrTabs({ active, isAdmin }: { active: "activities" | "programmes"; isAdmin: boolean }) {
  if (!isAdmin) return null;
  const tabs = [
    { key: "activities", href: "/systems/csr", label: "Activities" },
    { key: "programmes", href: "/systems/csr/programmes", label: "Programmes" },
  ];
  return (
    <nav className="crm-tabs" aria-label="CSR activities">
      {tabs.map((t) => (
        <Link key={t.key} href={t.href} aria-current={t.key === active ? "page" : undefined}>{t.label}</Link>
      ))}
    </nav>
  );
}
