import Maker from "./Maker";
import {
  generate,
  DEFAULT_WORDS,
  QUOTES,
  type Input,
  type PuzzleType,
} from "../../../../packages/core/src/index";
import { layoutPuzzle, toSVG } from "../../../../packages/render/src/index";
/** Renders the maker with a first puzzle already laid out, so the preview is in the static HTML. */
export default function MakerServer({
  initialType = "crossword",
  initialWords = DEFAULT_WORDS,
  initialTitle = "In the garden",
  initialQuote = QUOTES[0],
}: {
  initialType?: PuzzleType;
  initialWords?: string;
  initialTitle?: string;
  initialQuote?: string;
}) {
  const props = { initialType, initialWords, initialTitle, initialQuote };
  try {
    const puzzle = generate({
      type: initialType,
      words: initialWords,
      quote: initialQuote,
      title: initialTitle,
      seed: 4317,
      // Match the client default: the engine picks the grid size.
      options: { autoSize: true } as Input["options"],
    });
    const previews = {
      puzzle: layoutPuzzle(puzzle, false).map((s) => toSVG(s)),
      answer: layoutPuzzle(puzzle, true).map((s) => toSVG(s)),
    };
    return (
      <Maker {...props} initialPuzzle={puzzle} initialPreviews={previews} />
    );
  } catch {
    return <Maker {...props} />;
  }
}
