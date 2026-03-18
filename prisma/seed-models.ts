import { readFileSync } from "fs";
import { join } from "path";
import { llmModels } from "./seed-llm-models";

interface OpenRouterRawModel {
  slug: string;
  name: string;
  short_name: string;
  author: string;
  description: string;
  context_length: number;
  input_modalities: string[];
  output_modalities: string[];
  group: string;
  supports_reasoning: boolean;
  permaslug: string;
  endpoint?: {
    max_prompt_tokens: number | null;
    max_completion_tokens: number | null;
    is_free: boolean;
    pricing?: {
      prompt: string;
      completion: string;
      image?: string;
      request?: string;
      input_cache_read?: string;
      input_cache_write?: string;
      web_search?: string;
      internal_reasoning?: string;
    };
  };
}

interface OpenRouterModelSeed {
  slug: string;
  name: string;
  shortName: string;
  author: string;
  description: string;
  contextLength: number;
  maxPromptTokens: number | null;
  maxCompletionTokens: number | null;
  inputModalities: string[];
  outputModalities: string[];
  group: string;
  supportsReasoning: boolean;
  promptPrice: string;
  completionPrice: string;
  imagePrice: string;
  requestPrice: string;
  inputCacheReadPrice: string;
  inputCacheWritePrice: string;
  webSearchPrice: string;
  internalReasoningPrice: string;
  isFree: boolean;
  permaslug: string;
}

function loadFallbackModels(): OpenRouterModelSeed[] {
  return llmModels.map((m) => ({
    slug: `${m.provider}/${m.code}`,
    name: m.name,
    shortName: m.name,
    author: m.provider,
    description: m.description,
    contextLength: m.contextWindow,
    maxPromptTokens: null,
    maxCompletionTokens: m.maxOutput,
    inputModalities: m.supportsVision ? ["text", "image"] : ["text"],
    outputModalities: ["text"],
    group: m.provider,
    supportsReasoning: m.category === "reasoning",
    promptPrice: "0",
    completionPrice: "0",
    imagePrice: "0",
    requestPrice: "0",
    inputCacheReadPrice: "0",
    inputCacheWritePrice: "0",
    webSearchPrice: "0",
    internalReasoningPrice: "0",
    isFree: false,
    permaslug: m.code,
  }));
}

function loadOpenRouterModels(): OpenRouterModelSeed[] {
  const filePath = join(__dirname, "..", "openrouter-models.json");
  let raw: Record<string, OpenRouterRawModel[]>;
  try {
    raw = JSON.parse(readFileSync(filePath, "utf-8")) as Record<string, OpenRouterRawModel[]>;
  } catch {
    console.log("openrouter-models.json not found, using fallback LLM models");
    return loadFallbackModels();
  }
  const models: OpenRouterModelSeed[] = [];
  const seenSlugs = new Set<string>();
  for (const provider of Object.keys(raw)) {
    for (const model of raw[provider]) {
      if (seenSlugs.has(model.slug)) continue;
      seenSlugs.add(model.slug);
      models.push({
        slug: model.slug,
        name: model.name,
        shortName: model.short_name || model.name,
        author: model.author,
        description: model.description || "",
        contextLength: model.context_length,
        maxPromptTokens: model.endpoint?.max_prompt_tokens ?? null,
        maxCompletionTokens: model.endpoint?.max_completion_tokens ?? null,
        inputModalities: model.input_modalities || [],
        outputModalities: model.output_modalities || [],
        group: model.group || "",
        supportsReasoning: model.supports_reasoning ?? false,
        promptPrice: model.endpoint?.pricing?.prompt || "0",
        completionPrice: model.endpoint?.pricing?.completion || "0",
        imagePrice: model.endpoint?.pricing?.image || "0",
        requestPrice: model.endpoint?.pricing?.request || "0",
        inputCacheReadPrice: model.endpoint?.pricing?.input_cache_read || "0",
        inputCacheWritePrice: model.endpoint?.pricing?.input_cache_write || "0",
        webSearchPrice: model.endpoint?.pricing?.web_search || "0",
        internalReasoningPrice: model.endpoint?.pricing?.internal_reasoning || "0",
        isFree: model.endpoint?.is_free ?? false,
        permaslug: model.permaslug || "",
      });
    }
  }
  return models;
}

export const openRouterModels = loadOpenRouterModels();
