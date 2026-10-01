import Player from "../../src/components/Player";
import { pageMeta } from "../../src/config/meta";
export const metadata = {
  ...pageMeta({
    title: "Play a puzzle",
    description:
      "Solve a crossword, word search, word scramble or cryptogram shared from Puzzleloom. The puzzle is stored in the link.",
    path: "/play/",
  }),
  robots: { index: false },
};
export default function Page() {
  return <Player />;
}
