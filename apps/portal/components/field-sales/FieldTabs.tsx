import Link from "next/link";

type Tab = { key: string; href: string; label: string };

/** The parts of field sales: today and history for reps; all visits, my visits and outcomes for managers. */
export default function FieldTabs({ active, seesAll, isAdmin }: { active: string; seesAll: boolean; isAdmin: boolean }) {
  const tabs: Tab[] = seesAll
    ? [
        { key: "all", href: "/systems/field-sales", label: "All visits" },
        { key: "history", href: "/systems/field-sales/history", label: "My visits" },
        ...(isAdmin ? [{ key: "outcomes", href: "/systems/field-sales/outcomes", label: "Outcomes" }] : []),
      ]
    : [
        { key: "today", href: "/systems/field-sales", label: "Today" },
        { key: "history", href: "/systems/field-sales/history", label: "My history" },
      ];
  return (
    <nav className="crm-tabs" aria-label="Field sales">
      {tabs.map((t) => (
        <Link key={t.key} href={t.href} aria-current={t.key === active ? "page" : undefined}>{t.label}</Link>
      ))}
    </nav>
  );
}
