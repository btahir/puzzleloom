import Maker from "./Maker";
import {
  generate,
  DEFAULT_WORDS,
  QUOTES,
  type Input,
  type Options,
  type PuzzleType,
} from "../../../../packages/core/src/index";
import { layoutPuzzle, toSVG } from "../../../../packages/render/src/index";
/** Renders the maker with a first puzzle already laid out, so the preview is in the static HTML. */
export default function MakerServer({
  initialType = "crossword",
  initialWords = DEFAULT_WORDS,
  initialTitle = "In the garden",
  initialQuote = QUOTES[0],
  initialOptions,
}: {
  initialType?: PuzzleType;
  initialWords?: string;
  initialTitle?: string;
  initialQuote?: string;
  initialOptions?: Partial<Options>;
}) {
  const props = {
    initialType,
    initialWords,
    initialTitle,
    initialQuote,
    initialOptions,
  };
  try {
    const puzzle = generate({
      type: initialType,
      words: initialWords,
      quote: initialQuote,
      title: initialTitle,
      seed: 4317,
      // Match the client default: the engine picks the grid size.
      options: {
        ...initialOptions,
        autoSize: !initialOptions?.size,
      } as Input["options"],
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
