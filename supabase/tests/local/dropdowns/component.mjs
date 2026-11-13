// Component checks of packages/ui DateInput in a page of its own (no portal, no database): a controlled input inside
// React StrictMode, and a year under 100. Bundles a small test page with the swc compiler that Next.js ships (no
// other tool needed), loads it in Chromium and drives it.
//   node supabase/tests/local/dropdowns/component.mjs     (run.sh runs it before browser.mjs)
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../..");
const PORTAL = path.join(ROOT, "apps/portal");
const req = createRequire(path.join(PORTAL, "package.json"));
const swc = req("next/dist/build/swc");
let pw;
try { pw = req("playwright"); } catch { pw = createRequire(import.meta.url)("/opt/node-tools/node_modules/playwright/index.js"); }

let failures = 0;
const check = (ok, msg, detail) => {
  if (ok) console.log(`  PASS: ${msg}`);
  else { failures += 1; console.log(`  FAIL: ${msg}`); if (detail !== undefined) console.log(`        ${JSON.stringify(detail).slice(0, 400)}`); }
};

// The test page: a controlled date (with a reset to empty) and an uncontrolled one, inside StrictMode.
const ENTRY = path.join(ROOT, "packages/ui/src/__component_test__.tsx");
const ENTRY_SRC = `
import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import { DateInput } from "./index";
function App() {
  const [v, setV] = useState("2026-11-10");
  const [log, setLog] = useState<string[]>([]);
  return (
    <form>
      <label htmlFor="d">Day</label>
      <DateInput id="d" name="d" value={v} onChange={(e) => { setV(e.target.value); setLog((l) => [...l, e.target.value]); }} />
      <button type="button" id="reset" onClick={() => setV("")}>Reset</button>
      <output id="state">{v}</output>
      <output id="log">{log.join(",")}</output>
      <label htmlFor="old">Old</label>
      <DateInput id="old" name="old" defaultValue="" />
    </form>
  );
}
createRoot(document.getElementById("root")!).render(<StrictMode><App /></StrictMode>);
`;

// A very small CommonJS bundler: swc for TypeScript and JSX, CSS Modules kept as written (class names unchanged).
await swc.loadBindings();
const mods = new Map();
const exts = ["", ".ts", ".tsx", ".js", "/index.ts", "/index.js"];
function resolve(from, spec) {
  if (spec.startsWith(".")) {
    const base = path.resolve(path.dirname(from), spec);
    for (const e of exts) { try { readFileSync(base + e); return base + e; } catch { /* next */ } }
    throw new Error(`cannot resolve ${spec} from ${from}`);
  }
  // Bare names resolve from the file that asks (react-dom finds its own scheduler); the page itself from packages/ui.
  return createRequire(from.includes("__component_test__") ? path.join(ROOT, "packages/ui/package.json") : from).resolve(spec);
}
async function add(file, src) {
  if (mods.has(file)) return;
  mods.set(file, null);
  let code;
  if (file.endsWith(".css")) {
    code = `__css(${JSON.stringify(readFileSync(file, "utf8"))}); module.exports = new Proxy({}, { get: (_, k) => k === "__esModule" ? false : String(k) });`;
  } else if (/\.tsx?$/.test(file)) {
    code = (await swc.transform(src ?? readFileSync(file, "utf8"), { filename: file, jsc: { parser: { syntax: "typescript", tsx: file.endsWith(".tsx") },
      transform: { react: { runtime: "automatic" } }, target: "es2020" }, module: { type: "commonjs" } })).code;
  } else code = readFileSync(file, "utf8");
  const deps = {};
  for (const m of code.matchAll(/require\(["']([^"']+)["']\)/g)) {
    deps[m[1]] = resolve(file, m[1]);
  }
  mods.set(file, { code, deps });
  for (const d of Object.values(deps)) await add(d);
}
await add(ENTRY, ENTRY_SRC);
const ids = [...mods.keys()];
const bundle = `(() => {
  const process = { env: { NODE_ENV: "development" } }; window.process = process;
  const __css = (t) => { const s = document.createElement("style"); s.textContent = t; document.head.appendChild(s); };
  const defs = [${ids.map((id) => `[${JSON.stringify(id)}, ${JSON.stringify(mods.get(id).deps)}, function (module, exports, require) {\n${mods.get(id).code}\n}]`).join(",\n")}];
  const table = new Map(defs.map((d) => [d[0], d]));
  const cache = new Map();
  const load = (id) => {
    if (cache.has(id)) return cache.get(id).exports;
    const [, deps, fn] = table.get(id);
    const module = { exports: {} };
    cache.set(id, module);
    fn(module, module.exports, (s) => load(deps[s]));
    return module.exports;
  };
  load(${JSON.stringify(ENTRY)});
})();`;

const browser = await pw.chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
try {
  await page.setContent(`<!doctype html><html><head><meta charset="utf-8"></head><body style="font-family:sans-serif;padding:40px"><div id="root"></div></body></html>`);
  await page.addScriptTag({ content: bundle });
  const trigger = (id) => page.locator("[data-lx-date]", { has: page.locator(`#${id}`) }).locator("[data-lx-date-trigger]");
  await trigger("d").waitFor();
  const dlg = page.locator("[data-lx-date-dialog]");
  const pick = async (id, name) => { await trigger(id).click(); await dlg.waitFor(); await dlg.getByRole("button", { name, exact: true }).click(); await dlg.waitFor({ state: "detached" }); };

  // Controlled: pick, reset to empty from React, then pick the same day again: onChange must fire again.
  await pick("d", "12 November 2026");
  check(await page.locator("#state").innerText() === "2026-11-12" && await page.locator("#log").innerText() === "2026-11-12", "controlled (StrictMode): a pick reaches onChange and the state");
  await page.locator("#reset").click();
  check(await page.locator("#d").inputValue() === "" && await page.locator("#state").innerText() === "", "controlled: React resets the value to empty");
  await pick("d", "12 November 2026");
  check(await page.locator("#log").innerText() === "2026-11-12,2026-11-12" && await page.locator("#state").innerText() === "2026-11-12",
    "controlled: after a reset to empty, picking the same day again fires onChange again", await page.locator("#log").innerText());
  await pick("d", "14 November 2026");
  check(await page.locator("#state").innerText() === "2026-11-14", "controlled: picking another day updates the state");
  await trigger("d").click();
  await dlg.waitFor();
  const sel = dlg.getByRole("button", { name: "14 November 2026, selected", exact: true });
  check(await sel.getAttribute("aria-pressed") === "true", "the chosen day is announced as selected (pressed, and in its name)");
  await page.keyboard.press("Escape");

  // A year under 100 stays that year (no 19xx).
  await page.locator("#old").fill("0026-03-15");
  await trigger("old").click();
  await dlg.waitFor();
  const head = await dlg.getByRole("heading").innerText();
  check(head === "March 26", "a typed year 0026 opens March of the year 26, not 1926", head);
  await dlg.getByRole("button", { name: "16 March 26", exact: true }).click();
  check(await page.locator("#old").inputValue() === "0026-03-16", "and picking a day keeps the year 0026", await page.locator("#old").inputValue());

  // Focus going back to the field closes the calendar.
  await trigger("old").click();
  await dlg.waitFor();
  await page.locator("#old").click();
  check(!(await dlg.count()), "clicking back into the field closes the calendar");
  check(errors.length === 0, "no errors in the console", errors.slice(0, 3));
} catch (e) {
  failures += 1;
  console.log(`  FAIL: ${e?.stack ?? e}`);
} finally {
  await browser.close();
}
console.log(failures ? `${failures} component check(s) failed` : "All component checks passed");
process.exit(failures ? 1 : 0);
