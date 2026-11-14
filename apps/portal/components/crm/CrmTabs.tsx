import Link from "next/link";

const TABS = [
  { key: "leads", href: "/systems/crm/leads", label: "Leads" },
  { key: "contacts", href: "/systems/crm/contacts", label: "Contacts" },
  { key: "organisations", href: "/systems/crm/organisations", label: "Organisations" },
] as const;

/** Leads, Contacts and Organisations: the three parts of the one shared CRM. */
export default function CrmTabs({ active }: { active: (typeof TABS)[number]["key"] }) {
  return (
    <nav className="crm-tabs" aria-label="CRM">
      {TABS.map((t) => (
        <Link key={t.key} href={t.href} aria-current={t.key === active ? "page" : undefined}>{t.label}</Link>
      ))}
    </nav>
  );
}
