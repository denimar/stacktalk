import { MCPClient } from '@mastra/mcp';

export const mcpClient = new MCPClient({
  id: 'pipelord-mcp',
  servers: {
    playwright: {
      command: 'npx',
      args: ['-y', '@playwright/mcp@latest'],
    },
    filesystem: {
      command: 'npx',
      args: [
        '-y',
        '@modelcontextprotocol/server-filesystem',
        '/home/denimar/projects',
      ],
    },
    github: {
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-github'],
      env: {
        GITHUB_PERSONAL_ACCESS_TOKEN:
          process.env.GITHUB_PERSONAL_ACCESS_TOKEN || process.env.GH_PERSONAL_ACCESS_TOKEN || '',
      },
    },
    postgres: {
      command: 'npx',
      args: [
        '-y',
        '@modelcontextprotocol/server-postgres',
        process.env.DATABASE_URL ??
          'postgresql://postgres:MLUzJxHWSK3YcbeP@localhost:5435/pipelord',
      ],
    },
    fetch: {
      command: '/home/denimar/.local/bin/uvx',
      args: ['mcp-server-fetch'],
    },
    'er-diagram': {
      command: 'node',
      args: [
        '/home/denimar/projects/personal/mcp-er-diagram/dist/index.js',
      ],
    },
    email: {
      command: 'node',
      args: ['/home/denimar/projects/personal/mcp-email/dist/index.js'],
      env: {
        RESEND_API_KEY: process.env.RESEND_API_KEY ?? '',
        RESEND_FROM:
          process.env.RESEND_FROM ?? 'Pipelord <onboarding@resend.dev>',
      },
    },
    imagegen: {
      command: 'npx',
      args: ['-y', 'imagegen-mcp-server'],
      env: {
        OPENAI_API_KEY: process.env.OPENAI_API_KEY ?? '',
        OUTPUT_DIR:
          '/home/denimar/projects/personal/bossai/public/generated-images',
      },
    },
    markdown2pdf: {
      command: 'npx',
      args: ['-y', '@99xio/markdown2pdf-mcp'],
      env: {
        M2P_OUTPUT_DIR: '/home/denimar/projects/personal/bossai/exports',
      },
    },
  },
  timeout: 60000,
});
