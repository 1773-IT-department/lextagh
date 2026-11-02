"use client";

import { useId, useState } from "react";

/** Director bio that opens under the card, with the prototype's "Read bio +" / "Hide bio −" button. */
export default function BioToggle({ name, paragraphs }: { name: string; paragraphs: string[] }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <>
      <div id={id} data-bio="1" style={{ display: open ? "flex" : "none", marginTop: 14, flexDirection: "column", gap: 10 }}>
        {paragraphs.map((p) => (
          <p key={p.slice(0, 32)} style={{ margin: 0, fontSize: 13, lineHeight: 1.85, color: "#5d7883" }}>{p}</p>
        ))}
      </div>
      <button
        type="button"
        data-bio-btn="1"
        aria-expanded={open}
        aria-controls={id}
        aria-label={`${open ? "Hide" : "Read"} bio: ${name}`}
        onClick={() => setOpen((o) => !o)}
        style={{ marginTop: 16, alignSelf: "flex-start", border: 0, background: "transparent", padding: 0, cursor: "pointer", fontSize: 12, fontWeight: 600, color: "#12a3c4" }}
      >
        {open ? "Hide bio −" : "Read bio +"}
      </button>
    </>
  );
}
