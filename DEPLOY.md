# jimeng-ai 技能部署指南

> **技能名称**: 即梦AI 文生图/文生视频
> **技能版本**: v1.1.0
> **部署时间**: 2026-03-28
> **状态**: ✅ 准备部署

---

## 📦 技能文件结构

```
jimeng-ai/
├── SKILL.md                    # 技能定义 ✅
├── package.json               # 依赖配置 ✅
├── scripts/
│   ├── common.ts             # 通用工具 ✅
│   ├── logger.ts             # 日志系统 ✅
│   ├── config.ts             # 配置管理 ✅
│   ├── retry.ts              # 重试机制 ✅
│   ├── text2image.ts         # 文生图 ✅
│   └── text2video.ts         # 文生视频 ✅
├── examples/
│   ├── prompts.md             # 提示词示例 ✅
│   └── usage.md              # 使用示例 ✅
├── .env.example               # 配置模板 ✅
├── README.md                  # 使用文档 ✅
├── ERROR_CODES.md            # 错误码文档 ✅
└── tsconfig.json             # TypeScript配置 ✅
```

---

## 🚀 部署步骤

### 方法1: 本地安装（推荐）

#### 步骤1: 克隆仓库

```bash
git clone https://github.com/aiwell0721/jimeng-ai.git
cd jimeng-ai
```

#### 步骤2: 安装依赖

```bash
npm install
```

#### 步骤3: 配置环境变量

```bash
# 复制配置模板
cp .env.example .env

# 编辑配置
nano .env

# 添加你的火山引擎凭证
VOLCENGINE_AK=your-access-key
VOLCENGINE_SK=your-secret-key
```

#### 步骤4: 测试技能

```bash
# 测试文生图
npx ts-node scripts/text2image.ts "一只可爱的猫咪" --version v40

# 测试文生视频
npx ts-node scripts/text2video.ts "猫咪在草地上奔跑" --wait
```

### 方法2: 直接使用（无需安装）

如果已有Node.js环境：

```bash
# 下载项目
git clone https://github.com/aiwell0721/jimeng-ai.git

# 安装依赖
cd jimeng-ai
npm install

# 配置环境变量
export VOLCENGINE_AK="your-key"
export VOLCENGINE_SK="your-secret"

# 使用技能
npx ts-node scripts/text2image.ts "提示词"
```

---

## ⚙️ 环境要求

### 必需

- **Node.js**: 18.0+ 
- **npm**: 6.0+
- **网络**: 需要能访问火山引擎API

### 可选

- **TypeScript**: 5.0+ (用于开发)

### 系统要求

- **操作系统**: Linux/macOS/Windows
- **内存**: 4GB+ RAM
- **磁盘**: 1GB+ 可用空间

---

## 🔐 安全配置

### 环境变量保护

```bash
# 确保.env在.gitignore中
cat .gitignore | grep -E "^\.env"
```

### 凭证安全

⚠️ **重要**:
- 不要将 `.env` 文件提交到Git
- 不要在代码中硬编码API凭证
- 定期轮换API凭证
- 使用最小权限原则

---

## 📋 配置清单

部署前检查清单：

- [ ] 已获取火山引擎Access Key和Secret Key
- [ ] 已安装Node.js 18.0+
- [ ] 已克隆jimeng-ai仓库
- [ ] 已执行 `npm install`
- [ ] 已配置环境变量
- [ ] 已测试文生图功能
- [ ] 已测试文生视频功能
- [ ] 已阅读README.md和ERROR_CODES.md

---

## 🧪 测试验证

### 基础测试

```bash
# 1. 测试环境变量
echo $VOLCENGINE_AK
echo $VOLCENGINE_SK

# 2. 测试依赖
npm test

# 3. 测试文生图（简单提示词）
npx ts-node scripts/text2image.ts "测试" --version v40

# 4. 测试文生视频（短提示词）
npx ts-node scripts/text2video.ts "测试" --duration 5
```

### 功能测试

```bash
# 测试不同版本
npx ts-node scripts/text2image.ts "测试" --version v30
npx ts-node scripts/text2image.ts "测试" --version v31
npx ts-node scripts/text2image.ts "测试" --version v40

# 测试不同宽高比
npx ts-node scripts/text2image.ts "测试" --ratio 1:1
npx ts-node scripts/text2image.ts "测试" --ratio 9:16
npx ts-node scripts/text2image.ts "测试" --ratio 16:9

# 测试多张生成
npx ts-node scripts/text2image.ts "测试" --count 2
npx ts-node scripts/text2image.ts "测试" --count 4
```

### 异常测试

```bash
# 测试错误凭证
export VOLCENGINE_AK="invalid"
npx ts-node scripts/text2image.ts "测试"

# 测试无效参数
npx tspx ts-node scripts/text2image.ts "测试" --ratio 999:999

# 测试网络重试
# 模拟网络波动，验证重试机制
```

---

## 📚 使用文档

部署完成后，用户可以通过以下文档了解使用：

1. **README.md** - 完整使用文档
2. **SKILL.md** - 技能定义和参数说明
3. **ERROR_CODES.md** - 错误码详细说明
4. **examples/prompts.md** - 提示词示例
5. **examples/usage.md** - 使用示例

---

## 🚀 快速开始示例

部署完成后，用户可以这样使用：

### 示例1: 生成猫咪图片

```
请帮我生成一张动漫风格的猫咪图片
```

### 示例2: 生成风景视频

```
生成一段海边的日落视频，10秒，16:9横屏
```

### 示例3: 测试功能

```
测试文生图功能，生成一个简单的测试图片
```

---

## 🔍 故障排查

### 常见问题

1. **环境变量未设置**
   ```
   错误: MISSING_CREDENTIALS
   解决: 设置 VOLCENGINE_AK 和 VOLCENGINE_SK
   ```

2. **依赖安装失败**
   ```
   错误: npm ERR! code ECONNREFUSED
   解决: 检查网络连接，使用国内镜像
   ```

3. **任务超时**
   ```
   错误: 任务超时
   解决: 使用更简单的提示词，或等待更长时间
   ```

更多问题请参考 [ERROR_CODES.md](ERROR_CODES.md)

---

## 📞 技术支持

### 问题反馈

- 📧 GitHub Issues: [提交问题](https://github.com/aiwell0721/jimeng-ai/issues)
- 📚 文档: [README.md](README.md)
- 🐛 错误码: [ERROR_CODES.md](ERROR_CODES.md)

---

## 📊 性能参考

| 功能 | 平均耗时 | API消耗 |
|------|---------|---------|
| 文生图（提交） | <1秒 | 1次调用 |
| 文生图（完成） | 10-30秒 | 1次调用/次 |
| 文生视频（提交） | <1秒 | 1次调用 |
| 文生视频（完成） | 1-3分钟 | 1次调用/秒 |

---

## 🎯 适用场景推荐

### 推荐使用场景

- ✅ 内容创作需要图片/视频素材
- ✅ 社交媒体内容制作
- ✅ 游戏素材生成
- ✅ 广告和营销材料
- ✅ 技术探索和测试

### 不推荐场景

- ❌ 需要实时交互的视频流
- ❌ 超大尺寸图片生成（>2048x2048）
- ❌ 需要批量快速生成（>10个/分钟）
- ❌ 需要自定义参数的复杂场景

---

## 🎉 部署完成！

部署完成后，用户可以通过自然语言轻松使用jimeng-ai技能，生成高质量的图片和视频！

---

*部署版本*: v1.1.0
*部署时间*: 2026-03-28
*状态*: ✅ 准备就绪*
*测试状态*: ✅ 已验证*
