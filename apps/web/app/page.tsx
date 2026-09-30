import { copy } from "../src/content/ui";
import { Arrow } from "../src/components/Icon";
import Maker from "../src/components/MakerServer";
import { landingPages } from "../src/content/pages";
export default function Home() {
  return (
    <>
      <section className="hero">
        <div>
          <p className="eyebrow">
            <span />
            {copy.madeForCuriousMinds}{" "}
          </p>
          <h1>
            {copy.yourWords2} <br />
            {copy.aWorldOf} <em>{copy.puzzles}</em>
          </h1>
          <p className="hero-description">
            {copy.turnAWordListIntoALittle} <br />
            {copy.beautifulPuzzlesToPrintShareAndSolve}{" "}
          </p>
        </div>
        <div className="hero-aside">
          <div className="tile-doodle" aria-hidden="true">
            <span>G</span>
            <span>R</span>
            <span>O</span>
            <span>W</span>
            <span className="tile-down">R</span>
            <span className="tile-down two">D</span>
          </div>
          <p>
            {copy.noAccountNoPaywall} <br />
            {copy.justYouAndAGoodPuzzle}{" "}
          </p>
        </div>
      </section>
      <Maker />
      <section className="below-maker">
        <p className="eyebrow">{copy.fromABlankPageToABright}</p>
        <h2>{copy.aSmallThingThatMakesAGood}</h2>
        <div className="use-cases">
          <article>
            <span>{copy.text01TheClassroom}</span>
            <h3>{copy.aLessonWorthPuzzlingOver}</h3>
            <p>{copy.vocabularySpellingOrANewTopicMake} </p>
          </article>
          <article>
            <span>{copy.text02TheEveryday}</span>
            <h3>{copy.makeALittleRoomForPlay}</h3>
            <p>{copy.aRainyAfternoonABirthdayTableA} </p>
          </article>
          <article>
            <span>{copy.text03YourPeaceOfMind}</span>
            <h3>{copy.yourWordsStayYours}</h3>
            <p>{copy.puzzlesAreMadeRightInYourBrowser} </p>
          </article>
        </div>
        <div className="browse-top">
          <h2>{copy.aPlaceToBegin}</h2>
          <p>{copy.readytouseIdeasAllEasyToMakeYour}</p>
        </div>
        <div className="browse-links">
          {landingPages.slice(0, 12).map((p) => (
            <a href={`/${p.slug}/`} key={p.slug}>
              {p.shortTitle} <Arrow />
            </a>
          ))}
        </div>
      </section>
    </>
  );
}
