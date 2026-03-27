#!/bin/bash
# jimeng-ai 技能打包脚本

echo "📦 开始打包 jimeng-ai 技能..."

# 创建技能包目录
SKILL_DIR="dist/jimeng-ai-skill"
rm -rf "$SKILL_DIR"
mkdir -p "$SKILL_DIR"

echo "📄 复制技能文件..."

# 复制核心文件
cp SKILL.md "$SKILL_DIR/"
cp README.md "$SKILL_DIR/"
cp package.json "$SKILL_DIR/"

# 复制脚本
mkdir -p "$SKILL_DIR/scripts"
cp scripts/common.ts "$SKILL_DIR/scripts/"
cp scripts/logger.ts "$SKILL_DIR/scripts/"
cp scripts/config.ts "$SKILL_DIR/scripts/"
cp scripts/retry.ts "$SKILL_DIR/scripts/"
cp scripts/text2image.ts "$SKILL_DIR/scripts/"
cp scripts/text2video.ts "$SKILL_DIR/scripts/"

# 复制文档
mkdir -p "$SKILL_DIR/examples"
cp examples/prompts.md "$SKILL_DIR/examples/"
cp examples/usage.md "$SKILL_DIR/examples/"
cp ERROR_CODES.md "$SKILL_DIR/"
cp DEPLOY.md "$SKILL_DIR/"
cp COMMITS.md "$SKILL_DIR/"

# 复制配置文件
cp .env.example "$SKILL_DIR/"
cp tsconfig.json "$SKILL_DIR/"

# 复制.gitignore
cp .gitignore "$SKILL_DIR/"

# 创建安装脚本
cat > "$SKILL_DIR/install.sh" << 'EOF'
#!/bin/bash
# jimeng-ai 技能安装脚本

echo "📦 安装 jimeng-ai 技能..."

# 安装依赖
if [ ! -d "node_modules" ]; then
    echo "📦 安装依赖..."
    npm install
fi

# 配置环境变量
if [ ! -f ".env" ]; then
    echo "⚠️  创建 .env 文件并配置凭证..."
    cp .env.example .env
    echo "⚠️  请编辑 .env 文件，填入你的火山引擎凭证"
    echo "   VOLCENGINE_AK=your-access-key"
    echo "   VOLCENGINE_SK=your-secret-key"
    echo "   然后重新运行本脚本"
    exit 1
fi

echo "✅ jimeng-ai 技能安装完成！"
echo ""
echo "📚 使用文档:"
echo "   README.md - 完整使用文档"
echo "   SKILL.md - 技能定义"
echo "   examples/prompts.md - 提示词示例"
echo "   examples/usage.md - 使用示例"
echo ""
echo "🚀 快速开始:"
echo "   npx ts-node scripts/text2image.ts \"一只可爱的猫咪\" --version v40"
echo "   npx ts-node scripts/text2video.ts \"猫咪在草地上奔跑\" --duration 5"
EOF

chmod +x "$SKILL_DIR/install.sh"

# 创建卸载脚本
cat > "$SKILL_DIR/uninstall.sh" << 'EOF'
#!/bin/bash
# jimeng-ai 技能卸载脚本

echo "🗑️ 卸载 jimeng-ai 技能..."

# 清理配置文件
if [ -f ".env" ]; then
    echo "⚠️ 保留 .env 文件（包含敏感信息）"
fi

echo "✅ jimeng-ai 技能已卸载（代码文件保留）"
EOF

chmod +x "$SKILL_DIR/uninstall.sh"

# 创建README（用于技能商店）
cat > "$SKILL_DIR/SKILL-README.md" << 'EOF'
# 即梦AI - 文生图/文生视频技能

版本: v1.1.0
作者: aiwell0721
协议: MIT

## 功能

将文本转换为高质量图片或视频，基于火山引擎即梦AI

### 主要功能

- 文生图 v4.0 - 高质量AI图片生成
- 文生视频 v3.0 - 1080P高清视频生成
- 断点续传 - MD5去重，避免重复
- 智能重试 - 网络波动自动重试
- 分级日志 - 清晰的调试和监控

### 安装

```bash
cd jimeng-ai
npm install
cp .env.example .env
# 编辑 .env 填入凭证
```

### 使用

```bash
# 文生图
npx ts-node scripts/text2image.ts "提示词" --version v40

# 文生视频
npx ts-node scripts/text2video.ts "提示词" --duration 5
```

### 文档

- README.md - 完整使用文档
- SKILL.md - 技能定义
- examples/prompts.md - 提示词示例
- examples/usage.md - 使用示例
- ERROR_CODES.md - 错误码说明
EOF

echo "✅ 技能包创建完成: $SKILL_DIR"
echo ""
echo "📦 技能包包含:"
ls -la "$SKILL_DIR" | head -20
echo ""
echo "🚀 下一步："
echo "1. 查看 SKILL.md 了解技能定义"
echo "2. 查看 README.md 了解使用方法"
echo "3. 查看 examples/prompts.md 了解提示词技巧"
EOF

echo ""
echo "🎉 技能打包完成！"
echo "📦 技能包位置: $SKILL_DIR"
echo ""
echo "📝 可以将技能包部署到："
echo "   - OpenClaw 技能商店"
echo "   - 本地技能库"
echo ""
echo "⚠️  注意事项："
echo "   1. 使用前需要配置环境变量（VOLCENGINE_AK、VOLCENGINE_SK）"
echo "   2. 不要将 .env 文件包含在技能包中"
echo "   3. API调用需要网络连接"
