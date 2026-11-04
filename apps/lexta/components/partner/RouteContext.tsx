"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { routes, type Route } from "./data";

/**
 * The partnership route a visitor has picked. "Ways to partner" sets it; the selected-route panel and the
 * application form further down the page read it, as in the prototype. Distributor is the default.
 */
const RouteContext = createContext<{ active: Route; select: (key: string) => void } | null>(null);

export function RouteProvider({ children }: { children: ReactNode }) {
  const [key, setKey] = useState("Distributor");
  const active = routes.find((r) => r.key === key) ?? routes[0];
  return <RouteContext.Provider value={{ active, select: setKey }}>{children}</RouteContext.Provider>;
}

export function useActiveRoute() {
  const ctx = useContext(RouteContext);
  if (!ctx) throw new Error("useActiveRoute must be used inside RouteProvider");
  return ctx;
}
