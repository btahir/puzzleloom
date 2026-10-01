import { copy } from "../src/content/ui";
export const metadata = { title: "Page not found", robots: { index: false } };
export default function NotFound() {
  return (
    <div className="content-page">
      <h1>{copy.notFoundTitle}</h1>
      <p>{copy.notFoundBody}</p>
      <p className="button-row">
        <a href="/" className="button primary">
          {copy.backToMaker}
        </a>
      </p>
    </div>
  );
}
