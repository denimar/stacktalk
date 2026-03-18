import { mcpClient } from './mcp';

interface StandardSchema {
  '~standard': {
    jsonSchema: {
      input: (opts: { target: string }) => Record<string, unknown>;
    };
  };
  jsonSchema?: Record<string, unknown>;
}

function patchStandardSchema(schema: unknown): void {
  if (!schema || typeof schema !== 'object') return;
  const std = (schema as StandardSchema)['~standard'];
  if (!std?.jsonSchema?.input) return;
  if ('jsonSchema' in (schema as Record<string, unknown>)) return;
  try {
    (schema as StandardSchema).jsonSchema = std.jsonSchema.input({
      target: 'n',
    });
  } catch {
    // Schema conversion not available, skip
  }
}

export async function getMcpTools() {
  const tools = await mcpClient.listTools();
  for (const tool of Object.values(tools)) {
    patchStandardSchema(tool.inputSchema);
    patchStandardSchema(tool.outputSchema);
  }
  return tools;
}
