import { copy } from "../content/ui";
import { GITHUB_URL } from "../config/site";
export default function Footer() {
  return (
    <footer className="site-footer">
      <span>{copy.aLittleInkALittleImagination}</span>
      <div>
        <a href="/about/">{copy.privacyCredits}</a>
        <a href="/agents/">{copy.cliMcp}</a>
        <a href={GITHUB_URL}>{copy.openSource}</a>
        <a href="/support/">{copy.support}</a>
      </div>
      <small>{copy.madeForCuriousMindsFreeAlways}</small>
    </footer>
  );
}
