#!/usr/bin/env node
/**
 * OpenClaw Usage Tracker (Unified)
 * 统一的用量统计工具 - 基于消息 timestamp 精确计算
 * 
 * 用法：
 *   node usage-report.js                    # 今天详细报告
 *   node usage-report.js --today            # 今天详细报告
 *   node usage-report.js --yesterday        # 昨天详细报告
 *   node usage-report.js --date=2026-02-17  # 指定日期
 *   node usage-report.js --days=7           # 最近 7 天
 *   node usage-report.js --session          # 当前 session（最近活跃）
 *   node usage-report.js --simple           # 简洁输出（不分模型）
 */

import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';
import { getModelCost } from './pricing.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 读取 JSONL 文件
async function* readJsonl(filePath) {
  const fileStream = fs.createReadStream(filePath, { encoding: 'utf-8' });
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });
  
  try {
    for await (const line of rl) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      try {
        yield JSON.parse(trimmed);
      } catch {}
    }
  } finally {
    rl.close();
    fileStream.destroy();
  }
}

// 合并多个 modelStats
function mergeModelStats(target, source) {
  for (const [model, stats] of Object.entries(source)) {
    if (!target[model]) {
      target[model] = {
        input: 0,
        output: 0,
        cacheRead: 0,
        cacheWrite: 0,
        messages: 0
      };
    }
    target[model].input += stats.input;
    target[model].output += stats.output;
    target[model].cacheRead += stats.cacheRead;
    target[model].cacheWrite += stats.cacheWrite;
    target[model].messages += stats.messages;
  }
}

// 检查日期是否在范围内（转换到 Asia/Shanghai 时区）
function isInDateRange(timestamp, startDate, endDate) {
  const msgDate = new Date(timestamp);
  
  // 转换到本地时区（Asia/Shanghai）
  const localDateStr = msgDate.toLocaleDateString('zh-CN', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  
  const [year, month, day] = localDateStr.split('/').map(Number);
  const localDate = new Date(year, month - 1, day);
  
  return localDate >= startDate && localDate <= endDate;
}

// 扫描所有文件（按日期范围过滤）
async function scanByDateRange(sessionsDir, startDate, endDate) {
  const modelStats = {};
  
  const files = fs.readdirSync(sessionsDir)
    .filter(f => f.endsWith('.jsonl'));
  
  for (const file of files) {
    const filePath = path.join(sessionsDir, file);
    
    for await (const entry of readJsonl(filePath)) {
      const message = entry.message;
      if (!message || message.role !== 'assistant') continue;
      
      // 检查时间戳
      const timestamp = entry.timestamp;
      if (!timestamp || !isInDateRange(timestamp, startDate, endDate)) continue;
      
      const usage = message.usage || entry.usage;
      if (!usage) continue;
      
      const model = message.model || entry.model || 'claude-sonnet-4-6';
      
      // 提取 token 数据
      const input = usage.input || 0;
      const output = usage.output || 0;
      const cacheRead = usage.cacheRead || usage.cache_read_input_tokens || 0;
      const cacheWrite = usage.cacheWrite || usage.cache_creation_input_tokens || 0;
      
      // 初始化模型统计
      if (!modelStats[model]) {
        modelStats[model] = {
          input: 0,
          output: 0,
          cacheRead: 0,
          cacheWrite: 0,
          messages: 0
        };
      }
      
      // 累加统计
      modelStats[model].input += input;
      modelStats[model].output += output;
      modelStats[model].cacheRead += cacheRead;
      modelStats[model].cacheWrite += cacheWrite;
      modelStats[model].messages += 1;
    }
  }
  
  return modelStats;
}

// 扫描最近的 session（按文件修改时间排序，取最活跃的几个）
async function scanRecentSessions(sessionsDir, maxFiles = 3) {
  const modelStats = {};
  
  // 获取所有 jsonl 文件并按修改时间排序
  const files = fs.readdirSync(sessionsDir)
    .filter(f => f.endsWith('.jsonl'))
    .map(f => ({
      name: f,
      path: path.join(sessionsDir, f),
      mtime: fs.statSync(path.join(sessionsDir, f)).mtime
    }))
    .sort((a, b) => b.mtime - a.mtime)
    .slice(0, maxFiles);
  
  for (const file of files) {
    for await (const entry of readJsonl(file.path)) {
      const message = entry.message;
      if (!message || message.role !== 'assistant') continue;
      
      const usage = message.usage || entry.usage;
      if (!usage) continue;
      
      const model = message.model || entry.model || 'claude-sonnet-4-6';
      
      const input = usage.input || 0;
      const output = usage.output || 0;
      const cacheRead = usage.cacheRead || usage.cache_read_input_tokens || 0;
      const cacheWrite = usage.cacheWrite || usage.cache_creation_input_tokens || 0;
      
      if (!modelStats[model]) {
        modelStats[model] = {
          input: 0,
          output: 0,
          cacheRead: 0,
          cacheWrite: 0,
          messages: 0
        };
      }
      
      modelStats[model].input += input;
      modelStats[model].output += output;
      modelStats[model].cacheRead += cacheRead;
      modelStats[model].cacheWrite += cacheWrite;
      modelStats[model].messages += 1;
    }
  }
  
  return modelStats;
}

// 计算成本
function calculateCost(tokens, model) {
  const costs = getModelCost(model);
  
  return (
    (tokens.input * costs.input) +
    (tokens.output * costs.output) +
    (tokens.cacheRead * costs.cacheRead) +
    (tokens.cacheWrite * costs.cacheWrite)
  ) / 1_000_000;
}

// 格式化数字
function formatTokens(value) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}m`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}k`;
  return String(Math.round(value));
}

function formatUsd(value) {
  return `$${value.toFixed(2)}`;
}

// 输出详细报告（按模型分组）
function printDetailedReport(modelStats, title) {
  console.log(`\n💸 ${title}`);
  console.log('='.repeat(80));
  
  if (Object.keys(modelStats).length === 0) {
    console.log('\n⚠️  No data found.\n');
    return;
  }
  
  let totalCost = 0;
  let totalTokens = 0;
  let totalMessages = 0;
  
  for (const [model, stats] of Object.entries(modelStats)) {
    const cost = calculateCost(stats, model);
    const tokens = stats.input + stats.output + stats.cacheRead + stats.cacheWrite;
    
    totalCost += cost;
    totalTokens += tokens;
    totalMessages += stats.messages;
    
    const costs = getModelCost(model);
    
    console.log(`\n📊 ${model}`);
    console.log(`   Messages: ${stats.messages}`);
    console.log(`   Input:      ${formatTokens(stats.input).padStart(8)} tokens  →  ${formatUsd(stats.input * costs.input / 1_000_000)}`);
    console.log(`   Output:     ${formatTokens(stats.output).padStart(8)} tokens  →  ${formatUsd(stats.output * costs.output / 1_000_000)}`);
    console.log(`   CacheRead:  ${formatTokens(stats.cacheRead).padStart(8)} tokens  →  ${formatUsd(stats.cacheRead * costs.cacheRead / 1_000_000)}`);
    console.log(`   CacheWrite: ${formatTokens(stats.cacheWrite).padStart(8)} tokens  →  ${formatUsd(stats.cacheWrite * costs.cacheWrite / 1_000_000)}`);
    console.log(`   Total:      ${formatTokens(tokens).padStart(8)} tokens  →  ${formatUsd(cost)}`);
  }
  
  console.log('\n' + '='.repeat(80));
  console.log(`💰 Grand Total: ${formatUsd(totalCost)} · ${formatTokens(totalTokens)} tokens · ${totalMessages} messages`);
  console.log(`📈 Average: ${formatUsd(totalCost / totalMessages)} per message\n`);
}

// 输出简洁报告
function printSimpleReport(modelStats, title) {
  console.log(`\n💸 ${title}`);
  console.log('');
  
  if (Object.keys(modelStats).length === 0) {
    console.log('⚠️  No data found.\n');
    return;
  }
  
  let totalCost = 0;
  let totalTokens = 0;
  let totalMessages = 0;
  
  for (const [model, stats] of Object.entries(modelStats)) {
    const cost = calculateCost(stats, model);
    const tokens = stats.input + stats.output + stats.cacheRead + stats.cacheWrite;
    
    totalCost += cost;
    totalTokens += tokens;
    totalMessages += stats.messages;
  }
  
  console.log(`Total: ${formatUsd(totalCost)} · ${formatTokens(totalTokens)} tokens`);
  console.log(`Messages: ${totalMessages}`);
  console.log(`Average: ${formatUsd(totalCost / totalMessages)} per message\n`);
}

// 主函数
async function main() {
  const args = process.argv.slice(2);
  const homedir = process.env.HOME || process.env.USERPROFILE;
  
  // 自动发现所有 agent 目录
  const agentsBaseDir = path.join(homedir, '.openclaw/agents');
  const sessionsDirs = [];
  
  if (fs.existsSync(agentsBaseDir)) {
    const agentDirs = fs.readdirSync(agentsBaseDir);
    for (const agentDir of agentDirs) {
      const sessionsPath = path.join(agentsBaseDir, agentDir, 'sessions');
      if (fs.existsSync(sessionsPath)) {
        sessionsDirs.push(sessionsPath);
      }
    }
  }
  
  // 解析参数
  let mode = 'today';
  let days = 1;
  let targetDate = null;
  let simple = false;
  
  for (const arg of args) {
    if (arg === '--today') mode = 'today';
    else if (arg === '--yesterday') mode = 'yesterday';
    else if (arg === '--session') mode = 'session';
    else if (arg === '--simple') simple = true;
    else if (arg.startsWith('--days=')) {
      mode = 'days';
      days = parseInt(arg.split('=')[1]);
    } else if (arg.startsWith('--date=')) {
      mode = 'date';
      targetDate = arg.split('=')[1];
    }
  }
  
  let modelStats = {};
  let title = '';
  
  if (mode === 'session') {
    // 最近活跃的 session（扫描所有 agent 目录的最近文件）
    for (const dir of sessionsDirs) {
      if (fs.existsSync(dir)) {
        const stats = await scanRecentSessions(dir, 3);
        mergeModelStats(modelStats, stats);
      }
    }
    title = 'Recent Sessions Usage (Latest 3 files)';
  } else {
    // 计算日期范围
    const now = new Date();
    let startDate, endDate;
    
    if (mode === 'today') {
      const todayStr = now.toLocaleDateString('zh-CN', {
        timeZone: 'Asia/Shanghai',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).replace(/\//g, '-').split('-').map((p, i) => i === 0 ? p : p.padStart(2, '0')).join('-');
      
      const [year, month, day] = todayStr.split('-').map(Number);
      startDate = new Date(year, month - 1, day);
      endDate = new Date(year, month - 1, day);
      title = `Daily Usage Report (${todayStr} - Today)`;
      
    } else if (mode === 'yesterday') {
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      
      const yesterdayStr = yesterday.toLocaleDateString('zh-CN', {
        timeZone: 'Asia/Shanghai',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).replace(/\//g, '-').split('-').map((p, i) => i === 0 ? p : p.padStart(2, '0')).join('-');
      
      const [year, month, day] = yesterdayStr.split('-').map(Number);
      startDate = new Date(year, month - 1, day);
      endDate = new Date(year, month - 1, day);
      title = `Daily Usage Report (${yesterdayStr} - Yesterday)`;
      
    } else if (mode === 'date') {
      const [year, month, day] = targetDate.split('-').map(Number);
      startDate = new Date(year, month - 1, day);
      endDate = new Date(year, month - 1, day);
      title = `Daily Usage Report (${targetDate})`;
      
    } else if (mode === 'days') {
      endDate = new Date(now);
      const endStr = endDate.toLocaleDateString('zh-CN', {
        timeZone: 'Asia/Shanghai',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).replace(/\//g, '-').split('-').map((p, i) => i === 0 ? p : p.padStart(2, '0')).join('-');
      const [endYear, endMonth, endDay] = endStr.split('-').map(Number);
      endDate = new Date(endYear, endMonth - 1, endDay);
      
      startDate = new Date(endDate);
      startDate.setDate(startDate.getDate() - days + 1);
      title = `Usage Report (Last ${days} days)`;
    }
    
    // 扫描所有 agent 目录并合并结果
    for (const dir of sessionsDirs) {
      if (fs.existsSync(dir)) {
        const stats = await scanByDateRange(dir, startDate, endDate);
        mergeModelStats(modelStats, stats);
      }
    }
  }
  
  // 输出报告
  if (simple) {
    printSimpleReport(modelStats, title);
  } else {
    printDetailedReport(modelStats, title);
  }
}

main().catch(console.error);
