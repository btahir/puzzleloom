import { copy } from "../../src/content/ui";
import { notFound } from "next/navigation";
import Maker from "../../src/components/MakerServer";
import { Arrow } from "../../src/components/Icon";
import { landingPages } from "../../src/content/pages";
import { pageMeta, jsonLd } from "../../src/config/meta";
import { SITE_URL } from "../../src/config/site";
import {
  generate,
  LABELS,
  type Input,
} from "../../../../packages/core/src/index";
import { layoutPuzzle, toSVG } from "../../../../packages/render/src/index";
export const dynamicParams = false;
export function generateStaticParams() {
  return landingPages.map((p) => ({ slug: p.slug }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const p = landingPages.find((p) => p.slug === slug);
  if (!p) return {};
  return pageMeta({
    title: p.title,
    description: p.description,
    path: `/${slug}/`,
  });
}
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const p = landingPages.find((p) => p.slug === slug);
  if (!p) notFound();
  const isCrypto = p.type === "cryptogram";
  // Cryptogram pages carry the quote in `words`.
  const source = isCrypto ? { quote: p.words } : { words: p.words };
  let sample = "";
  try {
    sample = toSVG(
      layoutPuzzle(
        generate({
          type: p.type,
          ...source,
          title: p.title,
          seed: 4317,
          options: { autoSize: true } as Input["options"],
        }),
      )[0],
    );
  } catch {
    /* The maker reports placement limitations for the original words. */
  }
  const related = [
    ...landingPages.filter((o) => o.slug !== p.slug && o.type === p.type),
    ...landingPages.filter((o) => o.type !== p.type),
  ].slice(0, 9);
  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    url: `${SITE_URL}/${p.slug}/`,
    mainEntity: p.faq.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLd(faqLd)}
      />
      <section className="landing-intro">
        <div>
          <h1>{p.title}</h1>
          <p>{p.intro}</p>
        </div>
        {sample && (
          <figure className="sample-print">
            <div
              className="sheet"
              role="img"
              aria-label={copy.landingSampleLabel(p.title)}
              dangerouslySetInnerHTML={{
                __html: sample.replace(
                  / role="img" aria-label="[^"]*"/,
                  ' aria-hidden="true"',
                ),
              }}
            />
          </figure>
        )}
      </section>
      <Maker
        initialType={p.type}
        initialTitle={p.title}
        {...(isCrypto ? { initialQuote: p.words } : { initialWords: p.words })}
      />
      <article className="landing-notes">
        <section aria-labelledby="howto-heading" className="howto">
          <h2 id="howto-heading">{copy.landingHowTo(LABELS[p.type])}</h2>
          {p.body.map((para) => (
            <p key={para}>{para}</p>
          ))}
        </section>
        <div className="landing-side">
          <section aria-labelledby="tips-heading">
            <h2 id="tips-heading">{copy.landingTipsHeading}</h2>
            <ul className="tips">
              {p.tips.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </section>
          <section aria-labelledby="faq-heading" className="faq">
            <h2 id="faq-heading">{copy.landingFaqHeading}</h2>
            {p.faq.map((f) => (
              <div key={f.q}>
                <h3>{f.q}</h3>
                <p>{f.a}</p>
              </div>
            ))}
          </section>
        </div>
        <nav aria-labelledby="more-heading" className="more-pages">
          <h2 id="more-heading">{copy.landingMoreHeading}</h2>
          <ul className="browse-links">
            {related.map((o) => (
              <li key={o.slug}>
                <a href={`/${o.slug}/`}>
                  <span>{o.shortTitle}</span> <Arrow />
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </article>
    </>
  );
}
