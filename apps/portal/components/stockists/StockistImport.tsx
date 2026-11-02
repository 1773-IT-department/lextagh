"use client";

import Link from "next/link";
import { startTransition, useActionState, useState } from "react";
import { checkImport, runImport, type ImportState } from "@/app/(app)/systems/stockists/actions";

const empty: ImportState = { rows: [], valid: 0, invalid: 0 };
const MAX_FILE = 1_000_000;

export default function StockistImport() {
  const [csv, setCsv] = useState("");
  const [fileError, setFileError] = useState("");
  const [checked, check, checking] = useActionState(checkImport, empty);
  const [result, run, importing] = useActionState(runImport, empty);
  // Show whichever answer came last; typing in the box makes the old check out of date.
  const [last, setLast] = useState<"check" | "run" | null>(null);
  const [stale, setStale] = useState(false);
  const report = last === "run" ? result : last === "check" ? checked : null;
  const busy = checking || importing;

  const submit = (which: "check" | "run") => {
    const data = new FormData();
    data.set("csv", csv);
    setLast(which);
    setStale(false);
    startTransition(() => (which === "check" ? check(data) : run(data)));
  };

  const onFile = async (file: File | undefined) => {
    setFileError("");
    if (!file) return;
    if (file.size > MAX_FILE) { setFileError("The file is larger than 1 MB. Split it into smaller files."); return; }
    try {
      setCsv(await file.text());
      setStale(true);
    } catch {
      setFileError("The file could not be read. Save it as CSV (comma separated) and try again.");
    }
  };

  const problems = report?.rows.filter((r) => r.errors.length) ?? [];

  return (
    <section className="panel">
      <h2>Your list</h2>
      <div className="field">
        <label htmlFor="csv-file">Choose a CSV file</label>
        <input id="csv-file" type="file" accept=".csv,text/csv,text/plain" onChange={(e) => onFile(e.target.files?.[0])} disabled={busy} />
        {fileError && <span className="ferr">{fileError}</span>}
      </div>
      <div className="field">
        <label htmlFor="csv">Or paste the CSV text</label>
        <textarea
          id="csv"
          rows={10}
          className="mono"
          value={csv}
          onChange={(e) => { setCsv(e.target.value); setStale(true); }}
          placeholder={"name,outlet_type,region,town,address,phone,latitude,longitude,brands\n..."}
          spellCheck={false}
          disabled={busy}
        />
      </div>
      <div className="import-actions">
        <button type="button" className="btn light" onClick={() => submit("check")} disabled={busy || !csv.trim()}>
          {checking ? "Checking..." : "Check rows"}
        </button>
        <button
          type="button"
          className="btn"
          onClick={() => submit("run")}
          disabled={busy || !csv.trim() || last !== "check" || stale || !checked.valid || !!checked.error}
        >
          {importing ? "Importing..." : checked.valid && last === "check" && !stale ? `Import ${checked.valid} valid ${checked.valid === 1 ? "row" : "rows"}` : "Import"}
        </button>
      </div>

      {report && !stale && (
        <div aria-live="polite">
          {report.error && <div className="alert error" role="alert">{report.error}</div>}
          {last === "run" && report.imported !== undefined && (
            <div className="alert ok" role="status">
              {report.imported} {report.imported === 1 ? "stockist was" : "stockists were"} added.
              {report.invalid > 0 && ` ${report.invalid} ${report.invalid === 1 ? "row was" : "rows were"} skipped; fix them below and import them again.`}{" "}
              <Link href="/systems/stockists">See the stockists</Link>
            </div>
          )}
          {last === "check" && !report.error && report.rows.length > 0 && (
            <div className={`alert ${report.invalid ? "info" : "ok"}`} role="status">
              {report.valid} of {report.rows.length} {report.rows.length === 1 ? "row is" : "rows are"} ready to import.
              {report.invalid > 0 && ` ${report.invalid} ${report.invalid === 1 ? "row has" : "rows have"} problems and will be skipped unless you fix them and check again.`}
            </div>
          )}
          {problems.length > 0 && (
            <div className="table-wrap">
              <table className="ptable">
                <thead><tr><th scope="col">Row</th><th scope="col">Shop</th><th scope="col">Problems</th></tr></thead>
                <tbody>
                  {problems.map((r) => (
                    <tr key={r.line}>
                      <td data-label="Row">{r.line}</td>
                      <td data-label="Shop">{r.name}</td>
                      <td data-label="Problems"><ul className="row-errors">{r.errors.map((e, i) => <li key={i}>{e}</li>)}</ul></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
      {stale && last && <p className="small">The list changed. Press Check rows again before importing.</p>}
      <p className="small">Row 1 is the header, so row 2 is the first shop.</p>
    </section>
  );
}
