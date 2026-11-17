"use client";

import { ATTACHMENT_ACCEPT, useComplaintAttachment } from "@lexta/forms/attachment";
import { useServerForm } from "@lexta/forms/react";
import dynamic from "next/dynamic";
import { useActionState, useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { startComplaintUpload, submitConsumerForm, submitTradeForm } from "@/app/actions/forms";
import { idleState } from "../FormBits";
import { TOPICS, TRADE_ROUTES, type Topic } from "@/lib/forms/options";
import { ALL_REGIONS, type RegionOption, type StockistItem } from "@/lib/where-to-buy";
import ContactView from "../views/ContactView";
import { h, useChrome } from "../chrome";
import s from "../proto.module.css";

// Contact & Where to Buy (Linzzy Contact.dc.html), connected to the Business System:
//   Where to Buy   the Linzzy stockists of the Business System by region (/api/stockists), with search and the map
//   Send a message the consumer form: "Report a problem" becomes a complaint with a case number, the rest a CRM lead
//   Trade          the trade enquiry form, a distributor or partner lead in the CRM

const StockistMap = dynamic(() => import("../StockistMap"), { ssr: false });

const CHAPTERS: [string, string, string][] = [["top", "00", "We're Here to Listen"], ["help", "01", "How Can We Help"], ["where-to-buy", "02", "Where to Buy"], ["message", "03", "Send Us a Message"], ["trade", "04", "Trade Enquiries"], ["before", "05", "Your Voice Matters"]];
const REMEMBER = "linzzy-region";
const remember = (slug: string) => { try { localStorage.setItem(REMEMBER, slug); } catch { /* storage blocked */ } };
const remembered = () => { try { return localStorage.getItem(REMEMBER) ?? ""; } catch { return ""; } };

type Result = { state: "done" | "loading" | "error"; stockists: StockistItem[] };

export default function ContactClient({
  regions, initialRegion, initialStockists, regionFromUrl, products, initialTopic, initialProduct, marketingEmail, privacyUrl,
}: {
  regions: RegionOption[];
  initialRegion: string;
  initialStockists: StockistItem[] | null;
  regionFromUrl: boolean;
  products: { slug: string; name: string }[];
  initialTopic: Topic;
  initialProduct: string;
  marketingEmail: string;
  privacyUrl: string;
}) {
  const c = useChrome("/contact", "We're Here to Listen");
  const [topic, setTopic] = useState<Topic>(initialTopic);
  const [route, setRoute] = useState<string>(TRADE_ROUTES[0].value);
  const [region, setRegion] = useState(initialRegion);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [result, setResult] = useState<Result>({ state: initialStockists ? "done" : "error", stockists: initialStockists ?? [] });
  const req = useRef(0);

  const [msgState, msgAction, msgPending] = useActionState(submitConsumerForm, idleState);
  const file = useComplaintAttachment(startComplaintUpload);
  const msg = useServerForm(msgState, msgAction, msgPending, file.prepare);
  const [tradeState, tradeAction, tradePending] = useActionState(submitTradeForm, idleState);
  const trade = useServerForm(tradeState, tradeAction, tradePending);

  const load = async (slug: string) => {
    const id = ++req.current;
    setResult((r) => ({ ...r, state: "loading" }));
    setSelected(null);
    try {
      const res = await fetch(`/api/stockists?region=${encodeURIComponent(slug)}`, { headers: { accept: "application/json" } });
      const body = (await res.json()) as { ok?: boolean; stockists?: StockistItem[] };
      if (id !== req.current) return;
      if (!res.ok || !body.ok || !Array.isArray(body.stockists)) throw new Error(String(res.status));
      setResult({ state: "done", stockists: body.stockists });
    } catch {
      if (id === req.current) setResult({ state: "error", stockists: [] });
    }
  };
  useEffect(() => {
    if (regionFromUrl) { remember(initialRegion); return; }
    const r = remembered();
    if (r && r !== initialRegion && (r === ALL_REGIONS || regions.some((x) => x.slug === r))) { setRegion(r); void load(r); }
  }, []);

  const q = query.trim().toLowerCase();
  const list = useMemo(
    () => result.stockists.filter((x) => !q || `${x.name} ${x.town} ${x.address ?? ""} ${x.region}`.toLowerCase().includes(q)),
    [result.stockists, q],
  );
  const regionLabel = region === ALL_REGIONS ? null : regions.find((r) => r.slug === region)?.name ?? null;
  const toMsg = (t: Topic) => h(() => { setTopic(t); c.jumpTo("message"); });
  const n = list.length;

  const v = {
    ...c.base,
    chapters: c.chapters(CHAPTERS),
    jump: { wtb: h(() => c.jumpTo("where-to-buy")), message: h(() => c.jumpTo("message")), trade: h(() => c.jumpTo("trade")) },
    askStockist: toMsg("stockist"),
    ways: [
      { t: "Product Information", d: "Have questions about our sanitary towels, panty liners, baby diapers or baby wipes? Contact us for information about product options, packaging, sizing and recommended usage.", cta: "Ask a question", bg: "#EFE6FF", onClick: toMsg("question"), href: "#message" },
      { t: "Consumer Feedback and Complaints", d: "Your experience helps us improve. If you have a concern about a Linzzy product, please contact our customer support team directly.", cta: "Report a problem", bg: "#FFE3EE", onClick: toMsg("problem"), href: "#message" },
      { t: "Distributors and Business Enquiries", d: "Interested in distributing or stocking Linzzy products? Contact our team to discuss product availability, distribution opportunities and commercial enquiries.", cta: "Trade enquiry", bg: "#DDF7EC", onClick: h(() => c.jumpTo("trade")), href: "#trade" },
      { t: "CSR and Community Partnerships", d: "Would you like to collaborate with Linzzy on hygiene education, community development or family care initiatives? We welcome relevant proposals for consideration.", cta: "Send a proposal by email", bg: "#FFF1C9", onClick: undefined, href: `mailto:${marketingEmail}` },
      { t: "Media and Brand Collaborations", d: "For brand partnerships, media enquiries, educational campaigns and promotional collaborations, please contact our team.", cta: "Send a message", bg: "#EFE6FF", onClick: toMsg("partnership"), href: "#message" },
    ].map((w, i) => ({ ...w, n: "0" + (i + 1) })),
    region,
    onRegion: (e: ChangeEvent<HTMLSelectElement>) => { const slug = e.target.value; setRegion(slug); remember(slug); void load(slug); },
    regionOpts: [{ v: ALL_REGIONS, l: "All regions" }].concat(regions.map((r) => ({ v: r.slug, l: r.name }))),
    regionOptsOnly: regions.map((r) => ({ v: r.slug, l: r.name })),
    onWtbSubmit: (e: { preventDefault: () => void }) => e.preventDefault(),
    wtbQ: query,
    onWtbQ: (e: ChangeEvent<HTMLInputElement>) => setQuery(e.target.value),
    wtbCount: result.state === "loading" ? "Finding shops..." : result.state === "error" ? "Where to Buy is not available right now" : `${String(n).padStart(2, "0")} stockist${n === 1 ? "" : "s"} in ${regionLabel || "Ghana"}`,
    wtbWhere: regionLabel ? "in " + regionLabel : "across Ghana",
    wtbEmpty: result.state === "done" && n === 0,
    wtbList: (
      <ol className={s.stockists} aria-label="Shops that stock Linzzy">
        {list.map((x, i) => (
          <li key={x.id}>
            <button type="button" aria-pressed={selected === x.id} className={selected === x.id ? `${s.stockist} ${s.stockistOn}` : s.stockist} onClick={() => setSelected(x.id)}>
              <span className={s.stockistNum}>{String(i + 1).padStart(2, "0")}</span>
              <span>
                <strong>{x.name}</strong>
                <span>{[x.outletLabel, x.town, x.region].filter(Boolean).join(" · ")}</span>
                {x.address && <span>{x.address}</span>}
              </span>
            </button>
            {x.phone && <a className={s.stockistTel} href={`tel:${x.phone.replace(/[^+\d]/g, "")}`}>{x.phone}</a>}
          </li>
        ))}
      </ol>
    ),
    wtbMap: <StockistMap className={s.map} stockists={list} selected={selected} onSelect={setSelected} viewKey={`${region}|${selected ?? ""}`} />,
    topic,
    topics: TOPICS.map((t) => ({ label: t.label, on: topic === t.value, onClick: () => setTopic(t.value), bg: topic === t.value ? "#23103a" : "transparent", fg: topic === t.value ? "#fff" : "#23103a" })),
    topicHint: TOPICS.find((t) => t.value === topic)?.hint,
    isProblem: topic === "problem",
    productNames: products,
    initialRegion: region === ALL_REGIONS ? "" : region,
    initialProduct,
    today: new Date().toISOString().slice(0, 10),
    privacyUrl,
    msg: { ...msg, state: msgState, pending: msgPending, action: msgAction, v: msgState.values ?? {} },
    file: { accept: ATTACHMENT_ACCEPT, error: file.error ?? msgState.fieldErrors?.attachment, clearError: file.clearError },
    msgSent: msgState.status === "success",
    msgOpen: msgState.status !== "success",
    route,
    routes: TRADE_ROUTES.map((r) => ({ label: r.label, on: route === r.value, onClick: () => setRoute(r.value), bg: route === r.value ? "#fff" : "transparent", fg: route === r.value ? "#0B3D2E" : "#fff" })),
    tradeFields: [
      { label: "Your name", name: "contact_name", type: "text", auto: "name", required: true, max: 120 },
      { label: "Business name", name: "business_name", type: "text", auto: "organization", required: true, max: 160 },
      { label: "Email", name: "email", type: "email", auto: "email", required: false, max: 254 },
      { label: "Phone", name: "phone", type: "tel", auto: "tel", required: false, max: 24 },
      { label: "Region", name: "region", type: "text", auto: "off", required: false, max: 60 },
      { label: "Town or trading location", name: "trading_location", type: "text", auto: "address-level2", required: false, max: 120 },
      { label: "Years in business (optional)", name: "years_trading", type: "text", auto: "off", required: false, max: 20 },
    ],
    trade: { ...trade, state: tradeState, pending: tradePending, action: tradeAction, v: tradeState.values ?? {} },
    tradeSent: tradeState.status === "success",
    tradeOpen: tradeState.status !== "success",
    checklist: ["The product name and variant", "Batch number and manufacturing or expiry information, where available", "Place and approximate date of purchase", "A photograph of the product packaging", "A brief description of your concern"].map((t, i) => ({ t, n: "0" + (i + 1) })),
  };
  return <ContactView v={v} />;
}
