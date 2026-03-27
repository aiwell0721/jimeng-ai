---
name: jimeng-ai
description: "基于火山引擎即梦AI的文生图/文生视频能力，支持通过文本描述生成图片和视频。Use when: user asks to generate images or videos from text descriptions. Supports v4.0 image generation and v3.0 1080P video generation."
homepage: https://www.volcengine.com/docs/85621/1820192
metadata: { "openclaw": { "emoji": "🎨", "requires": { "bins": ["ts-node", "npm"], "env": ["VOLCENGINE_AK", "VOLCENGINE_SK"] }, "primaryEnv": "VOLCENGINE_AK" } }
---

# 即梦AI 文生图/文生视频 Skill

基于火山引擎即梦AI的文生图和文生视频能力，支持通过文本描述生成图片和视频。

## 功能特性

- 支持即梦AI文生图 v4.0（推荐）
- 支持即梦AI文生视频 v3.0 1080P
- 断点续传：使用 MD5(提示词) 保存任务状态
- 异步查询：支持断点续传，避免重复提交相同任务

## 环境变量配置

在使用前，需要配置火山引擎凭证：

```bash
export VOLCENGINE_AK="your-access-key"
export VOLCENGINE_SK="your-secret-key"
```

或者在 `~/.openclaw/openclaw.json` 中配置：

```json
{
  "skills": {
    "entries": {
      "jimeng-ai": {
        "env": {
          "VOLCENGINE_AK": "your-access-key",
          "VOLCENGINE_SK": "your-secret-key"
        }
      }
    }
  }
}
```

获取方式：
1. 登录 [火山引擎控制台](https://console.volcengine.com/)
2. 进入"访问控制" -> "密钥管理"
3. 创建或查看已有访问密钥

## 安装依赖

首次使用前需要安装依赖：

```bash
cd {baseDir}
npm install
```

## 文生图使用方法

### 基础用法

```bash
cd {baseDir} && npx ts-node scripts/text2image.ts "一只可爱的猫咪" --version v40
```

### 完整参数

```bash
cd {baseDir} && npx ts-node scripts/text2image.ts "提示词" \
  --version v40 \
  --ratio 16:9 \
  --count 2
```

### 参数说明

| 参数 | 说明 | 默认值 |
|------|------|--------|
| `prompt` | 图片生成提示词（必填） | - |
| `--version` | API版本: `v30`, `v31`, `v40` | `v31` |
| `--ratio` | 宽高比: `1:1`, `9:16`, `16:9`, `3:4`, `4:3`, `2:3`, `3:2`, `1:2`, `2:1` | `16:9` |
| `--count` | 生成数量 1-4 | `1` |
| `--output` | 图片输出目录 | `./output` |
| `--debug` | 调试模式 | `false` |

### 示例

生成风景画：

```bash
cd {baseDir} && npx ts-node scripts/text2image.ts "山水风景画，水墨风格" --version v40 --ratio 16:9
```

生成科幻城市：

```bash
cd {baseDir} && npx ts-node scripts/text2image.ts "未来科幻城市，霓虹灯光，赛博朋克风格" --version v40 --ratio 16:9 --count 2
```

## 文生视频使用方法

### 基础用法

```bash
cd {baseDir} && npx ts-node scripts/text2video.ts "一只可爱的猫咪在草地上奔跑"
```

### 完整参数

```bash
cd {baseDir} && npx ts-node scripts/text2video.ts "提示词" \
  --ratio 9:16 \
  --duration 5 \
  --fps 24
```

### 参数说明

| 参数 | 说明 | 默认值 |
|------|------|--------|
| `prompt` | 视频生成提示词（必填） | - |
| `--ratio` | 宽高比: `16:9`, `4:3`, `1:1`, `3:4`, `9:16`, `21:9` | `9:16` |
| `--duration` | 视频时长: `5` 或 `10` 秒 | `5` |
| `--fps` | 帧率: `24` 或 `30` | `24` |
| `--output` | 视频输出目录 | `./output` |

## 工作流程

### 首次执行（新任务）

1. 向 API 提交任务
2. 使用 `md5(提示词)` 作为文件夹名创建目录
3. 保存任务信息
4. 返回任务ID

### 后续执行（异步查询）

使用相同提示词运行将查询已有任务：
1. 如果图片已存在 → 立即返回图片路径
2. 如果任务未完成 → 返回任务状态
3. 如果任务已完成 → 保存并返回图片

## 输出格式

任务完成后，图片/视频保存在：

```
output/
└── <md5(prompt)>/
    ├── param.json           # 请求参数
    ├── response.json        # API响应
    ├── taskId.txt           # 任务ID
    └── 1.jpg, 2.jpg, ...    # 生成的图片
```

## 注意事项

- 推荐使用 `--version v40` 参数，效果更好
- 任务提交后需要等待一段时间才能完成
- 使用相同提示词可以查询任务状态
- 生成的图片以 base64 格式返回并自动保存

## 参考文档

- [火山引擎即梦AI文生图文档](https://www.volcengine.com/docs/85621/1820192)
- [火山引擎即梦AI文生视频文档](https://www.volcengine.com/docs/85621/1792702)