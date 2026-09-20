#!/usr/bin/env node
/**
 * Standalone stdio entry point for the published npm package.
 *
 * A published package has no database access, so this is a proxy: it connects
 * as an MCP client to the hosted Streamable HTTP endpoint with the user's API
 * key and re-exposes whatever tools that endpoint advertises over stdio.
 */
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";

const NAME = "getcited";
const VERSION = "0.1.0";
const DEFAULT_API_URL = "https://app.getcited.dev/api/mcp";

function fail(message: string): never {
  process.stderr.write(`${NAME}-mcp: ${message}\n`);
  process.exit(1);
}

function describe(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

function readApiUrl(): URL {
  const raw = process.env.SEO_API_URL?.trim() || DEFAULT_API_URL;
  try {
    return new URL(raw);
  } catch {
    return fail(`SEO_API_URL is not a valid URL: ${raw}`);
  }
}

export async function main(): Promise<void> {
  const apiKey = process.env.SEO_API_KEY?.trim();
  if (!apiKey) {
    fail(
      "SEO_API_KEY is not set. Create an API key in your GetCited settings and " +
        "pass it to this process, e.g. SEO_API_KEY=vseo_... npx getcited-mcp",
    );
  }

  const url = readApiUrl();
  const client = new Client({ name: `${NAME}-stdio-proxy`, version: VERSION });
  const remote = new StreamableHTTPClientTransport(url, {
    requestInit: { headers: { Authorization: `Bearer ${apiKey}` } },
  });

  try {
    await client.connect(remote);
  } catch (e) {
    fail(
      `could not connect to ${url.href}: ${describe(e)}. Check SEO_API_URL and that ` +
        "SEO_API_KEY is valid and not revoked.",
    );
  }

  const server = new Server({ name: NAME, version: VERSION }, { capabilities: { tools: {} } });

  // Forward verbatim: names, titles, descriptions, input schemas and annotations
  // are the remote server's to define.
  server.setRequestHandler(ListToolsRequestSchema, async (request) => {
    const { tools, nextCursor } = await client.listTools(request.params);
    return nextCursor === undefined ? { tools } : { tools, nextCursor };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    return await client.callTool(request.params);
  });

  const stdio = new StdioServerTransport();
  try {
    await server.connect(stdio);
  } catch (e) {
    await client.close().catch(() => {});
    fail(`could not start the stdio transport: ${describe(e)}`);
  }

  stdio.onclose = () => {
    void client.close().catch(() => {});
  };
  remote.onclose = () => {
    void server.close().catch(() => {});
  };
}

main().catch((e: unknown) => {
  fail(describe(e));
});
