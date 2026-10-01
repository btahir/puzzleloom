import { copy } from "../../src/content/ui";
import { GITHUB_URL } from "../../src/config/site";
import { pageMeta } from "../../src/config/meta";
import {
  generate,
  DEFAULT_WORDS,
  type Input,
} from "../../../../packages/core/src/index";
import { layoutPuzzle, toSVG } from "../../../../packages/render/src/index";
export const metadata = pageMeta({
  title: "About and privacy",
  description:
    "How Puzzleloom works: puzzles are made in your browser with no account or upload, what the engine checks before printing, and the licences behind it.",
  path: "/about/",
});
function sheets() {
  try {
    const p = generate({
      type: "crossword",
      words: DEFAULT_WORDS,
      title: "In the garden",
      seed: 4317,
      options: { autoSize: true } as Input["options"],
    });
    const clean = (svg: string) =>
      svg.replace(/ role="img" aria-label="[^"]*"/, ' aria-hidden="true"');
    return [
      clean(toSVG(layoutPuzzle(p, false)[0])),
      clean(toSVG(layoutPuzzle(p, true)[0])),
    ];
  } catch {
    return [];
  }
}
export default function Page() {
  const pair = sheets();
  return (
    <article className="content-page prose">
      <h1>{copy.aboutTitle}</h1>
      <p className="lead">{copy.aboutLead}</p>
      {pair.length === 2 && (
        <figure
          className="sheet-pair"
          role="img"
          aria-label={copy.aboutSampleAlt}
        >
          {pair.map((svg, i) => (
            <div
              key={i}
              className="sheet"
              dangerouslySetInnerHTML={{ __html: svg }}
            />
          ))}
        </figure>
      )}
      <h2>{copy.aboutPrivacyHeading}</h2>
      {copy.aboutPrivacy.map((t) => (
        <p key={t}>{t}</p>
      ))}
      <h2>{copy.aboutChecksHeading}</h2>
      {copy.aboutChecks.map((t) => (
        <p key={t}>{t}</p>
      ))}
      <h2>{copy.aboutPrintHeading}</h2>
      <p>{copy.aboutPrint}</p>
      <h2>{copy.aboutCreditsHeading}</h2>
      {copy.aboutCredits.map((t) => (
        <p key={t}>{t}</p>
      ))}
      <p className="link-row">
        <a href={GITHUB_URL}>{copy.readTheSource}</a>
        <a href="/support/">{copy.supportLink}</a>
      </p>
    </article>
  );
}
