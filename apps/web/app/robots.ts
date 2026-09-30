import { SITE_URL } from "../src/config/site";
export const dynamic = "force-static";
export default function robots() {
  return {
    rules: { userAgent: "*", allow: "/", disallow: "/play/" },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
