/**
 * Model Pricing Configuration
 * 模型定价配置（美元/百万 tokens）
 */

export const MODEL_COSTS = {
  // Claude Sonnet
  'claude-sonnet-4-5': { input: 3.00, output: 15.00, cacheRead: 0.30, cacheWrite: 3.75 },
  'claude-sonnet-4-6': { input: 3.00, output: 15.00, cacheRead: 0.30, cacheWrite: 3.75 },
  'anthropic/claude-sonnet-4-5': { input: 3.00, output: 15.00, cacheRead: 0.30, cacheWrite: 3.75 },
  'anthropic/claude-sonnet-4-6': { input: 3.00, output: 15.00, cacheRead: 0.30, cacheWrite: 3.75 },
  
  // Claude Opus
  'claude-opus-4': { input: 15.00, output: 75.00, cacheRead: 1.50, cacheWrite: 18.75 },
  'claude-opus-4-5': { input: 15.00, output: 75.00, cacheRead: 1.50, cacheWrite: 18.75 },
  'claude-opus-4-6': { input: 15.00, output: 75.00, cacheRead: 1.50, cacheWrite: 18.75 },
  'claude-opus-45': { input: 15.00, output: 75.00, cacheRead: 1.50, cacheWrite: 18.75 },
  'claude-opus-46': { input: 15.00, output: 75.00, cacheRead: 1.50, cacheWrite: 18.75 },
  'anthropic/claude-opus-4-5': { input: 15.00, output: 75.00, cacheRead: 1.50, cacheWrite: 18.75 },
  'anthropic/claude-opus-4-6': { input: 15.00, output: 75.00, cacheRead: 1.50, cacheWrite: 18.75 },
  
  // Kimi
  'kimi-k2.5': { input: 0.60, output: 2.40, cacheRead: 0.30, cacheWrite: 0.60 },
  'moonshot/kimi-k2.5': { input: 0.60, output: 2.40, cacheRead: 0.30, cacheWrite: 0.60 },
  
  // GPT/Codex
  'gpt-5.1': { input: 0.50, output: 2.00, cacheRead: 0.10, cacheWrite: 0.50 },
  'gpt-5.3-codex': { input: 0.50, output: 2.00, cacheRead: 0.10, cacheWrite: 0.50 },
  'openai-codex/gpt-5.3-codex': { input: 0.50, output: 2.00, cacheRead: 0.10, cacheWrite: 0.50 },
  
  // Qwen
  'qwen3.5-plus': { input: 0.20, output: 0.80, cacheRead: 0.02, cacheWrite: 0.20 },
  'dashscope/qwen3.5-plus': { input: 0.20, output: 0.80, cacheRead: 0.02, cacheWrite: 0.20 },
  'qwen/qwen3.5-plus': { input: 0.20, output: 0.80, cacheRead: 0.02, cacheWrite: 0.20 },
  
  // MiniMax
  'MiniMax-M2.5-highspeed': { input: 0.60, output: 2.40, cacheRead: 0.03, cacheWrite: 0.375 },
  'MiniMax-M2.5': { input: 0.30, output: 1.20, cacheRead: 0.03, cacheWrite: 0.375 },
  'MiniMax-M2.1': { input: 0.30, output: 1.20, cacheRead: 0.03, cacheWrite: 0.375 },
  
  // Embedding (usually $0 or minimal cost)
  'text-embedding-v4': { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
  
  // Delivery mirror (internal routing, no cost)
  'delivery-mirror': { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
};

/**
 * 获取模型定价，支持别名解析
 */
export function getModelCost(modelName) {
  // 直接匹配
  if (MODEL_COSTS[modelName]) {
    return MODEL_COSTS[modelName];
  }
  
  // 尝试提取基础名称（去掉 provider 前缀）
  const baseName = modelName.split('/').pop();
  if (MODEL_COSTS[baseName]) {
    return MODEL_COSTS[baseName];
  }
  
  // 默认使用 Sonnet 4.6 定价
  return MODEL_COSTS['claude-sonnet-4-6'];
}

/**
 * 列出所有已知的模型（用于显示或调试）
 */
export function listModels() {
  return Object.keys(MODEL_COSTS).sort();
}
