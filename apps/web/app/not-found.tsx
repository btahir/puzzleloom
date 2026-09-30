import { copy } from "../src/content/ui";
export default function NotFound() {
  return (
    <div className="content-page">
      <h1>{copy.thisPageWanderedOff}</h1>
      <p>{copy.letsFindYouAGoodPuzzleInstead}</p>
      <a href="/" className="button">
        {copy.backToTheMaker}{" "}
      </a>
    </div>
  );
}
