#!/usr/bin/env node
// Starts the built proxy without SEO_API_KEY, the way a registry introspects it,
// and checks it lists the bundled tools and refuses calls. Used by CI.
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { TOOL_SNAPSHOT } from "../dist/tool-snapshot.js";

const env = { ...process.env };
delete env.SEO_API_KEY;
const client = new Client({ name: "check-offline", version: "0.0.0" });
await client.connect(
  new StdioClientTransport({ command: process.execPath, args: ["dist/stdio.js"], env, stderr: "ignore" }),
);
const { tools } = await client.listTools();
const call = await client.callTool({ name: "list_projects", arguments: {} });
await client.close();

if (tools.length === 0 || tools.length !== TOOL_SNAPSHOT.length) {
  throw new Error(`expected ${TOOL_SNAPSHOT.length} tools, got ${tools.length}`);
}
if (call.isError !== true) throw new Error("a call without a key should fail");
console.log(`ok: ${tools.length} tools listed without a key, calls refused`);
