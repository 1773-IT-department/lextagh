// Sound and tab alerts for live chat, shared by the website chat widget (visitors) and the Business System inbox (staff).
//
// The chime is made with the Web Audio API (two soft sine notes), so there is no audio file to download and nothing
// from another site. Browsers only allow sound after the person has interacted with the page, so primeChatSound()
// unlocks audio on the first tap, click or key press; until then a chime is skipped quietly. Each person can mute it;
// the choice is kept in localStorage (when storage is blocked, sound is simply on for this visit).
//
// Every chime that is due is also announced as a "lx-chat-sound" event on document (detail: the kind), whether or
// not it is muted or audible, so tests and other parts of the page can follow along.

export type ChatSoundKind = "incoming" | "new" | "sent";

const MUTE_KEY = "lx-chat-muted";

type AudioCtor = typeof AudioContext;
let ctx: AudioContext | null = null;
let primed = false;

function audioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (ctx) return ctx;
  const Ctor = (window.AudioContext ?? (window as unknown as { webkitAudioContext?: AudioCtor }).webkitAudioContext) as AudioCtor | undefined;
  if (!Ctor) return null;
  try { ctx = new Ctor(); } catch { ctx = null; }
  return ctx;
}

/** Unlocks audio on the person's first interaction with the page. Safe to call many times. */
export function primeChatSound(): void {
  if (primed || typeof window === "undefined") return;
  primed = true;
  const unlock = () => {
    const c = audioContext();
    if (c && c.state === "suspended") void c.resume().catch(() => {});
    window.removeEventListener("pointerdown", unlock, true);
    window.removeEventListener("keydown", unlock, true);
  };
  window.addEventListener("pointerdown", unlock, true);
  window.addEventListener("keydown", unlock, true);
}

export function chatSoundMuted(): boolean {
  try { return window.localStorage.getItem(MUTE_KEY) === "1"; } catch { return false; }
}

export function setChatSoundMuted(muted: boolean): void {
  try {
    if (muted) window.localStorage.setItem(MUTE_KEY, "1");
    else window.localStorage.removeItem(MUTE_KEY);
  } catch {
    // Storage blocked: the choice lasts until the page is reloaded (see the caller's state).
  }
}

// The notes of each chime: [frequency in Hz, start in s, length in s, loudness].
const CHIMES: Record<ChatSoundKind, [number, number, number, number][]> = {
  incoming: [[880, 0, 0.18, 0.16], [1318.5, 0.12, 0.28, 0.14]],
  new: [[659.25, 0, 0.16, 0.16], [880, 0.12, 0.16, 0.15], [1318.5, 0.24, 0.3, 0.13]],
  sent: [[1046.5, 0, 0.09, 0.06]],
};

/** Plays a short, soft chime unless the person muted chat sounds. Never throws. */
export function playChatSound(kind: ChatSoundKind = "incoming", muted = chatSoundMuted()): void {
  if (typeof document === "undefined") return;
  try { document.dispatchEvent(new CustomEvent("lx-chat-sound", { detail: kind })); } catch { /* old browsers */ }
  if (muted) return;
  const c = audioContext();
  if (!c || c.state !== "running") return;
  try {
    const now = c.currentTime + 0.01;
    for (const [freq, at, len, gain] of CHIMES[kind]) {
      const osc = c.createOscillator();
      const vol = c.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      vol.gain.setValueAtTime(0.0001, now + at);
      vol.gain.exponentialRampToValueAtTime(gain, now + at + 0.02);
      vol.gain.exponentialRampToValueAtTime(0.0001, now + at + len);
      osc.connect(vol).connect(c.destination);
      osc.start(now + at);
      osc.stop(now + at + len + 0.05);
    }
  } catch {
    // No sound this time; the visual alerts still show.
  }
}

// Tab title alert --------------------------------------------------------------------------------------------------
const PREFIX = /^\(\d+\) (New message[s]? \| )?/;
let flashTimer = 0;
let flashOn = false;

const baseTitle = () => document.title.replace(PREFIX, "");

/**
 * Shows the number of unread messages in the tab title ("(2) New messages | Lexta Ghana"), alternating with the plain
 * count every 1.5 seconds so it catches the eye in a row of tabs. With reduced motion it stays still. count 0 clears.
 */
export function setChatTitleAlert(count: number, opts: { flash?: boolean } = {}): void {
  if (typeof document === "undefined") return;
  window.clearInterval(flashTimer);
  flashTimer = 0;
  const base = baseTitle();
  if (count <= 0) { document.title = base; return; }
  const word = count === 1 ? "New message" : "New messages";
  const full = `(${count}) ${word} | ${base}`;
  const calm = (() => { try { return window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch { return false; } })();
  document.title = full;
  if (opts.flash === false || calm) return;
  flashOn = true;
  flashTimer = window.setInterval(() => {
    const b = baseTitle();
    flashOn = !flashOn;
    document.title = flashOn ? `(${count}) ${word} | ${b}` : `(${count}) ${b}`;
  }, 1500);
}
