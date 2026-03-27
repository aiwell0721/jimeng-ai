# jimeng-ai 使用示例

本文档提供jimeng-ai技能的详细使用示例，帮助快速上手。

---

## 🎨 文生图示例

### 示例1：基础文生图

```bash
npx ts-node scripts/text2image.ts "一只可爱的猫咪" --version v40
```

**输出**:
```json
{
  "success": true,
  "submitted": true,
  "taskId": "18279481414285085801",
  "folder": "/workspace/projects/workspace/jimeng-ai/output/..."
}
```

### 示例2：指定参数

```bash
npx ts-node scripts/text2image.ts \
  "金色的麦田在夕阳下，微风吹过，远处的山峦" \
  --version v40 \
  --ratio 16:9 \
  --count 2 \
  --width 2560 \
  --height 1440
```

**参数说明**:
- `--version`: API版本（v30/v31/v40）
- `--ratio`: 宽高比（1:1/9:16/16:9等）
- `--count`: 生成数量（1-4）
- `--width`: 指定宽度
- `--height`: 指定高度

### 示例3：等待任务完成

```bash
npx ts-node scripts/text2image.ts \
  "海边的日落，海浪拍打礁石" \
  --version v40 \
  --ratio 21:9 \
  --wait
```

**输出**: 完成后显示图片保存路径

### 示例4：断点续传

```bash
# 第一次提交
npx ts-node scripts/text2image.ts "测试提示词"

# 等待一段时间后，再次运行相同提示词（自动查询结果）
npx ts-node scripts/text2image.ts "测试提示词"
```

---

## 🎥 文生视频示例

### 示例1：基础文生视频

```bash
npx ts-node scripts/text2video.ts "一只小猫在草地上奔跑"
```

**输出**:
```json
{
  "success": true,
  "submitted": true,
  "taskId": "...",
  "videoUrl": "..."
}
```

### 示例2：指定参数

```bash
npx ts-node scripts/text2video.ts \
  "樱花瓣在风中飘落" \
  --ratio 9:16 \
  --duration 10 \
  --fps 30 \
  --wait
```

**参数说明**:
- `--ratio`: 宽高比
- `--duration`: 视频时长（5或10秒）
- `--fps`: 帧率（24或30）

### 示例3：断点续传

```bash
# 第一次提交
npx ts-node scripts/text2video.ts "测试视频"

# 查询结果
npx ts-node scripts/text2video.ts "测试视频"
```

---

## 🔧 高级用法

### 环境变量配置

创建 `.env` 文件：

```bash
# API凭证
VOLCENGINE_AK=your-access-key
VOLCENGINE_SK=your-secret-key

# API配置
VOLCENGINE_TIMEOUT=30000
MAX_RETRIES=3
RETRY_DELAY=1000

# 输出配置
OUTPUT_DIR=./output

# 日志配置
DEBUG=false
LOG_LEVEL=info
```

使用时加载：
```bash
# 从.env加载（需要dotenv）
npm install dotenv

# 直接设置
export VOLCENGINE_AK="your-key"
export VOLCOWNENGINE_SK="your-secret"
```

### 调试模式

```bash
# 方法1: 环境变量
export DEBUG=true

# 方法2: 命令行参数
npx ts-node scripts/text2image.ts "提示词" --debug

# 方法3: 修改.env文件
DEBUG=true
```

### 批量生成示例

创建批量脚本 `batch-generate.sh`:

```bash
#!/bin/bash

# 定义提示词列表
prompts=(
  "提示词1"
  "提示词2"
  "提示词3"
)

# 批量生成
for prompt in "${prompts[@]}"; do
  echo "生成: $prompt"
  npx ts-node scripts/text2image.ts "$prompt" --version v40 --ratio 9:16
  sleep 5  # 避免速率限制
done
```

### 自定义输出目录

```bash
# 指定输出目录
npx ts-node scripts/text2image.ts "提示词" --output ./my-output

# 输出结果
# ./my-output/{md5哈希}/1.jpg
```

---

## 🎯 实际应用场景

### 1. 内容创作

```bash
# 生成文章配图
npx ts-node scripts/text2image.ts \
  "科技新闻配图：AI芯片特写，蓝光效果，未来科技感" \
  --ratio 16:9 \
  --version v40
```

```bash
# 生成视频素材
npx ts-node scripts/text2video.ts \
  "产品展示视频：手机使用场景，多角度展示" \
  --duration 10 \
  --wait
```

### 2. 社交媒体内容

```bash
# Instagram故事
npx ts-node scripts/text2image.ts \
  "咖啡拉花艺术，手绘风格，文艺清新" \
  --ratio 9:16 \
  --version v40
```

### 3. 游戏素材

```bash
# 角色立绘
npx ts-node scripts/text2image.ts \
  "游戏角色立绘：战士角色，手持宝剑，英雄姿态，日式动漫" \
  --ratio 9:16 \
  --version v40
```

### 4. 广告素材

```bash
# 产品广告
npx ts-node scripts/text2image.ts \
  "产品广告：智能手机，极简背景，产品特写，4K高清" \
  --ratio 16:9 \
  --version v40
```

---

## 📊 输出结果解析

### 成功结果

```json
{
  "success": true,
  "prompt": "提示词",
  "version": "v40",
  "ratio": "9:16",
  "count": 1,
  "taskId": "12345",
  "images": ["/path/to/image.jpg"],
  "outputDir": "/path/to/folder"
}
```

### 提交成功但未完成

```json
{
  "success": true,
  "submitted": true,
  "taskId": "12345",
  "message": "任务已提交，请稍后使用相同提示词查询结果"
}
```

### 失败结果

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "错误描述"
  }
}
```

---

## 🛠️ 故障排查

### 问题1: 提交任务失败

**错误信息**:
```
MISSING_CREDENTIALS
```

**解决方案**:
```bash
# 检查环境变量
echo $VOLCENGINE_AK
echo $VOLCENGINE_SK

# 重新设置
export VOLCENGINE_AK="your-key"
export VOLCENGINE_SK="your-secret"
```

### 问题2: 任务一直处理中

**可能原因**:
1. 任务队列繁忙
2. 生成时间较长
3. 提示词复杂

**解决方案**:
```bash
# 启用调试模式
export DEBUG=true

# 重新查询（自动使用MD5去重）
npx ts-node scripts/text2image.ts "相同的提示词"
```

### 问题3: 图片质量不理想

**优化建议**:
1. 使用v4.0版本
2. 改进提示词描述
3. 参考优质提示词示例
4. 调整宽高比

---

## 💡 最佳实践

### 1. 提示词编写

- ✅ 描述要具体但不过长（50-200字）
- ✅ 包含主体、场景、风格、质量
- ✅ 使用标准格式（见上方模板）
- ✅ 参考优质示例

### 2. 参数选择

- ✅ v40版本：质量最好
- ✅ 合适的宽高比：竖屏用9:16，横屏用16:9
- ✅ 生成数量：建议1-2张，避免浪费配额

### 3. 效率优化

- ✅ 使用断点续传避免重复
- ✅ 批量操作注意间隔
- ✅ 监控API配额使用

### 4. 错误处理

- ✅ 启用DEBUG模式查看详细日志
- ✅ 参考ERROR_CODES.md文档
- ✅ 检查环境变量配置

---

## 📞 获取帮助

- 📖 查看 [README.md](../README.md)
- 📚 查看 [ERROR_CODES.md](../ERROR_CODES.md)
- 🎨 查看 [prompts.md](./prompts.md)
- 🐛 [提交问题](https://github.com/aiwell0721/jimeng-ai/issues)

---

*最后更新: 2026-03-28*
*示例数量: 15+*
*覆盖场景: 基础、高级、故障排查*
