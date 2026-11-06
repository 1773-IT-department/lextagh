import Link from "next/link";

const STAFF = [
  { key: "inbox", href: "/systems/orders", label: "Orders" },
  { key: "distributors", href: "/systems/orders/distributors", label: "Distributor logins" },
] as const;

const DISTRIBUTOR = [
  { key: "mine", href: "/systems/orders", label: "My orders" },
  { key: "new", href: "/systems/orders/new", label: "New order" },
  { key: "catalogue", href: "/systems/orders/catalogue", label: "Catalogue" },
] as const;

type Key = (typeof STAFF)[number]["key"] | (typeof DISTRIBUTOR)[number]["key"];

/** The parts of Distributor ordering: the inbox and logins for staff; orders, new order and catalogue for distributors. */
export default function OrderTabs({ active, distributor }: { active: Key; distributor?: boolean }) {
  const tabs = distributor ? DISTRIBUTOR : STAFF;
  return (
    <nav className="crm-tabs" aria-label="Ordering">
      {tabs.map((t) => (
        <Link key={t.key} href={t.href} aria-current={t.key === active ? "page" : undefined}>{t.label}</Link>
      ))}
    </nav>
  );
}
