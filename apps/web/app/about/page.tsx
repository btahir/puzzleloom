import { copy } from "../../src/content/ui";
import { GITHUB_URL } from "../../src/config/site";
export const metadata = { title: "About & privacy" };
export default function Page() {
  return (
    <article className="content-page prose">
      <p className="eyebrow">{copy.aWellkeptTeachersDesk}</p>
      <h1>
        {copy.goodPuzzles} <br />
        {copy.nothingInTheWay}{" "}
      </h1>
      <p className="lead">{copy.puzzleloomTurnsYourWordsIntoSomethingYou} </p>
      <img
        src="/desk-art.png"
        alt={copy.originalIllustrationOfPrintableWordPuzzlesAnd}
        width="1536"
        height="1024"
        className="about-art"
      />
      <h2>{copy.privateByDesign}</h2>
      <p>{copy.theresNoAccountDatabaseAnalyticsOrUpload} </p>
      <p>{copy.aPlayLinkContainsThePuzzleAnd} </p>
      <h2>{copy.whatTheEngineChecks}</h2>
      <p>{copy.crosswordsMustConnectWithNoStrayAdjacent} </p>
      <p>{copy.someWordListsCannotMakeAConnected} </p>
      <h2>{copy.printFirst}</h2>
      <p>{copy.thePreviewAndPdfComeFromOne} </p>
      <h2>{copy.creditsLicences}</h2>
      <p>{copy.puzzleloomIsMitLicensedYoungSerifAtkinson} </p>
      <p>{copy.exampleWordListsAndOriginalQuotesAre} </p>
      <p>
        <a href={GITHUB_URL}>{copy.readTheSource}</a> ·{" "}
        <a href="/support/">{copy.helpKeepItFree}</a>
      </p>
    </article>
  );
}
