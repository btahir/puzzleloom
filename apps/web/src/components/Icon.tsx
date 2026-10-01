export function Arrow() {
  return (
    <svg
      className="inline-icon"
      width="14"
      height="14"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
    >
      <path d="M5 15 15 5M5 5h10v10" />
    </svg>
  );
}
export function Shuffle() {
  return (
    <svg
      className="inline-icon"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      aria-hidden="true"
    >
      <path d="M3 6h3c5 0 7 12 12 12h3m-4-4 4 4-4 4M3 18h3c5 0 7-12 12-12h3m-4-4 4 4-4 4" />
    </svg>
  );
}
export function ThemeIcon({ dark }: { dark: boolean }) {
  return (
    <svg
      className="inline-icon"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
    >
      {dark ? (
        <>
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v3m0 14v3M2 12h3m14 0h3M5 5l2 2m10 10 2 2M5 19l2-2M17 7l2-2" />
        </>
      ) : (
        <path d="M20 15A9 9 0 0 1 9 3a9 9 0 1 0 11 12Z" />
      )}
    </svg>
  );
}
export function Download() {
  return (
    <svg
      className="inline-icon"
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      aria-hidden="true"
    >
      <path d="M8 2v8.5M4.5 7 8 10.5 11.5 7M2.5 13.5h11" />
    </svg>
  );
}
