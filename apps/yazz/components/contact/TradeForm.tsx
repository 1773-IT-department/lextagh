"use client";

import { Select } from "@lexta/ui";
import { Honeypot, invalidProps, useServerForm } from "@lexta/forms/react";
import { useActionState } from "react";
import { submitTradeForm } from "@/app/actions/forms";
import Icon from "@/components/Icon";
import { FieldError, FormMessage, idleState } from "@/components/forms/FormParts";
import f from "@/components/forms/forms.module.css";
import { TRADE_ROUTES, VOLUMES } from "@/lib/forms/options";
import { RANGE_SLUGS, RANGES } from "@/lib/ranges";
import type { RegionOption } from "@/lib/where-to-buy";

/**
 * Trade and distributor enquiry ("Become a Yazz Partner"): a CRM lead from the website partner form, with the business
 * as a new organisation, brand Yazz. Posts without JavaScript too.
 */
export default function TradeForm({ regions }: { regions: RegionOption[] }) {
  const [state, action, pending] = useActionState(submitTradeForm, idleState);
  const { ref, onSubmit } = useServerForm(state, action, pending);
  const v = state.values ?? {};
  const chosen = new Set((v.ranges ?? "").split(",").filter(Boolean));
  const inv = (n: string) => invalidProps(state, n, `t-${n}-error`);
  const err = (n: string) => <FieldError id={`t-${n}-error`} message={state.fieldErrors?.[n]} tone="dark" />;

  return (
    <form ref={ref} action={action} onSubmit={onSubmit} className={`${f.stack} ${f.dark}`} noValidate aria-labelledby="trade-title">
      <Honeypot />
      <fieldset className={f.chips}>
        <legend>I am a</legend>
        {TRADE_ROUTES.map((r, i) => (
          <label key={r.value} className={f.chip}>
            <input type="radio" name="route" value={r.value} defaultChecked={(v.route ?? TRADE_ROUTES[0].value) === r.value || (!v.route && i === 0)} />
            <span>{r.label}</span>
          </label>
        ))}
      </fieldset>
      <div className={f.row2}>
        <div className={f.field}>
          <label className={f.label} htmlFor="t-name">Your name</label>
          <input id="t-name" name="contact_name" className={f.input} autoComplete="name" required maxLength={120} defaultValue={v.contact_name ?? ""} {...inv("contact_name")} />
          {err("contact_name")}
        </div>
        <div className={f.field}>
          <label className={f.label} htmlFor="t-business">Business name</label>
          <input id="t-business" name="business_name" className={f.input} autoComplete="organization" required maxLength={160} defaultValue={v.business_name ?? ""} {...inv("business_name")} />
          {err("business_name")}
        </div>
        <div className={f.field}>
          <label className={f.label} htmlFor="t-email">Email</label>
          <input id="t-email" name="email" type="email" className={f.input} autoComplete="email" maxLength={254} defaultValue={v.email ?? ""} {...inv("email")} />
          {err("email")}
        </div>
        <div className={f.field}>
          <label className={f.label} htmlFor="t-phone">Phone</label>
          <input id="t-phone" name="phone" type="tel" className={f.input} autoComplete="tel" maxLength={24} defaultValue={v.phone ?? ""} {...inv("phone")} />
          {err("phone")}
        </div>
        <div className={f.field}>
          <label className={f.label} htmlFor="t-region">Region</label>
          <Select id="t-region" name="region" className={f.select} defaultValue={v.region ?? ""} {...inv("region")}>
            <option value="">Choose your region</option>
            {regions.map((r) => <option key={r.slug} value={r.slug}>{r.name}</option>)}
          </Select>
          {err("region")}
        </div>
        <div className={f.field}>
          <label className={f.label} htmlFor="t-town">Town or trading location</label>
          <input id="t-town" name="trading_location" className={f.input} maxLength={120} defaultValue={v.trading_location ?? ""} {...inv("trading_location")} />
          {err("trading_location")}
        </div>
        <div className={f.field}>
          <label className={f.label} htmlFor="t-years">Years trading <span className={f.opt}>(optional)</span></label>
          <input id="t-years" name="years_trading" className={f.input} inputMode="numeric" maxLength={20} defaultValue={v.years_trading ?? ""} {...inv("years_trading")} />
          {err("years_trading")}
        </div>
        <div className={f.field}>
          <label className={f.label} htmlFor="t-volume">Expected monthly volume <span className={f.opt}>(optional)</span></label>
          <Select id="t-volume" name="volume" className={f.select} defaultValue={v.volume ?? ""} {...inv("volume")}>
            <option value="">Choose a volume</option>
            {VOLUMES.map((x) => <option key={x} value={x}>{x}</option>)}
          </Select>
          {err("volume")}
        </div>
      </div>
      <fieldset className={f.chips}>
        <legend>Ranges you are interested in <span className={f.opt}>(optional)</span></legend>
        {RANGE_SLUGS.map((r) => (
          <label key={r} className={f.chip}>
            <input type="checkbox" name="ranges" value={r} defaultChecked={chosen.has(r)} />
            <span>{RANGES[r].name}</span>
          </label>
        ))}
      </fieldset>
      <div className={f.field}>
        <label className={f.label} htmlFor="t-message">Anything else? <span className={f.opt}>(optional)</span></label>
        <textarea id="t-message" name="message" className={f.textarea} maxLength={3000} defaultValue={v.message ?? ""} placeholder="Storage capacity, delivery needs, products and quantities." {...inv("message")} />
        {err("message")}
      </div>
      <FormMessage state={state} tone="dark" />
      <div className={f.submitRow}>
        <button type="submit" className="yz-btn yz-btn--red" aria-disabled={pending || undefined}>
          {pending ? "Sending..." : <>Send Trade Enquiry <Icon name="arrow" size={17} /></>}
        </button>
      </div>
    </form>
  );
}
