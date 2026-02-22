# OpenClaw Usage Tracker

Track OpenClaw token usage and cost from session transcripts.

> 🌏 **Other Languages:** [简体中文 (Chinese)](./README_CN.md)

## What It Does

- Scans session transcript files (`~/.openclaw/agents/*/sessions/*.jsonl`)
- Extracts token usage (input, output, cacheRead, cacheWrite)
- Calculates costs based on model pricing
- **Calculates cache hit rate** — `cacheRead / (input + cacheRead) × 100%`
- Supports filtering by date, session, or time range
- No API key needed — works directly from local logs

## Installation

1. Copy this skill to `~/.openclaw/workspace/skills/usage-tracker/`
2. Or install via ClawHub: `clawhub install usage-tracker` (when published)

## Usage

### CLI Commands (via SKILL.md aliases)

```bash
# Today's usage (default)
openclaw-cost

# Today's usage (explicit)
openclaw-cost-today

# Current session
openclaw-cost-session

# Yesterday
openclaw-cost-yesterday

# Last N days
openclaw-cost-week     # 7 days
openclaw-cost-month    # 30 days

# Specific date
openclaw-cost-date 2026-02-15
```

### Direct Script Usage

```bash
# Today (default)
node ~/.openclaw/workspace/skills/usage-tracker/scripts/usage-report.js

# Yesterday
node ~/.openclaw/workspace/skills/usage-tracker/scripts/usage-report.js --yesterday

# Specific date
node ~/.openclaw/workspace/skills/usage-tracker/scripts/usage-report.js --date=2026-02-15

# Last N days
node ~/.openclaw/workspace/skills/usage-tracker/scripts/usage-report.js --days=7

# Current session
node ~/.openclaw/workspace/skills/usage-tracker/scripts/usage-report.js --session

# Simple output (no model breakdown)
node ~/.openclaw/workspace/skills/usage-tracker/scripts/usage-report.js --simple
```

## Example Output

```
📊 使用量统计 (2026-02-15)

🤖 Model: anthropic/claude-sonnet-4-5
  📥 Input:         1,234,567 tokens  ($1.48)
  📤 Output:          234,567 tokens  ($3.52)
  💾 Cache Read:      567,890 tokens  ($0.06)
  ✍️  Cache Write:    123,456 tokens  ($0.46)
  💾 Cache Hit Rate: 31.5%
  💰 Subtotal:       2,160,480 tokens  ($5.52)

🤖 Model: openai/gpt-4o
  📥 Input:           456,789 tokens  ($1.14)
  📤 Output:           89,012 tokens  ($3.36)
  💾 Cache Hit Rate: 0.0%
  💰 Subtotal:        545,801 tokens  ($4.50)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💵 Total Cost: $10.02
📊 Total Tokens: 2,706,281
💾 Overall Cache Hit Rate: 23.9%
```

## How It Works

1. **Scans session files**: Reads `.jsonl` files from `~/.openclaw/agents/*/sessions/`
2. **Timestamp filtering**: Each session file has a timestamp in filename → accurate date filtering
3. **Usage extraction**: Parses `usage` field from each message turn
4. **Cost calculation**: Uses built-in pricing table (anthropic/claude-*, openai/gpt-*, google/gemini-*)
5. **Cache hit rate**: Calculates `cacheRead / (input + cacheRead) × 100%` per model and overall
6. **Aggregation**: Groups by model, sums tokens, calculates costs

## Features

- ✅ **No API needed** — works offline from local logs
- ✅ **Accurate timestamps** — based on session file creation time
- ✅ **Multi-model support** — tracks all models separately
- ✅ **Cache-aware** — differentiates cache read/write costs + calculates hit rates
- ✅ **Cache hit rate tracking** — per-model and overall cache efficiency metrics
- ✅ **Flexible filtering** — by date, range, or current session
- ✅ **Clean output** — formatted with emoji and tables

## Cron Integration

Add to HEARTBEAT.md or create a cron job:

```javascript
// Daily usage report at 9:02 AM
{
  "name": "daily-usage-report",
  "schedule": { "kind": "cron", "expr": "2 9 * * *", "tz": "Asia/Shanghai" },
  "payload": { "kind": "agentTurn", "message": "Run usage-tracker for yesterday and send summary via iMessage" },
  "sessionTarget": "isolated",
  "enabled": true
}
```

## Supported Models

- Anthropic: Claude Sonnet/Opus 3.5/3.7/4/4.5
- OpenAI: GPT-4o, GPT-4o-mini, o1/o1-mini
- Google: Gemini 1.5/2.0/2.5 Flash/Pro, Gemini Exp
- OpenRouter: Uses base model pricing

## License

MIT

## Author

**Prometheus** (prome9therus)
Created for OpenClaw AI agent platform.

---

💡 **Tip**: Use `--simple` for quick glances, full output for detailed breakdowns.
