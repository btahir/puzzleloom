import { copy } from "../../src/content/ui";
import { pageMeta } from "../../src/config/meta";
export const metadata = pageMeta({
  title: "CLI and MCP for AI assistants",
  description:
    "Drive Puzzleloom from an AI assistant: a deterministic CLI and a local MCP server make crosswords and word searches, print PDFs and check answer keys.",
  path: "/agents/",
});
export default function Page() {
  return (
    <article className="content-page prose">
      <h1>{copy.agentsTitle}</h1>
      <p className="lead">{copy.agentsLead}</p>
      <h2>{copy.agentsCliHeading}</h2>
      <pre>
        <code>{copy.agentsCli}</code>
      </pre>
      <p>{copy.agentsCliNote}</p>
      <h2>{copy.agentsMcpHeading}</h2>
      <p>
        {copy.agentsMcpBefore} <code>{copy.agentsMcpCommand}</code>
        {copy.agentsMcpAfter}
      </p>
      <h2>{copy.agentsHandoffHeading}</h2>
      <p>
        {copy.agentsHandoffBefore}{" "}
        <a href="/puzzleloom.schema.json">{copy.agentsSchemaLink}</a>
        {copy.agentsHandoffAfter}
      </p>
      <h2>{copy.agentsDeterminismHeading}</h2>
      <p>{copy.agentsDeterminism}</p>
      <p>
        <a href="/llms.txt">{copy.agentsLlmsLink}</a>
      </p>
    </article>
  );
}
