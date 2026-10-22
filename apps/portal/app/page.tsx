const systems = [
  "Distributor ordering portal",
  "Field sales app",
  "CSR activity tracker",
  "Complaints tracker",
  "Product management",
  "Recruitment tracker",
  "CRM",
  "Management dashboard",
];

export default function Home() {
  return (
    <main style={{ maxWidth: 720, margin: "64px auto", padding: "0 16px" }}>
      <h1>Lexta Business System</h1>
      <p>One login for all Lexta teams. Being built by 1773.</p>
      <ul>{systems.map((s) => <li key={s}>{s}</li>)}</ul>
    </main>
  );
}
