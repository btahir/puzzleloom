import Maker from "./Maker";
import {
  generate,
  DEFAULT_WORDS,
  type PuzzleType,
} from "../../../../packages/core/src/index";
import { layoutPuzzle, toSVG } from "../../../../packages/render/src/index";
export default function MakerServer({
  initialType = "crossword",
  initialWords = DEFAULT_WORDS,
  initialTitle = "In the garden",
}: {
  initialType?: PuzzleType;
  initialWords?: string;
  initialTitle?: string;
}) {
  try {
    const puzzle = generate({
      type: initialType,
      words: initialWords,
      title: initialTitle,
      seed: 4317,
    });
    const previews = {
      puzzle: layoutPuzzle(puzzle, false).map((s) => toSVG(s)),
      answer: layoutPuzzle(puzzle, true).map((s) => toSVG(s)),
    };
    return (
      <Maker
        initialType={initialType}
        initialWords={initialWords}
        initialTitle={initialTitle}
        initialPuzzle={puzzle}
        initialPreviews={previews}
      />
    );
  } catch {
    return (
      <Maker
        initialType={initialType}
        initialWords={initialWords}
        initialTitle={initialTitle}
      />
    );
  }
}
