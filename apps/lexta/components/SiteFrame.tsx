"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/**
 * Page wrapper from the prototype. Home used overflow-x:hidden, every other page overflow-x:clip.
 * The difference matters: "hidden" turns the wrapper into a scroll container, so sticky elements inside it
 * (the header, the About journey bar) stop sticking. Each page keeps what Lexta approved.
 */
export default function SiteFrame({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return <div style={{ width: "100%", overflowX: pathname === "/" ? "hidden" : "clip" }}>{children}</div>;
}
