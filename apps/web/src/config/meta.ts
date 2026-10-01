import type { Metadata } from "next";
import { SITE_NAME, SITE_URL } from "./site";

export const OG_IMAGE = {
  url: "/og.png",
  width: 1200,
  height: 630,
  alt: "Puzzleloom: a printed crossword with its answer key",
};

/** Unique title, description, canonical and social tags for one page. */
export function pageMeta({
  title,
  description,
  path,
  absoluteTitle = false,
}: {
  title: string;
  description: string;
  path: string;
  absoluteTitle?: boolean;
}): Metadata {
  const fullTitle = absoluteTitle ? title : `${title} · ${SITE_NAME}`;
  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      locale: "en_US",
      url: path,
      title: fullTitle,
      description,
      images: [OG_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [OG_IMAGE.url],
    },
  };
}

export const appJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: SITE_NAME,
  url: `${SITE_URL}/`,
  applicationCategory: "EducationalApplication",
  operatingSystem: "Any modern web browser",
  browserRequirements: "Requires JavaScript",
  isAccessibleForFree: true,
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  description:
    "Free maker for crosswords, word searches, word scrambles and cryptograms. Prints vector PDFs with answer keys and class sets of up to 40 versions. Runs in the browser with no account.",
  featureList: [
    "Crossword, word search, word scramble and cryptogram from one word list",
    "Every crossword word placed in one connected grid, or an explanation of what didn't fit",
    "Class sets of up to 40 versions, each with its own answer key and printed ID",
    "Vector PDF on US Letter or A4 with answer keys",
    "No account, no upload, no watermark",
    "Command-line tool and local MCP server for AI assistants",
  ],
};

/** Serialise JSON-LD safely for a script tag. */
export function jsonLd(data: unknown) {
  return { __html: JSON.stringify(data).replace(/</g, "\\u003c") };
}
