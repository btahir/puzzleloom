import { copy } from "../src/content/ui";
import { Arrow } from "../src/components/Icon";
import Maker from "../src/components/MakerServer";
import { landingPages } from "../src/content/pages";
import { pageMeta } from "../src/config/meta";

export const metadata = pageMeta({
  title: "Puzzleloom: free crossword, word search and cryptogram maker",
  description:
    "Make a crossword, word search, word scramble or cryptogram from your own word list. Free printable PDF with answer keys and class sets. No account, nothing uploaded.",
  path: "/",
  absoluteTitle: true,
});

export default function Home() {
  return (
    <>
      <section className="page-title">
        <h1>{copy.homeTitle}</h1>
        <p>{copy.homeSubtitle}</p>
      </section>
      <Maker />
      <section className="pitch" aria-labelledby="pitch-heading">
        <div className="pitch-head">
          <h2 id="pitch-heading">{copy.pitchHeading}</h2>
          <p>{copy.pitchIntro}</p>
        </div>
        <dl className="pitch-list">
          {copy.pitch.map((item) => (
            <div key={item.title}>
              <dt>{item.title}</dt>
              <dd>
                <p>{item.body}</p>
                {"example" in item && (
                  <p className="pitch-example">{item.example}</p>
                )}
                {"link" in item && (
                  <a className="pitch-link" href={item.link.href}>
                    {item.link.label} <Arrow />
                  </a>
                )}
              </dd>
            </div>
          ))}
        </dl>
      </section>
      <section className="ready-lists" aria-labelledby="ready-heading">
        <div className="pitch-head">
          <h2 id="ready-heading">{copy.readyListsHeading}</h2>
          <p>{copy.readyListsIntro}</p>
        </div>
        <ul className="browse-links">
          {landingPages.map((p) => (
            <li key={p.slug}>
              <a href={`/${p.slug}/`}>
                <span>{p.shortTitle}</span> <Arrow />
              </a>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
