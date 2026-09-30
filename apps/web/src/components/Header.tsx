"use client";
import { copy } from "../content/ui";

import { Arrow, ThemeIcon } from "./Icon";
import { useEffect, useState } from "react";
export function Logo() {
  return (
    <svg viewBox="0 0 36 36" width="32" height="32" aria-hidden="true">
      <path
        d="M1 12h11V1h11v11h12v11H23v12H12V23H1Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path d="M12 12h11v11H12z" fill="currentColor" />
      <path d="M16 16h4v4h-4z" fill="var(--bg)" />
    </svg>
  );
}
export default function Header() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    let d = false;
    try {
      d = localStorage.getItem("puzzleloom-theme") === "dark";
    } catch {
      /* The page still works when local storage is unavailable. */
    }
    setDark(d);
    document.documentElement.dataset.theme = d ? "dark" : "light";
  }, []);
  function toggle() {
    const d = !dark;
    setDark(d);
    document.documentElement.dataset.theme = d ? "dark" : "light";
    try {
      localStorage.setItem("puzzleloom-theme", d ? "dark" : "light");
    } catch {
      /* Keep the theme for this tab. */
    }
  }
  return (
    <header className="site-header">
      <a className="wordmark" href="/" aria-label={copy.puzzleloomHome}>
        <Logo />
        {copy.puzzleloom}
        <span className="wordmark-dot">.</span>
      </a>
      <nav aria-label={copy.mainNavigation}>
        <a href="/">{copy.theMaker}</a>
        <a href="/about/">{copy.about}</a>
        <a href="/agents/">{copy.forAgents}</a>
        <a href="/support/" className="support-nav">
          {copy.supportTheProject} <Arrow />
        </a>
        <button
          className="theme-button"
          onClick={toggle}
          aria-label={dark ? copy.switchToLightTheme : copy.switchToDarkTheme}
          title={dark ? copy.paperTheme : copy.chalkboardTheme}
        >
          <ThemeIcon dark={dark} />
        </button>
      </nav>
    </header>
  );
}
