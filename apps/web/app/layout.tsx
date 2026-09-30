import { copy } from "../src/content/ui";
import type { Metadata } from "next";
import localFont from "next/font/local";
const displayFont = localFont({
  src: "../../../node_modules/@fontsource/young-serif/files/young-serif-latin-400-normal.woff2",
  variable: "--font-display",
  display: "swap",
});
const interfaceFont = localFont({
  src: [
    {
      path: "../../../node_modules/@fontsource/atkinson-hyperlegible-next/files/atkinson-hyperlegible-next-latin-400-normal.woff2",
      weight: "400",
    },
    {
      path: "../../../node_modules/@fontsource/atkinson-hyperlegible-next/files/atkinson-hyperlegible-next-latin-600-normal.woff2",
      weight: "600",
    },
  ],
  variable: "--font-interface",
  display: "swap",
});
import "./globals.css";
import Header from "../src/components/Header";
import Footer from "../src/components/Footer";
import { SITE_URL } from "../src/config/site";
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Puzzleloom — A little ink. A little imagination.",
    template: "%s · Puzzleloom",
  },
  description:
    "Make beautiful crosswords, word searches, scrambles and cryptograms from your own words. Free printable PDFs, answer keys and class sets. No account.",
  openGraph: {
    title: "Your words. A world of puzzles.",
    description:
      "Make, print and share a little curiosity. Free, private and made for the classroom.",
    images: [{ url: "/desk-art.png", width: 1536, height: 1024 }],
  },
  icons: { icon: "/favicon.svg" },
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link
          rel="preload"
          href="/fonts/AtkinsonHyperlegibleNext-Regular.ttf"
          as="font"
          type="font/ttf"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/OpenDyslexic-Regular.otf"
          as="font"
          type="font/otf"
          crossOrigin="anonymous"
        />
      </head>
      <body className={`${displayFont.variable} ${interfaceFont.variable}`}>
        <a className="skip-link" href="#main">
          {copy.skipToContent}{" "}
        </a>
        <Header />
        <main id="main">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
