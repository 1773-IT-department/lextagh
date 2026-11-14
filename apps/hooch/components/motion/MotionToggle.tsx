"use client";

import Icon from "@/components/Icon";
import { setMotionPaused, useMotionPaused } from "@/lib/motion";

/** The Pause motion / Play motion button (site-wide; the header carries one, each 3D stage another). */
export default function MotionToggle({ className, compact = false }: { className?: string; compact?: boolean }) {
  const paused = useMotionPaused();
  return (
    <button type="button" className={className} aria-pressed={paused} onClick={() => setMotionPaused(!paused)} data-no-sprinkle="">
      <Icon name={paused ? "play" : "pause"} size={compact ? 16 : 14} />
      <span className={compact ? "hc-sr" : undefined}>{paused ? "Play motion" : "Pause motion"}</span>
    </button>
  );
}
