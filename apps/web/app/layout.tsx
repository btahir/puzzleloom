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
import { SITE_NAME, SITE_URL } from "../src/config/site";
import { OG_IMAGE, appJsonLd, jsonLd } from "../src/config/meta";
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: SITE_NAME,
  title: {
    default: "Puzzleloom: free crossword and word search maker",
    template: "%s · Puzzleloom",
  },
  description:
    "Make a crossword, word search, word scramble or cryptogram from your own word list. Free printable PDF with answer keys and class sets. No account.",
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    images: [OG_IMAGE],
  },
  twitter: { card: "summary_large_image", images: [OG_IMAGE.url] },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icon-32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
};
export const viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#faf6ec" },
    { media: "(prefers-color-scheme: dark)", color: "#1e2a26" },
  ],
};
// Runs before first paint: saved choice first, then the system setting.
const themeScript = `try{var t=localStorage.getItem("puzzleloom-theme");if(t!=="dark"&&t!=="light")t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";document.documentElement.dataset.theme=t}catch(e){document.documentElement.dataset.theme="light"}`;
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={jsonLd(appJsonLd)}
        />
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
          {copy.skipToContent}
        </a>
        <Header />
        <main id="main">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
