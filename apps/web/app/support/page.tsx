import { copy } from "../../src/content/ui";
import { DONATION_LINKS } from "../../src/config/site";
export const metadata = { title: "Support Puzzleloom" };
export default function Page() {
  return (
    <article className="content-page prose support-page">
      <p className="eyebrow">{copy.aLittleKindnessGoesALongWay}</p>
      <h1>
        {copy.keepTheGood} <br />
        {copy.puzzlesComing}{" "}
      </h1>
      <p className="lead">{copy.everyPuzzleEveryAnswerKeyEveryClass} </p>
      <p>{copy.ifPuzzleloomSavedYouTimeOrMade} </p>
      <a
        className="primary button"
        href={DONATION_LINKS.once}
        rel="noopener noreferrer"
      >
        {copy.makeAOnetimeContribution}{" "}
      </a>
      <h2>{copy.orLendAHandEachMonth}</h2>
      <div className="donation-tiers">
        {DONATION_LINKS.monthly.map((t) => (
          <a href={t.href} key={t.label} rel="noopener noreferrer">
            <strong>
              {t.label}
              <small>{copy.month}</small>
            </strong>
            <span>{t.note} ↗</span>
          </a>
        ))}
      </div>
      <p className="help">{copy.contributionsAreOptionalAndDoNotUnlock} </p>
      <p>{copy.sharingAPuzzleWithATeacherOr} </p>
      <a href="/">{copy.backToMakingPuzzles}</a>
    </article>
  );
}
