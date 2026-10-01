"use client";
import { copy } from "../content/ui";
import { MARK_TILES } from "./mark";
import { ThemeIcon } from "./Icon";
import { useEffect, useRef, useState } from "react";

/** PEN across, PAD down, sharing the P. */
export function Logo({ size = 40 }: { size?: number }) {
  const tile = 11.5,
    stroke = 1.4,
    box = tile * 3 + stroke;
  return (
    <svg
      className="logo-mark"
      viewBox={`0 0 ${box} ${box}`}
      width={size}
      height={size}
      aria-hidden="true"
    >
      {MARK_TILES.map((t) => {
        const x = t.x * tile + stroke / 2,
          y = t.y * tile + stroke / 2;
        return (
          <g key={`${t.x}-${t.y}`}>
            <rect
              x={x}
              y={y}
              width={tile}
              height={tile}
              className={t.shared ? "mark-shared" : "mark-tile"}
              strokeWidth={stroke}
            />
            <text
              x={x + tile / 2}
              y={y + tile * 0.74}
              textAnchor="middle"
              className="mark-letter"
            >
              {t.letter}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

const links = [
  { href: "/", label: copy.navMaker },
  { href: "/about/", label: copy.navAbout },
  { href: "/agents/", label: copy.navAgents },
  { href: "/support/", label: copy.navSupport },
];

/** Swap themes without animating every colour (keeps the switch crisp and screenshots stable). */
function applyTheme(theme: "light" | "dark") {
  const root = document.documentElement;
  root.classList.add("theme-switching");
  root.dataset.theme = theme;
  // Force a style flush, then re-enable transitions on the next frame.
  void getComputedStyle(root).color;
  requestAnimationFrame(() =>
    requestAnimationFrame(() => root.classList.remove("theme-switching")),
  );
}

export default function Header() {
  const [dark, setDark] = useState(false);
  const [open, setOpen] = useState(false);
  const [path, setPath] = useState("");
  const menuButton = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    setDark(document.documentElement.dataset.theme === "dark");
    setPath(location.pathname);
  }, []);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        menuButton.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);
  function toggle() {
    const d = !dark;
    setDark(d);
    applyTheme(d ? "dark" : "light");
    try {
      localStorage.setItem("puzzleloom-theme", d ? "dark" : "light");
    } catch {
      /* Keep the theme for this tab. */
    }
  }
  return (
    <header className="site-header">
      <a className="wordmark" href="/" aria-label={copy.homeLabel}>
        <Logo />
        <span>{copy.siteName}</span>
      </a>
      <nav
        id="site-nav"
        className={open ? "site-nav is-open" : "site-nav"}
        aria-label={copy.mainNavigation}
      >
        {links.map((l) => (
          <a
            key={l.href}
            href={l.href}
            aria-current={path === l.href ? "page" : undefined}
            className={l.href === "/support/" ? "support-nav" : undefined}
          >
            {l.label}
          </a>
        ))}
      </nav>
      <div className="header-tools">
        <button
          className="theme-button"
          onClick={toggle}
          aria-label={dark ? copy.switchToLightTheme : copy.switchToDarkTheme}
        >
          <ThemeIcon dark={dark} />
        </button>
        <button
          ref={menuButton}
          className="menu-button"
          aria-expanded={open}
          aria-controls="site-nav"
          onClick={() => setOpen((o) => !o)}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 18 18"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            aria-hidden="true"
          >
            {open ? (
              <path d="M4 4l10 10M14 4 4 14" />
            ) : (
              <path d="M2 5h14M2 9h14M2 13h14" />
            )}
          </svg>
          <span>{copy.menu}</span>
        </button>
      </div>
    </header>
  );
}
