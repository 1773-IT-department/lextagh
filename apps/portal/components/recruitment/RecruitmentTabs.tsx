import Link from "next/link";

const TABS = [
  { key: "applications", href: "/systems/recruitment", label: "Applications" },
  { key: "roles", href: "/systems/recruitment/roles", label: "Roles" },
] as const;

/** Applications and Roles: the two parts of Recruitment. */
export default function RecruitmentTabs({ active }: { active: (typeof TABS)[number]["key"] }) {
  return (
    <nav className="crm-tabs" aria-label="Recruitment">
      {TABS.map((t) => (
        <Link key={t.key} href={t.href} aria-current={t.key === active ? "page" : undefined}>{t.label}</Link>
      ))}
    </nav>
  );
}
