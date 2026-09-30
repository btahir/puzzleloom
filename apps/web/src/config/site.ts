/**
 * Site-wide constants. SITE_URL is defined only here.
 * DONATION_LINKS is the only place in the repo where a Stripe URL may appear:
 * every "Support" link goes to our own /support/ page, which reads them from here.
 * Do not edit the links, and do not create new ones.
 */
export const SITE_URL = "https://puzzleloom.vercel.app";
export const SITE_NAME = "Puzzleloom";
export const SUPPORT_URL = "/support/";
export const GITHUB_URL = "https://github.com/btahir/puzzleloom";

export const DONATION_LINKS = {
  once: "https://buy.stripe.com/fZu14m0FO3v050PfqP3ks00",
  monthly: [
    { label: "$5", note: "Supporter", href: "https://buy.stripe.com/9B68wOewEaXsgJxdiH3ks01" },
    { label: "$15", note: "Backer", href: "https://buy.stripe.com/7sYbJ088g3v0gJx4Mb3ks02" },
    { label: "$50", note: "Sponsor", href: "https://buy.stripe.com/28EeVc88g5D80Kz2E33ks03" },
    { label: "$100", note: "Company sponsor", href: "https://buy.stripe.com/00w14m6088PkbpdceD3ks04" },
  ],
} as const;
