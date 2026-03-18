import { fileURLToPath } from 'url';
import path from 'path';
import { Mastra } from '@mastra/core/mastra';
import { PinoLogger } from '@mastra/loggers';
import { LibSQLStore } from '@mastra/libsql';
import { Observability, DefaultExporter, CloudExporter, SensitiveDataFilter } from '@mastra/observability';

import { productManagerAgent } from './agents/product-manager-agent';
import { projectManagerAgent } from './agents/project-manager-agent';
import { techLeadAgent } from './agents/tech-lead-agent';
import { productDesignerAgent } from './agents/product-designer-agent';
import { frontendDeveloperAgent } from './agents/frontend-developer-agent';
import { backendDeveloperAgent } from './agents/backend-developer-agent';
import { qaEngineerAgent } from './agents/qa-engineer-agent';
import { securityAnalystAgent } from './agents/security-analyst-agent';
import { technicalWriterAgent } from './agents/technical-writer-agent';
import { simpleRequestResolverAgent } from './agents/simple-request-resolver-agent';
import { mcpClient } from './mcp';
import { pipelineWorkflow } from './workflows/pipeline-workflow';
import { subtaskWorkflow } from './workflows/subtask-workflow';
import { simpleRequestWorkflow } from './workflows/simple-request-workflow';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../..');

export const mastra = new Mastra({
  server: {
    timeout: 15 * 60 * 1000, // 15 minutes
  },
  workflows: {
    pipelineWorkflow,
    subtaskWorkflow,
    simpleRequestWorkflow,
  },
  agents: {
    productManagerAgent,
    projectManagerAgent,
    techLeadAgent,
    productDesignerAgent,
    frontendDeveloperAgent,
    backendDeveloperAgent,
    qaEngineerAgent,
    securityAnalystAgent,
    technicalWriterAgent,
    simpleRequestResolverAgent,
  },
  scorers: {},
  storage: new LibSQLStore({
    id: 'mastra-storage',
    url: `file:${path.join(projectRoot, 'mastra.db')}`,
  }),
  logger: new PinoLogger({
    name: 'Mastra',
    level: 'info',
  }),
  observability: new Observability({
    configs: {
      default: {
        serviceName: 'mastra',
        exporters: [
          new DefaultExporter(),
          new CloudExporter(),
        ],
        spanOutputProcessors: [
          new SensitiveDataFilter(),
        ],
      },
    },
  }),
});

export { mcpClient };
