/**
 * Renders link copy that ends in the prototype's "→" (for example "Talk to us →") with the arrow hidden from
 * screen readers, so the link is announced by its words only. Looks exactly the same.
 */
export default function ArrowText({ text }: { text: string }) {
  if (!text.endsWith(" →")) return <>{text}</>;
  return <>{text.slice(0, -2)} <span aria-hidden="true">→</span></>;
}
