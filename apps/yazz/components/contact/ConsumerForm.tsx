"use client";

import { DateInput, Select } from "@lexta/ui";
import { ATTACHMENT_ACCEPT, useComplaintAttachment } from "@lexta/forms/attachment";
import { Honeypot, invalidProps, useServerForm } from "@lexta/forms/react";
import { useActionState, useState } from "react";
import { startComplaintUpload, submitConsumerForm } from "@/app/actions/forms";
import Icon from "@/components/Icon";
import { FieldError, FormMessage, idleState } from "@/components/forms/FormParts";
import f from "@/components/forms/forms.module.css";
import { TOPICS, type Topic } from "@/lib/forms/options";
import { lexta } from "@/lib/site";
import type { RegionOption } from "@/lib/where-to-buy";
import s from "./contact.module.css";

export type ProductGroup = { label: string; options: { slug: string; name: string }[] };

/**
 * The consumer contact form (the prototype's "How Can We Help?"). "Report a problem with a product" goes to the
 * complaints tracker (case number), every other topic to the CRM as a website lead, brand Yazz. The problem fields
 * (batch, where and when bought, an optional photo or document) show for that topic with CSS alone, so the form also
 * works without JavaScript. The file goes up with a one time ticket (packages/forms/src/complaint-file.ts).
 */
export default function ConsumerForm({ regions, products, initialTopic, initialProduct, initialRegion }: {
  regions: RegionOption[]; products: ProductGroup[]; initialTopic: Topic; initialProduct: string; initialRegion: string;
}) {
  const [state, action, pending] = useActionState(submitConsumerForm, idleState);
  const file = useComplaintAttachment(startComplaintUpload);
  const { ref, onSubmit, preparing } = useServerForm(state, action, pending, file.prepare);
  const busy = pending || preparing;
  const v = state.values ?? {};
  const fileError = file.error ?? state.fieldErrors?.attachment;
  const [topic, setTopic] = useState<Topic>((v.topic as Topic) || initialTopic);
  const inv = (n: string) => invalidProps(state, n, `c-${n}-error`);
  const err = (n: string) => <FieldError id={`c-${n}-error`} message={state.fieldErrors?.[n]} />;
  const today = new Date().toISOString().slice(0, 10);

  return (
    <form ref={ref} action={action} onSubmit={onSubmit} className={`${f.stack} ${s.consumer}`} noValidate aria-labelledby="message-title">
      <Honeypot />
      <fieldset className={f.chips}>
        <legend>What is it about?</legend>
        {TOPICS.map((t) => (
          <label key={t.value} className={f.chip}>
            <input type="radio" name="topic" value={t.value} defaultChecked={t.value === topic} onChange={() => setTopic(t.value)} />
            <span>{t.label}</span>
          </label>
        ))}
      </fieldset>
      <p className={f.hint} aria-live="polite">{TOPICS.find((t) => t.value === topic)?.hint}</p>

      <div className={f.row3}>
        <div className={f.field}>
          <label className={f.label} htmlFor="c-name">Full name</label>
          <input id="c-name" name="name" className={f.input} autoComplete="name" required maxLength={120} defaultValue={v.name ?? ""} placeholder="Ama Mensah" {...inv("name")} />
          {err("name")}
        </div>
        <div className={f.field}>
          <label className={f.label} htmlFor="c-email">Email</label>
          <input id="c-email" name="email" type="email" className={f.input} autoComplete="email" maxLength={254} defaultValue={v.email ?? ""} placeholder="you@email.com" {...inv("email")} aria-describedby={state.fieldErrors?.email ? "c-email-error" : "c-reach"} />
          {err("email")}
        </div>
        <div className={f.field}>
          <label className={f.label} htmlFor="c-phone">Phone</label>
          <input id="c-phone" name="phone" type="tel" className={f.input} autoComplete="tel" maxLength={24} defaultValue={v.phone ?? ""} placeholder="+233 ..." {...inv("phone")} />
          {err("phone")}
        </div>
      </div>
      <p id="c-reach" className={f.hint} style={{ marginTop: -8 }}>An email address or a phone number, so we can reply.</p>

      <div className={f.row2}>
        <div className={f.field}>
          <label className={f.label} htmlFor="c-region">Region <span className={f.opt}>(optional)</span></label>
          <Select id="c-region" name="region" className={f.select} defaultValue={v.region ?? initialRegion} {...inv("region")}>
            <option value="">Choose your region</option>
            {regions.map((r) => <option key={r.slug} value={r.slug}>{r.name}</option>)}
          </Select>
          {err("region")}
        </div>
        <div className={f.field}>
          <label className={f.label} htmlFor="c-product">Product <span className={f.opt}>(optional)</span></label>
          <Select id="c-product" name="product" className={f.select} defaultValue={v.product ?? initialProduct} {...inv("product")}>
            <option value="">Choose a product</option>
            {products.map((g) => (
              <optgroup key={g.label} label={g.label}>
                {g.options.map((o) => <option key={o.slug} value={o.slug}>{o.name}</option>)}
              </optgroup>
            ))}
          </Select>
          {err("product")}
        </div>
      </div>

      <div className={`${f.row3} ${s.problemOnly}`}>
        <div className={f.field}>
          <label className={f.label} htmlFor="c-batch">Batch code <span className={f.opt}>(on the pack)</span></label>
          <input id="c-batch" name="batch" className={f.input} maxLength={60} defaultValue={v.batch ?? ""} {...inv("batch")} />
          {err("batch")}
        </div>
        <div className={f.field}>
          <label className={f.label} htmlFor="c-place">Where you bought it</label>
          <input id="c-place" name="purchase_place" className={f.input} maxLength={200} defaultValue={v.purchase_place ?? ""} placeholder="Shop and town" {...inv("purchase_place")} />
          {err("purchase_place")}
        </div>
        <div className={f.field}>
          <label className={f.label} htmlFor="c-date">Date bought</label>
          <DateInput id="c-date" name="purchase_date" className={f.input} max={today} defaultValue={v.purchase_date ?? ""} {...inv("purchase_date")} />
          {err("purchase_date")}
        </div>
      </div>

      <div className={f.field}>
        <label className={f.label} htmlFor="c-message">Message</label>
        <textarea id="c-message" name="message" className={f.textarea} required maxLength={3000} defaultValue={v.message ?? ""} placeholder="Tell us what you need, or what happened." {...inv("message")} />
        {err("message")}
      </div>
      <div className={`${f.field} ${s.problemOnly} ${s.fileField}`}>
        <label className={f.label} htmlFor="c-attachment">Photo or document <span className={f.opt}>(optional)</span></label>
        <input id="c-attachment" name="attachment" type="file" accept={ATTACHMENT_ACCEPT} className={`${f.input} ${s.file}`}
          onChange={file.clearError} aria-invalid={fileError ? true : undefined} aria-describedby={fileError ? "c-attachment-error" : "c-attachment-hint"} />
        <span id="c-attachment-hint" className={f.hint}>One JPG, PNG or PDF, up to 5 MB. A photo of the pack and its batch code helps us most.</span>
        {v.attachment_path && (
          <span className={f.hint}>
            <input type="hidden" name="attachment_path" value={v.attachment_path} />
            <input type="hidden" name="attachment_name" value={v.attachment_name ?? ""} />
            Attached: {v.attachment_name || "your file"}. Choose a new file to replace it.
          </span>
        )}
        <FieldError id="c-attachment-error" message={fileError ?? undefined} />
      </div>
      <p className={f.hint}>Please do not share sensitive health details in this form.</p>
      <label className={f.consent}>
        <input type="checkbox" name="privacy" value="yes" required defaultChecked={v.privacy === "yes"} {...inv("privacy")} />
        <span>I agree to the <a href={lexta.privacy} target="_blank" rel="noopener">privacy notice</a>.</span>
      </label>
      {err("privacy")}

      <FormMessage state={state} />
      <div className={f.submitRow}>
        <button type="submit" className="yz-btn yz-btn--red" aria-disabled={busy || undefined}>
          {preparing ? "Uploading..." : pending ? "Sending..." : <>Send Message <Icon name="arrow" size={17} /></>}
        </button>
      </div>
    </form>
  );
}
