import { copy } from "../content/ui";
import { GITHUB_URL } from "../config/site";
export default function Footer() {
  return (
    <footer className="site-footer">
      <p>
        <strong>{copy.siteName}</strong> {copy.footerNote}
      </p>
      <nav aria-label={copy.footerNavigation}>
        <a href="/about/">{copy.footerAbout}</a>
        <a href="/agents/">{copy.footerAgents}</a>
        <a href={GITHUB_URL}>{copy.footerSource}</a>
        <a href="/support/">{copy.footerSupport}</a>
      </nav>
    </footer>
  );
}
