"use client";

import { useState } from "react";
import { Select } from "@lexta/ui";
import type { AppRole } from "@lexta/db";
import { emailUser, inviteUser, removeUser, saveUser } from "@/app/(app)/systems/users/actions";
import FormAlerts from "@/components/crm/FormAlerts";
import { useCrmForm } from "@/components/crm/useCrmForm";

type Option = { id: string; label: string };
type Brand = { slug: string; name: string };

const ROLE_HELP: Record<AppRole, string> = {
  admin: "Everything, including Users and access.",
  management: "Sees every system and every brand.",
  sales_rep: "Field sales, distributor orders, CRM, stockists, complaints.",
  distributor: "Only their own orders.",
  customer_care: "Complaints, live chat, CRM, stockists.",
  hr: "Recruitment.",
  marketing: "Products, CSR, CRM, stockists, complaints.",
};

/** Role, brands and distributor fields, shared by the invite and edit forms. */
function AccessFields({ roles, brands, organisations, fe, role, setRole, chosenBrands, organisationId }: {
  roles: { value: AppRole; label: string }[];
  brands: Brand[];
  organisations: Option[];
  fe: Record<string, string>;
  role: string;
  setRole: (r: string) => void;
  chosenBrands: string[];
  organisationId: string;
}) {
  const err = (k: string) => (fe[k] ? <span className="ferr" id={`${k}_err`}>{fe[k]}</span> : null);
  const showBrands = role !== "" && role !== "admin" && role !== "management";
  return (
    <>
      <div className="field">
        <label htmlFor="role">Role</label>
        <Select id="role" name="role" value={role} onChange={(e) => setRole(e.target.value)} aria-invalid={!!fe.role}>
          <option value="">Choose a role</option>
          {roles.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
        </Select>
        {role && <span className="hint">{ROLE_HELP[role as AppRole]}</span>}
        {err("role")}
      </div>
      {showBrands && (
        <fieldset className="field users-brands">
          <legend>Brands they work on</legend>
          <div className="users-checks">
            {brands.map((b) => (
              <label key={b.slug}><input type="checkbox" name="brands" value={b.slug} defaultChecked={chosenBrands.includes(b.slug)} /> {b.name}</label>
            ))}
          </div>
          {role === "distributor" && <span className="hint">Optional for distributors: their orders come from their organisation.</span>}
          {err("brands")}
        </fieldset>
      )}
      {role === "distributor" && (
        <div className="field">
          <label htmlFor="organisation_id">Distributor organisation (from the CRM)</label>
          <Select id="organisation_id" name="organisation_id" defaultValue={organisationId}>
            <option value="">Choose later</option>
            {organisations.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
          </Select>
          <span className="hint">They see orders for this organisation only.</span>
          {err("organisation_id")}
        </div>
      )}
    </>
  );
}

export function InviteForm({ roles, brands, organisations, disabled }: {
  roles: { value: AppRole; label: string }[]; brands: Brand[]; organisations: Option[]; disabled: boolean;
}) {
  const { state, pending, onSubmit, fe } = useCrmForm(inviteUser);
  const [role, setRole] = useState("");
  const err = (k: string) => (fe[k] ? <span className="ferr" id={`${k}_err`}>{fe[k]}</span> : null);
  return (
    <form className="pform crm-form users-form" noValidate onSubmit={onSubmit} key={state.message ?? "invite"}>
      <FormAlerts state={state} />
      <fieldset disabled={pending || disabled}>
        <div className="row2">
          <div className="field">
            <label htmlFor="email">Email</label>
            <input id="email" name="email" type="email" autoComplete="off" required aria-invalid={!!fe.email} />
            {err("email")}
          </div>
          <div className="field">
            <label htmlFor="full_name">Full name</label>
            <input id="full_name" name="full_name" maxLength={120} aria-invalid={!!fe.full_name} />
            {err("full_name")}
          </div>
        </div>
        <div className="field">
          <label htmlFor="phone">Phone (optional)</label>
          <input id="phone" name="phone" type="tel" placeholder="+233 24 123 4567" aria-invalid={!!fe.phone} />
          {err("phone")}
        </div>
        <AccessFields roles={roles} brands={brands} organisations={organisations} fe={fe} role={role} setRole={setRole} chosenBrands={[]} organisationId="" />
        <div className="form-actions">
          <button className="btn" type="submit">{pending ? "Sending invite…" : "Send invite"}</button>
        </div>
        <p className="small">They get an email with a link to choose their password, then sign in here.</p>
      </fieldset>
    </form>
  );
}

export type EditValues = {
  id: string; email: string; full_name: string; phone: string; role: string; brands: string[]; organisation_id: string; is_active: boolean;
};

export function EditUserForm({ values, roles, brands, organisations, self }: {
  values: EditValues; roles: { value: AppRole; label: string }[]; brands: Brand[]; organisations: Option[]; self: boolean;
}) {
  const { state, pending, onSubmit, fe } = useCrmForm(saveUser);
  const [role, setRole] = useState(values.role);
  const err = (k: string) => (fe[k] ? <span className="ferr" id={`${k}_err`}>{fe[k]}</span> : null);
  return (
    <form className="pform crm-form users-form" noValidate onSubmit={onSubmit}>
      <FormAlerts state={state} />
      <input type="hidden" name="id" value={values.id} />
      <input type="hidden" name="was_active" value={String(values.is_active)} />
      <fieldset disabled={pending}>
        <div className="row2">
          <div className="field">
            <label htmlFor="full_name">Full name</label>
            <input id="full_name" name="full_name" maxLength={120} defaultValue={values.full_name} aria-invalid={!!fe.full_name} />
            {err("full_name")}
          </div>
          <div className="field">
            <label htmlFor="phone">Phone</label>
            <input id="phone" name="phone" type="tel" defaultValue={values.phone} aria-invalid={!!fe.phone} />
            {err("phone")}
          </div>
        </div>
        <AccessFields roles={roles} brands={brands} organisations={organisations} fe={fe} role={role} setRole={setRole}
          chosenBrands={values.brands} organisationId={values.organisation_id} />
        <div className="field">
          <label className="users-switch">
            <input type="checkbox" name="is_active" defaultChecked={values.is_active} />
            {" "}Login switched on
          </label>
          <span className="hint">{self
            ? "This is your own login. You cannot switch it off or remove your admin role while you are the only active admin."
            : "Switched off, they cannot sign in and see nothing. Their history stays."}</span>
        </div>
        <div className="form-actions">
          <button className="btn" type="submit">{pending ? "Saving…" : "Save changes"}</button>
        </div>
      </fieldset>
    </form>
  );
}

export function EmailButtons({ id, accepted }: { id: string; accepted: boolean }) {
  const { state, pending, onSubmit } = useCrmForm(emailUser);
  return (
    <form className="users-emails" onSubmit={onSubmit}>
      <FormAlerts state={state} />
      <input type="hidden" name="id" value={id} />
      {accepted && <p className="small">They have already accepted the invite, so sending it again emails them a new link to choose their password.</p>}
      <div className="form-actions">
        <button className="btn light" type="submit" name="kind" value="resend_invite" disabled={pending}>Send the invite again</button>
        <button className="btn light" type="submit" name="kind" value="reset_password" disabled={pending}>Send a password reset email</button>
      </div>
    </form>
  );
}

export function RemoveUserForm({ id, email }: { id: string; email: string }) {
  const { state, pending, onSubmit, fe } = useCrmForm(removeUser);
  const [sure, setSure] = useState(false);
  return (
    <form className="users-remove" onSubmit={onSubmit}>
      <FormAlerts state={state} />
      <input type="hidden" name="id" value={id} />
      <label className="users-switch">
        <input type="checkbox" name="confirm" checked={sure} onChange={(e) => setSure(e.target.checked)} aria-invalid={!!fe.confirm} />
        Yes, remove {email}
      </label>
      <div className="form-actions">
        <button className="btn danger" type="submit" disabled={pending || !sure}>{pending ? "Removing..." : "Remove login"}</button>
      </div>
    </form>
  );
}
