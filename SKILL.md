---
name: usage-tracker
description: Track OpenClaw token usage and cost from session transcripts. Use when Codex needs to report usage statistics, calculate costs, or show spending summaries. Provides quick CLI access to usage data without requiring browser or OAuth.
---

# Usage Tracker

快速统计 OpenClaw token 使用量和成本，直接从 session transcript 文件计算。

## Quick Usage

```bash
# 查看今天的详细用量（默认）
node scripts/usage-report.js
node scripts/usage-report.js --today

# 查看昨天
node scripts/usage-report.js --yesterday

# 指定日期
node scripts/usage-report.js --date=2026-02-17

# 查看最近 7 天
node scripts/usage-report.js --days=7

# 只看当前 session（最近活跃的 session 文件）
node scripts/usage-report.js --session

# 简洁输出（不分模型）
node scripts/usage-report.js --days=7 --simple
```

## 输出示例

### 详细输出（默认）

```
💸 Daily Usage Report (2026-02-18 - Today)
================================================================================

📊 claude-sonnet-4-5
   Messages: 116
   Input:          1.2k tokens  →  $0.00
   Output:        47.6k tokens  →  $0.71
   CacheRead:      5.0m tokens  →  $1.50
   CacheWrite:     1.4m tokens  →  $5.28
   💾 Cache Hit Rate: 99.8%
   Total:          6.5m tokens  →  $7.50

📊 moonshot/kimi-k2.5
   Messages: 42
   Input:        813.3k tokens  →  $0.49
   Output:         6.2k tokens  →  $0.01
   CacheRead:    303.6k tokens  →  $0.09
   💾 Cache Hit Rate: 27.2%
   Total:          1.1m tokens  →  $0.59

================================================================================
💰 Grand Total: $7.50 · 6.5m tokens · 124 messages
💾 Overall Cache Hit Rate: 80.4%
📈 Average: $0.06 per message
```

### 简洁输出（--simple）

```
💸 Usage Report (Last 7 days)

Total: $208.97 · 258.1m tokens
Messages: 3765
Cache Hit Rate: 94.9%
Average: $0.06 per message
```

## 工作原理

1. **读取 session transcripts** - 扫描 `~/.openclaw/agents/*/sessions/*.jsonl`
2. **基于 timestamp 过滤** - 读取每条消息的 `timestamp` 字段（UTC），转换到 Asia/Shanghai 时区后按日期过滤
3. **提取 usage 数据** - 从每条 assistant 消息中提取 token 使用量
4. **计算成本** - 基于模型定价（input/output/cacheRead/cacheWrite）
5. **计算缓存命中率** - `cacheRead / (input + cacheRead) × 100%`
6. **聚合统计** - 按模型分组汇总，输出总览和分模型命中率

### 为什么用 timestamp 而不是文件 mtime？

- ✅ **准确** - 基于消息实际发送时间，不受文件修改影响
- ✅ **跨天 session** - 正确处理跨越午夜的 session
- ✅ **时区感知** - 自动转换到 Asia/Shanghai 时区
- ❌ **旧方案问题** - 文件 mtime 会导致跨天 session 被重复计算

## 模型定价

脚本内置了主要模型的定价（美元/百万 tokens），支持自动别名解析：

| 模型 | Input | Output | Cache Read | Cache Write |
|------|-------|--------|------------|-------------|
| **Claude Sonnet 4.5/4.6** | $3.00 | $15.00 | $0.30 | $3.75 |
| **Claude Opus 4/4.5/4.6** | $15.00 | $75.00 | $1.50 | $18.75 |
| **Kimi K2.5** | $0.60 | $2.40 | $0.30 | $0.60 |
| **GPT 5.1 / Codex** | $0.50 | $2.00 | $0.10 | $0.50 |
| **Qwen 3.5 Plus** | $0.20 | $0.80 | $0.02 | $0.20 |
| **MiniMax M2.5 Highspeed** | $0.60 | $2.40 | $0.03 | $0.375 |
| **MiniMax M2.5 / M2.1** | $0.30 | $1.20 | $0.03 | $0.375 |

### 别名支持

支持常见 provider 前缀自动解析：
- `anthropic/claude-sonnet-4-6` → `claude-sonnet-4-6`
- `moonshot/kimi-k2.5` → `kimi-k2.5`
- `openai-codex/gpt-5.3-codex` → `gpt-5.3-codex`
- `dashscope/qwen3.5-plus` → `qwen3.5-plus`

## 文件结构

```
scripts/
├── usage-report.js    # 主计算脚本
└── pricing.js         # 模型定价配置（可独立导入使用）
```

### 单独使用 pricing 模块

```javascript
import { getModelCost, listModels } from './pricing.js';

// 获取模型定价
const costs = getModelCost('claude-sonnet-4-6');
console.log(costs); // { input: 3.00, output: 15.00, cacheRead: 0.30, cacheWrite: 3.75 }

// 支持别名自动解析
const costs2 = getModelCost('anthropic/claude-sonnet-4-6'); // 同上

// 列出所有已知模型
const models = listModels();
```

## 与 /usage cost 的区别

| 特性 | usage-tracker (this skill) | /usage cost |
|------|----------------------------|-------------|
| **实现** | 独立脚本 | OpenClaw 内置命令 |
| **使用** | CLI 直接运行 | 聊天中调用 |
| **依赖** | Node.js + 文件读取 | OpenClaw session context |
| **速度** | 快（直接文件扫描） | 需要 OpenClaw 处理 |
| **灵活性** | 可自定义参数 | 固定格式 |

## 创建快捷命令

添加到 `~/.zshrc`:

```bash
alias openclaw-cost="node ~/.openclaw/skills/usage-tracker/scripts/usage-report.js"
alias openclaw-cost-today="node ~/.openclaw/skills/usage-tracker/scripts/usage-report.js --today"
alias openclaw-cost-week="node ~/.openclaw/skills/usage-tracker/scripts/usage-report.js --days=7 --simple"
```

然后：
```bash
openclaw-cost          # 查看总用量
openclaw-cost-today    # 查看今天
openclaw-cost-week     # 查看本周简洁汇总
```

## 技术细节

### 数据来源

- Session transcripts: `~/.openclaw/agents/*/sessions/*.jsonl`
- 每行一条 JSONL 记录，包含 message + usage
- 自动扫描所有 agent 目录，合并统计

### Usage 字段

```json
{
  "message": {
    "role": "assistant",
    "usage": {
      "input": 1234,
      "output": 567,
      "cacheRead": 89012,
      "cacheWrite": 3456
    },
    "model": "claude-sonnet-4-5"
  }
}
```

### 成本计算

```
totalCost = (
  input * inputCost +
  output * outputCost +
  cacheRead * cacheReadCost +
  cacheWrite * cacheWriteCost
) / 1_000_000
```

## 扩展

可以修改 `scripts/pricing.js` 来：
- 添加更多模型定价
- 修改默认兜底模型

可以修改 `scripts/usage-report.js` 来：
- 按日期分组显示
- 导出 CSV 报表
- 显示成本趋势图

## 限制

- 只统计本地 session transcripts（不包含已删除的 sessions）
- 需要 usage 字段存在（旧 sessions 可能缺失）
- 模型定价需要手动更新（不自动同步最新价格）
- 未知模型默认使用 Claude Sonnet 4.6 定价
