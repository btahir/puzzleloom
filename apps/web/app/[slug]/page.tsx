import { copy } from "../../src/content/ui";
import { notFound } from "next/navigation";
import Maker from "../../src/components/MakerServer";
import { landingPages } from "../../src/content/pages";
import { generate } from "../../../../packages/core/src/index";
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
  return {
    title: p?.title,
    description: p?.intro,
    alternates: { canonical: `/${slug}/` },
  };
}
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const p = landingPages.find((p) => p.slug === slug);
  if (!p) notFound();
  let sample = "";
  try {
    sample = toSVG(
      layoutPuzzle(
        generate({ type: p.type, words: p.words, title: p.title, seed: 4317 }),
      )[0],
    );
  } catch {
    /* The maker reports placement limitations for the original words. */
  }
  return (
    <>
      <section className="landing-intro">
        <div>
          <p className="eyebrow">{copy.aGoodPlaceToBegin}</p>
          <h1>{p.title}</h1>
          <p>{p.intro}</p>
        </div>
        {sample && (
          <div
            className="sample-print"
            dangerouslySetInnerHTML={{ __html: sample }}
          />
        )}
      </section>
      <Maker
        initialType={p.type}
        initialWords={p.words}
        initialTitle={p.title}
      />
      <section className="landing-notes">
        <h2>{copy.makeThisOneYourOwn}</h2>
        <ul>
          {p.tips.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
        <h2>{copy.aPageAPencilALittlePossibility}</h2>
        <p>{copy.useTheStarterListAsisOrReplace} </p>
        <p>
          {copy.needAnotherIdea}{" "}
          <a href="/">{copy.exploreAllFourPuzzleTypes}</a>
        </p>
      </section>
    </>
  );
}
