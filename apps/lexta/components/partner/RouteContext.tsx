"use client";

import { createContext, useActionState, useContext, useState, type ReactNode } from "react";
import { submitPartnerForm } from "@/app/actions/forms";
import { idleState } from "@/components/forms/FormParts";
import type { FormState } from "@/lib/forms/core";
import { routes, type Route } from "./data";

type Ctx = {
  active: Route;
  select: (key: string) => void;
  /** The application form's server action state, shared so the route cards start on the route last sent. */
  form: [state: FormState, formAction: (fd: FormData) => void, pending: boolean];
};

/**
 * The partnership route a visitor has picked. "Ways to partner" sets it; the selected-route panel and the
 * application form further down the page read it, as in the prototype. Distributor is the default. After a post
 * without JavaScript the page comes back on the route that was sent.
 */
const RouteContext = createContext<Ctx | null>(null);

export function RouteProvider({ children }: { children: ReactNode }) {
  const form = useActionState(submitPartnerForm, idleState);
  const sent = form[0].values?.route;
  const [key, setKey] = useState(() => (routes.some((r) => r.key === sent) ? (sent as string) : "Distributor"));
  const active = routes.find((r) => r.key === key) ?? routes[0];
  return <RouteContext.Provider value={{ active, select: setKey, form }}>{children}</RouteContext.Provider>;
}

export function useActiveRoute() {
  const ctx = useContext(RouteContext);
  if (!ctx) throw new Error("useActiveRoute must be used inside RouteProvider");
  return ctx;
}
