"use client";

import { useEffect } from "react";

/**
 * Prototype "reveal on scroll": every [data-reveal] section that starts below the fold fades up
 * (lxrise, defined in globals.css) as it enters the viewport, and is shown anyway after 4s.
 */
export default function RevealOnScroll() {
  useEffect(() => {
    if (!("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          (e.target as HTMLElement).style.animation = "lxrise .7s cubic-bezier(.2,.7,.2,1) both";
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12 });
    const timers: number[] = [];
    document.querySelectorAll<HTMLElement>("[data-reveal]").forEach((el) => {
      if (el.getBoundingClientRect().top < window.innerHeight * 0.9) return;
      el.style.opacity = "0";
      io.observe(el);
      timers.push(window.setTimeout(() => { el.style.opacity = ""; el.style.animation = ""; }, 4000));
    });
    return () => { io.disconnect(); timers.forEach((t) => window.clearTimeout(t)); };
  }, []);
  return null;
}
