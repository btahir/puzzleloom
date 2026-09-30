import { SITE_URL } from "../src/config/site";
import { landingPages } from "../src/content/pages";
export const dynamic = "force-static";
export default function sitemap() {
  return [
    "",
    "about/",
    "support/",
    "agents/",
    ...landingPages.map((p) => p.slug + "/"),
  ].map((path) => ({ url: `${SITE_URL}/${path}` }));
}
