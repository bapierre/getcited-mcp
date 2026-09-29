# GetCited MCP connector

[![GetCited MCP server on Glama](https://glama.ai/mcp/servers/bapierre/getcited-mcp/badges/score.svg)](https://glama.ai/mcp/servers/bapierre/getcited-mcp)

Client-side pieces for connecting a coding agent to [GetCited](https://getcited.dev):
the MCP server definition, a Claude Code plugin with its skills, a Gemini CLI
extension, and a small stdio proxy for clients that cannot speak Streamable HTTP.

GetCited audits a site the way an answer engine reads it, tracks where it ranks,
records which AI engines cite it, and files each measured problem as an action
with the evidence behind it. It never proposes the fix: your agent has the
repository open and it does not.

The service itself is closed source. Everything in this repository is the
connector — transport, manifests and prompts — so you can read exactly what your
agent is being told and what leaves your machine.

## Connect

Create a key under **Settings → API keys** in the app, then pick your client.

**Claude Code**

```bash
claude mcp add --transport http getcited https://app.getcited.dev/api/mcp \
  --header "Authorization: Bearer $SEO_API_KEY"
```

**Any client that reads a JSON config**

```json
{
  "mcpServers": {
    "getcited": {
      "type": "http",
      "url": "https://app.getcited.dev/api/mcp",
      "headers": { "Authorization": "Bearer ${SEO_API_KEY}" }
    }
  }
}
```

**Gemini CLI**

```bash
gemini extensions install https://github.com/bapierre/getcited-mcp
```

**Clients without a remote transport** (Claude Desktop, whose config takes a
command rather than a URL) use the stdio proxy in `src/`:

```bash
claude mcp add getcited --env SEO_API_KEY="vseo_..." -- npx -y getcited-mcp
```

| Variable | Required | Meaning |
| --- | --- | --- |
| `SEO_API_KEY` | yes | The key from Settings → API keys. |
| `SEO_API_URL` | no | Endpoint override. Defaults to `https://app.getcited.dev/api/mcp`. |

`llms-install.md` is the same instructions written for an agent, so you can tell
your assistant to set this up rather than doing it yourself.

## What is in here

| Path | What it is |
| --- | --- |
| `src/stdio.ts` | The stdio proxy. Forwards JSON-RPC to the HTTPS endpoint and nothing else. |
| `.claude-plugin/`, `skills/` | The Claude Code plugin and its two skills. |
| `gemini-extension.json` | The Gemini CLI extension manifest. |
| `.mcp.json` | A project-scoped Claude Code server entry. |
| `llms-install.md` | Setup instructions addressed to an agent. |

## The tools

Sites (`list_projects`, `add_project`, `remove_project`, `get_site_health`),
onboarding and profile (`get_setup_status`, `get_project_profile`,
`set_project_profile`), the queue (`get_next_work`, `list_actions`,
`get_action`, `claim_action`, `complete_action`, `dismiss_action`,
`run_audit`), growth (`list_opportunities`, `get_content_brief`,
`list_regressions`, `get_page_history`), rankings (`add_keywords`,
`list_keywords`, `rank_history`, `check_rankings`), AI visibility
(`add_geo_prompts`, `geo_summary`, `check_geo`, `run_brain`) and visitors
(`get_behavior_digest`, `get_page_profile`).

Each tool carries a `title` and the `readOnlyHint` or `destructiveHint`
annotation that matches what it does. Full documentation, including what every
number means and the rules the measurements follow:
<https://getcited.dev/docs/mcp>.

## Registry

Listed in the official MCP Registry as `dev.getcited/mcp`, published under a
DNS-verified namespace.

## Support

[getcited.dev/support](https://getcited.dev/support) ·
[privacy](https://getcited.dev/privacy) ·
[terms](https://getcited.dev/terms) · MIT licensed.
