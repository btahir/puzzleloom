import { copy } from "../../src/content/ui";
export const metadata = { title: "Puzzleloom for agents" };
export default function Page() {
  return (
    <article className="content-page prose">
      <p className="eyebrow">{copy.bringTheWordsWellBringTheGrid}</p>
      <h1>
        {copy.aPuzzleEngine} <br />
        {copy.yourAgentCanUse}{" "}
      </h1>
      <p className="lead">{copy.theCliLocalMcpServerAndWeb} </p>
      <h2>{copy.makeAPrintablePuzzle}</h2>
      <pre>
        <code>{copy.pnpmPuzzleloomMakeCrosswordWordsWordstxtSeed}</code>
      </pre>
      <p>{copy.wordFilesAcceptOneWordPerLine} </p>
      <h2>{copy.connectThroughMcp}</h2>
      <p>
        {copy.runTheLocalStdioServerWith} <code>{copy.pnpmMcp}</code>
        {copy.fromTheRepositoryToolsCreatepuzzleValidatepuzzleRenderpdf}{" "}
      </p>
      <h2>{copy.openHandoffs}</h2>
      <p>
        {copy.projectFilesUseThe}{" "}
        <a href="/puzzleloom.schema.json">
          {copy.puzzleloompuzzlev1JsonSchema}
        </a>
        {copy.importOneInTheMakerOrOpen}{" "}
      </p>
      <h2>{copy.predictableResults}</h2>
      <p>{copy.theSameWordsOptionsAndSeedProduce} </p>
      <p>
        <a href="/llms.txt">{copy.readTheCompactAgentReference}</a>
      </p>
    </article>
  );
}
