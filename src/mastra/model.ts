type AgentId =
  | 'product-manager'
  | 'project-manager'
  | 'tech-lead'
  | 'product-designer'
  | 'frontend-developer'
  | 'backend-developer'
  | 'qa-engineer'
  | 'security-analyst'
  | 'technical-writer'
  | 'simple-request-resolver';

const openRouterBase = {
  url: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
  headers: {
    'HTTP-Referer': 'https://pipelord.dev',
    'X-Title': 'Pipelord',
  },
};

const agentModels: Record<AgentId, string> = {
  'product-manager': 'openrouter/auto',
  'project-manager': 'openrouter/auto',
  'tech-lead': 'openrouter/nvidia/nemotron-3-super-120b-a12b:free',
  'product-designer': 'openrouter/nvidia/nemotron-3-super-120b-a12b:free',
  'frontend-developer': 'openrouter/qwen/qwen3-coder:free',
  'backend-developer': 'openrouter/qwen/qwen3-coder:free',
  'qa-engineer': 'openrouter/auto',
  'security-analyst': 'openrouter/auto',
  'technical-writer': 'openrouter/auto',
  'simple-request-resolver': 'openrouter/auto',
};

export function getAgentModel(agentId: AgentId): {
  id: `${string}/${string}`;
  url: string;
  apiKey: string | undefined;
  headers: Record<string, string>;
} {
  return {
    ...openRouterBase,
    id: agentModels[agentId] as `${string}/${string}`,
  };
}
