/** A moon over a wavy water line: the small mark of Loy Krathong on the home page. */
export function LoyKrathongIcon() {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" aria-hidden="true" style={{ flexShrink: 0 }}>
      <circle cx="39" cy="29" r="20" fill="rgba(27, 43, 94, 0.1)" />
      <circle cx="36" cy="26" r="20" fill="var(--fest-light, var(--accent))" />
      <path d="M6 54 C14 48 22 60 30 54 C38 48 46 60 58 52" className="ln" />
    </svg>
  );
}
