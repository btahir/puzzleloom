import {
  generateDetailed,
  variants,
  type Input,
  type Puzzle,
} from "../../../../packages/core/src/index";
import {
  toPDF,
  layoutPuzzle,
  toSVG,
  type KeyMode,
} from "../../../../packages/render/src/index";
self.onmessage = async (
  event: MessageEvent<{
    id: number;
    action: "generate" | "pdf" | "image";
    input: Input;
    puzzle: Puzzle;
    count: number;
    mode: KeyMode;
    answer: boolean;
  }>,
) => {
  const { id, action } = event.data;
  try {
    if (action === "generate") {
      const { puzzle, warnings } = generateDetailed(event.data.input);
      let previews = { puzzle: [] as string[], answer: [] as string[] },
        layoutError = "";
      try {
        previews = {
          puzzle: layoutPuzzle(puzzle, false).map((s) => toSVG(s)),
          answer: layoutPuzzle(puzzle, true).map((s) => toSVG(s)),
        };
      } catch (e) {
        layoutError =
          e instanceof Error ? e.message : "Could not lay out this puzzle.";
      }
      self.postMessage({ id, puzzle, warnings, previews, layoutError });
    } else if (action === "image") {
      const sheets = layoutPuzzle(event.data.puzzle, event.data.answer);
      self.postMessage({
        id,
        images: sheets.map((s) => ({
          svg: toSVG(s, true),
          width: s.width,
          height: s.height,
        })),
      });
    } else {
      const bytes = await toPDF(
        variants(event.data.puzzle, event.data.count),
        event.data.mode,
      );
      self.postMessage({ id, bytes }, { transfer: [bytes.buffer] });
    }
  } catch (error) {
    self.postMessage({
      id,
      error:
        error instanceof Error ? error.message : "Could not make this puzzle.",
    });
  }
};

// Development bundlers load worker chunks asynchronously. Signal readiness before requests are sent.
self.postMessage({ ready: true });
