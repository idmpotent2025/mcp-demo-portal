import { NextRequest } from 'next/server'
import { streamText, jsonSchema, tool } from 'ai'
import { openai } from '@ai-sdk/openai'
import { Client, StreamableHTTPClientTransport } from '@modelcontextprotocol/client'
import { getSession } from '@/lib/session'
import { getPortal } from '@/lib/portals'

export const maxDuration = 60

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ portal: string }> },
) {
  const { portal: portalSlug } = await params
  const portal = getPortal(portalSlug)

  if (!portal) {
    return new Response('Unknown portal', { status: 404 })
  }

  const session = await getSession(portalSlug)
  if (!session) {
    return new Response('Unauthorized', { status: 401 })
  }

  const { messages } = await req.json()

  const mcpBaseUrl = process.env.MCP_SERVER_BASE_URL!
  const mcpUrl = `${mcpBaseUrl}/api/mcp/${portal.mcpPath}`

  const mcpClient = new Client({ name: 'mcp-demo-portal', version: '1.0.0' })

  const transport = new StreamableHTTPClientTransport(new URL(mcpUrl), {
    requestInit: {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
      },
    },
  })

  await mcpClient.connect(transport)

  let toolsResult
  try {
    toolsResult = await mcpClient.listTools()
  } catch (err) {
    await mcpClient.close()
    console.error('Failed to list MCP tools', err)
    return new Response('Failed to connect to MCP server', { status: 502 })
  }

  // Convert MCP tools → Vercel AI SDK tool format
  const aiTools: Record<string, ReturnType<typeof tool>> = {}

  for (const t of toolsResult.tools) {
    const schema = (t.inputSchema ?? { type: 'object', properties: {} }) as Record<string, unknown>
    aiTools[t.name] = tool({
      description: t.description ?? t.name,
      parameters: jsonSchema(schema as Parameters<typeof jsonSchema>[0]),
      execute: async (args) => {
        const result = await mcpClient.callTool({ name: t.name, arguments: args })
        return result.content
      },
    })
  }

  const result = streamText({
    model: openai('gpt-4o'),
    system: portal.systemPrompt,
    messages,
    tools: aiTools,
    maxSteps: 10,
    onFinish: async () => {
      await mcpClient.close()
    },
  })

  return result.toDataStreamResponse()
}
