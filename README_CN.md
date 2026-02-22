# OpenClaw Usage Tracker

🦞 OpenClaw token 用量和成本统计工具

直接从 session 记录文件计算 token 使用量和成本，无需 API key。

## ✨ 功能特性

- 📊 **扫描 session 记录** — 自动扫描 `~/.openclaw/agents/*/sessions/*.jsonl`
- 💰 **计算成本** — 基于模型定价（input/output/cacheRead/cacheWrite）
- 🎯 **缓存命中率** — 自动计算 cache hit rate
- 📅 **灵活过滤** — 按日期、session、时间范围筛选
- 🔌 **离线工作** — 无需 API key，直接读取本地日志
- 🚀 **支持多模型** — Claude、Kimi、GPT、Qwen、MiniMax 等

## 📦 安装

### 方式 1：手动安装
```bash
# 克隆或复制到 skills 目录
git clone https://github.com/prome9therus/openclaw-usage-tracker.git ~/.openclaw/workspace/skills/usage-tracker
```

### 方式 2：ClawHub（发布后）
```bash
clawhub install usage-tracker
```

## 🚀 使用方法

### CLI 快捷命令（推荐）

安装后在 `~/.zshrc` 添加别名：

```bash
# 今天用量
alias openclaw-cost="node ~/.openclaw/skills/usage-tracker/scripts/usage-report.js"

# 今天用量（明确）
alias openclaw-cost-today="node ~/.openclaw/skills/usage-tracker/scripts/usage-report.js --today"

# 当前 session
alias openclaw-cost-session="node ~/.openclaw/skills/usage-tracker/scripts/usage-report.js --session"

# 昨天
alias openclaw-cost-yesterday="node ~/.openclaw/skills/usage-tracker/scripts/usage-report.js --yesterday"

# 最近 N 天
alias openclaw-cost-week="node ~/.openclaw/skills/usage-tracker/scripts/usage-report.js --days=7 --simple"
alias openclaw-cost-month="node ~/.openclaw/skills/usage-tracker/scripts/usage-report.js --days=30 --simple"

# 指定日期
alias openclaw-cost-date="node ~/.openclaw/skills/usage-tracker/scripts/usage-report.js --date"
```

### 直接使用脚本

```bash
# 今天（默认）
node ~/.openclaw/skills/usage-tracker/scripts/usage-report.js

# 昨天
node ~/.openclaw/skills/usage-tracker/scripts/usage-report.js --yesterday

# 指定日期
node ~/.openclaw/skills/usage-tracker/scripts/usage-report.js --date=2026-02-15

# 最近 N 天
node ~/.openclaw/skills/usage-tracker/scripts/usage-report.js --days=7

# 当前 session（最近活跃文件）
node ~/.openclaw/skills/usage-tracker/scripts/usage-report.js --session

# 简洁输出（无模型细分）
node ~/.openclaw/skills/usage-tracker/scripts/usage-report.js --simple
```

## 📊 输出示例

### 详细报告（默认）

```
💸 Daily Usage Report (2026-02-22 - Today)
================================================================================

📊 claude-sonnet-4-6
   Messages: 21
   Input:           188 tokens  →  $0.00
   Output:         4.2k tokens  →  $0.06
   CacheRead:    490.7k tokens  →  $0.15
   CacheWrite:   376.0k tokens  →  $1.41
   Total:        871.0k tokens  →  $1.62

📊 claude-opus-4-6
   Messages: 99
   Input:           147 tokens  →  $0.00
   Output:        22.2k tokens  →  $1.67
   CacheRead:      7.7m tokens  →  $11.62
   CacheWrite:     2.6m tokens  →  $49.19
   Total:         10.4m tokens  →  $62.48

📊 kimi-k2.5
   Messages: 48
   Input:        873.6k tokens  →  $0.52
   Output:        17.4k tokens  →  $0.04
   CacheRead:      1.5m tokens  →  $0.45
   CacheWrite:        0 tokens  →  $0.00
   Total:          2.4m tokens  →  $1.02

================================================================================
💰 Grand Total: $65.19 · 13.8m tokens · 179 messages
📈 Average: $0.36 per message
```

### 简洁报告（--simple）

```
💸 Usage Report (Last 7 days)

Total: $1847.89 · 386.4m tokens
Messages: 4188
Average: $0.44 per message
```

## 🎯 支持的模型

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

自动解析常见 provider 前缀：
- `anthropic/claude-sonnet-4-6` → `claude-sonnet-4-6`
- `moonshot/kimi-k2.5` → `kimi-k2.5`
- `openai-codex/gpt-5.3-codex` → `gpt-5.3-codex`
- `dashscope/qwen3.5-plus` → `qwen3.5-plus`

## 📁 项目结构

```
usage-tracker/
├── scripts/
│   ├── usage-report.js    # 主计算脚本
│   └── pricing.js         # 模型定价配置
├── SKILL.md               # OpenClaw skill 文档
└── README.md              # 本文件
```

## 🔧 扩展开发

### 添加新模型定价

编辑 `scripts/pricing.js`：

```javascript
export const MODEL_COSTS = {
  'your-model-name': {
    input: 0.00,
    output: 0.00,
    cacheRead: 0.00,
    cacheWrite: 0.00
  }
};
```

### 单独使用 pricing 模块

```javascript
import { getModelCost, listModels } from './pricing.js';

// 获取模型定价
const costs = getModelCost('claude-sonnet-4-6');
console.log(costs);

// 支持别名自动解析
const costs2 = getModelCost('anthropic/claude-sonnet-4-6');

// 列出所有已知模型
const models = listModels();
```

## 📝 技术细节

### 数据来源

- Session transcripts: `~/.openclaw/agents/*/sessions/*.jsonl`
- 每行一条 JSONL 记录，包含 message + usage
- 自动扫描所有 agent 目录，合并统计

### 成本计算

```javascript
totalCost = (
  input * inputCost +
  output * outputCost +
  cacheRead * cacheReadCost +
  cacheWrite * cacheWriteCost
) / 1_000_000
```

### 缓存命中率

```javascript
cacheHitRate = cacheRead / (input + cacheRead) × 100%
```

### 为什么用 timestamp 而不是文件 mtime？

- ✅ **准确** — 基于消息实际发送时间，不受文件修改影响
- ✅ **跨天 session** — 正确处理跨越午夜的 session
- ✅ **时区感知** — 自动转换到 Asia/Shanghai 时区
- ❌ **旧方案问题** — 文件 mtime 会导致跨天 session 被重复计算

## ⚠️ 限制

- 只统计本地 session transcripts（不包含已删除的 sessions）
- 需要 usage 字段存在（旧 sessions 可能缺失）
- 模型定价需要手动更新（不自动同步最新价格）
- 未知模型默认使用 Claude Sonnet 4.6 定价

## 🤝 贡献

欢迎提交 Issue 和 PR！

### 待办事项

- [ ] 按日期分组显示
- [ ] 导出 CSV 报表
- [ ] 显示成本趋势图
- [ ] 支持更多模型定价
- [ ] 实时流式统计

## 📄 许可证

MIT

## 🔗 相关链接

- [OpenClaw 官方文档](https://docs.openclaw.ai)
- [ClawHub Skill 市场](https://clawhub.com)
- [OpenClaw GitHub](https://github.com/openclaw/openclaw)
