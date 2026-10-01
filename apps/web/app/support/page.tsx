import { copy } from "../../src/content/ui";
import { DONATION_LINKS } from "../../src/config/site";
import { pageMeta } from "../../src/config/meta";
import { Arrow } from "../../src/components/Icon";
export const metadata = pageMeta({
  title: "Support Puzzleloom",
  description:
    "Puzzleloom is free with nothing locked: answer keys, class sets and large print included. A one-time or monthly contribution pays for upkeep.",
  path: "/support/",
});
export default function Page() {
  return (
    <article className="content-page prose support-page">
      <h1>{copy.supportTitle}</h1>
      <p className="lead">{copy.supportLead}</p>
      <p>{copy.supportBody}</p>
      <a
        className="primary button"
        href={DONATION_LINKS.once}
        rel="noopener noreferrer"
      >
        {copy.supportOnce} <Arrow />
      </a>
      <h2>{copy.supportMonthlyHeading}</h2>
      <ul className="donation-tiers">
        {DONATION_LINKS.monthly.map((t) => (
          <li key={t.label}>
            <a href={t.href} rel="noopener noreferrer">
              <strong>
                {t.label}
                <small> {copy.perMonth}</small>
              </strong>
              <span>
                {t.note} <Arrow />
              </span>
            </a>
          </li>
        ))}
      </ul>
      <p className="help">{copy.supportFinePrint}</p>
      <p>{copy.supportOtherWays}</p>
      <p>
        <a href="/">{copy.backToMaking}</a>
      </p>
    </article>
  );
}
