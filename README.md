# 即梦AI - 文生图/文生视频技能

> 基于火山引擎即梦AI的文生图和文生视频能力，支持通过文本描述生成高质量图片和视频。

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![Version](https://img.shields.io/badge/version-1.1.0-green.svg)](https://github.com/aiwell0721/jimeng-ai)

---

## ✨ 功能特性

- 🎨 **文生图 v4.0** - 高质量AI图片生成
- 🎥 **文生视频 v3.0** - 1080P高清视频生成
- 🔁 **断点续传** - 使用MD5去重，避免重复任务
- ⚡ **异步查询** - 智能轮询任务状态
- 🔄 **智能重试** - 网络波动时自动重试
- 📊 **分级日志** - 清晰的日志输出和调试

---

## 🚀 快速开始

### 1. 环境配置

```bash
# 复制配置模板
cp .env.example .env

# 编辑配置文件，填入你的火山引擎凭证
nano .env
```

### 2. 安装依赖

```bash
cd jimeng-ai
npm install
```

### 3. 设置环境变量

```bash
export VOLCENGINE_AK="your-access-key"
export VOLCENGINE_SK="your-secret-key"
# 可选
export VOLCENGINE_TOKEN="your-security-token"
```

### 4. 使用技能

```bash
# 文生图
npx ts-node scripts/text2image.ts "一只可爱的猫咪" --version v40 --ratio 9:16

# 文生视频
npx ts-node scripts/text2video.ts "猫咪在草地上奔跑" --duration 5 --wait
```

---

## 📚 使用文档

### 文生图

**基础用法**:
```bash
npx ts-node scripts/text2image.ts "提示词"
```

**指定版本**:
```bash
npx ts-node scripts/text2image.ts "提示词" --version v40
```

**设置宽高比**:
```bash
npx ts-node scripts/text2image.ts "提示词" --ratio 16:9
```

**生成多张**:
```bash
npx ts-node scripts/text2image.ts "提示词" --count 4
```

**等待完成**:
```bash
npx ts-node scripts/text2image.ts "提示词" --wait
```

**调试模式**:
```bash
export DEBUG=true
npx ts-node scripts/text2image.ts "提示词" --debug
```

---

### 文生视频

**基础用法**:
```bash
npx ts-node scripts/text2video.ts "提示词"
```

**设置时长**:
```bash
npx ts-node scripts/text2video.ts "提示词" --duration 10
```

**设置帧率**:
```bash
npx ts-node scripts/text2video.ts "提示词" --fps 30
```

**等待完成**:
```bash
npx ts-node scripts/text2video.ts "提示词" --wait
```

---

## 🎨 提示词技巧

### 好的提示词应包含：

1. **主体描述** - 清晰描述主要对象
2. **场景设定** - 指明环境背景
3. **风格要求** - 说明想要的风格
4. **质量描述** - 强调画面质量

### 示例对比

❌ **不好的提示词**:
```
一只猫
```

✅ **好的提示词**:
```
一只毛茸茸的橘色猫咪，坐在阳光下的窗台上，
背景是温馨的室内，动漫风格，高质量，4K分辨率
```

### 更多示例

参见 `examples/prompts.md`

---

## 🛠️ 开发指南

### 运行测试

```bash
# 测试工具模块
npm run test:tools

# 测试文生图（需要凭证）
npm run test:image

# 测试文生视频（需要凭证）
npm run test:video
```

### 调试技巧

```bash
# 启用DEBUG模式
export DEBUG=true

# 查看详细日志
npm run text2image "提示词" --debug
```

### 代码结构

```
jimeng-ai/
├── scripts/
│   ├── common.ts          # 通用工具（签名、API调用）
│   ├── logger.ts          # 日志系统
│   ├── config.ts          # 配置管理
│   ├── retry.ts           # 重试机制
│   ├── text2image.ts      # 文生图脚本
│   └── text2video.ts      # 文生视频脚本
├── examples/              # 示例和教程
│   ├── prompts.md         # 提示词示例
│   └── usage.md           # 使用示例
├── .env.example          # 环境变量模板
├── ERROR_CODES.md       # 错误码文档
└── README.md             # 本文档
```

---

## 📋 API版本支持

### 文生图

| 版本 | 特点 | 推荐度 |
|------|------|--------|
| v30 | 基础版本 | ⭐⭐⭐ |
| v31 | 标准版本 | ⭐⭐⭐⭐ |
| v40 | 最新版本，质量最好 | ⭐⭐⭐⭐⭐ |

### 文生视频

| 版本 | 特点 |
|------|------|
| v3.0 | 1080P高清，支持5s/10s |

### 支持的宽高比

**文生图**: 1:1, 9:16, 16:9, 3:4, 4:3, 2:3, 3:2, 1:2, 2:1

**文生视频**: 16:9, 4:3, 1:1, 3:4, 9:16, 21:9

---

## 🔐 安全说明

⚠️ **重要**: 不要将 `.env` 文件提交到Git！

```bash
# 确认.gitignore包含.env
echo ".env" >> .gitignore
echo "*.log" >> .gitignore
echo "output/" >> .gitignore
```

### 获取火山引擎凭证

1. 访问 [火山引擎控制台](https://console.volcengine.com/)
2. 创建Access Key和Secret Key
3. 配置到环境变量或.env文件

---

## ❓ 常见问题

### Q1: 提示示词后没有输出任何结果？

**A**: 检查以下几点：
1. 环境变量是否正确配置（VOLCENGINE_AK、VOLCENGINE_SK）
2. 网络连接是否正常
3. API配额是否充足
4. 启用DEBUG模式查看详细日志

### Q2: 任务一直显示"处理中"？

**A**: 
1. 等待时间可能较长（文生图10-30秒，文生视频1-3分钟）
2. 查看任务状态：重新运行相同命令（会自动查询）
3. 启用DEBUG模式查看查询进度

### Q3: 如何查看已生成的图片/视频？

**A**: 
图片/视频保存在 `./output/` 目录下，按提示词的MD5值分文件夹存储

### Q4: 如何提高生成质量？

**A**:
1. 使用v4.0版本（最新）
2. 提供详细的提示词
3. 参考优质提示词示例

### Q5: 支持批量生成吗？

**A**: 
目前支持count参数（1-4张），如果需要批量生成多个不同提示词，可以编写脚本循环调用

---

## 📖 参考文档

- [火山引擎即梦AI文生图文档](https://www.volcengine.com/docs/85621/1820192)
- [火山引擎即梦AI文生视频文档](https://www.volcengine.com/docs/85621/1792702)
- [ERROR_CODES.md](./ERROR_CODES.md) - 错误码详细说明
- [examples/prompts.md](./examples/prompts.md) - 提示词示例

---

## 🤝 贡献

欢迎提交Issue和Pull Request！

### 开发流程

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'feat: add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

---

## 📄 开源协议

MIT License - 详见 [LICENSE](LICENSE)

---

## 🌟 致谢

- 火山引擎即梦AI团队
- 所有贡献者

---

## 📞 联系方式

- GitHub: [aiwell0721/jimeng-ai](https://github.com/aiwell0721/jimeng-ai)
- Issues: [提交问题](https://github.com/aiwell0721/jimeng-ai/issues)

---

**版本**: v1.1.0
**最后更新**: 2026-03-28
**状态**: ✅ 稳定版本
