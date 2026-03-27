# 错误码说明文档

本文档详细说明了即梦AI API可能返回的错误码及其含义。

---

## 错误码列表

### 凭证相关错误

| 错误码 | 说明 | 解决方案 |
|-------|------|---------|
| `MISSING_CREDENTIALS` | 缺少API凭证 | 检查环境变量 `VOLCENGINE_AK` 和 `VOLCENGINE_SK` |
| `INVALID_CREDENTIALS` | 凭证无效 | 检查AK和SK是否正确，重新生成凭证 |
| `CREDENTIALS_EXPIRED` | 凭证已过期 | 更换新的Access Key和Secret Key |
| `TOKEN_EXPIRED` | Security Token已过期 | 重新生成临时Security Token |

### 参数相关错误

| 错误码 | 说明 | 解决方案 |
|-------|------|---------|
| `INVALID_PARAMETER` | 参数无效 | 检查参数是否符合API规范 |
| `MISSING_REQUIRED_PARAMETER` | 缺少必需参数 | 检查是否传递了所有必需参数 |
| `PARAMETER_OUT_OF_RANGE` | 参数超出范围 | 检查参数是否在允许范围内 |
| `UNSUPPORTED_VERSION` | 不支持的版本 | 使用支持的版本：v30、v31、v40 |
| `UNSUPPORTED_RATIO` | 不支持的宽高比 | 使用支持的宽高比 |

### 任务相关错误

| 错误码 | 说明 | 解决方案 |
|-------|------|---------|
| `TASK_NOT_FOUND` | 任务不存在 | 检查taskId是否正确 |
| `TASK_EXPIRED` | 任务已过期 | 重新提交任务 |
| `TASK_FAILED` | 任务执行失败 | 查看任务详情，调整参数后重试 |
| `TASK_TIMEOUT` | 任务超时 | 增加等待时间或优化提示词 |
| `TASK_IN_QUEUE` | 任务排队中 | 等待任务处理完成 |

### 速率限制错误

| 错误码 | 说明 | 解决方案 |
|-------|------|---------|
| `RATE_LIMIT_EXCEEDED` | 超出速率限制 | 降低请求频率，等待一段时间后重试 |
| `QUOTA_EXCEEDED` | 超出配额 | 检查账户配额，升级套餐或等待配额重置 |
| `CONCURRENT_LIMIT_EXCEEDED` | 超出并发限制 | 减少并发任务数量 |

### 网络相关错误

| 错误码 | 说明 | 解决方案 |
|-------|------|---------|
| `NETWORK_ERROR` | 网络错误 | 检查网络连接，重试 |
| `TIMEOUT` | 请求超时 | 增加超时时间或优化网络 |
| `DNS_ERROR` | DNS解析失败 | 检查DNS配置，使用备用DNS |

### API相关错误

| 错误码 | 说明 | 解决方案 |
|-------|------|---------|
| `API_UNAVAILABLE` | API服务不可用 | 等待服务恢复或联系技术支持 |
| `INTERNAL_ERROR` | 内部错误 | 联系技术支持 |
| `SERVICE_BUSY` | 服务繁忙 | 稍后重试 |

---

## 常见错误处理示例

### 1. 凭证错误处理

```typescript
try {
  const result = await generateImage(prompt);
} catch (err: any) {
  if (err.message === 'MISSING_CREDENTIALS') {
    console.error('请设置环境变量 VOLCENGINE_AK 和 VOLCENGINE_SK');
  } else if (err.code === 'INVALID_CREDENTIALS') {
    console.error('API凭证无效，请检查AK和SK');
  }
}
```

### 2. 速率限制处理

```typescript
try {
  const result = await generateImage(prompt);
} catch (err: any) {
  if (err.code === 'RATE_LIMIT_EXCEEDED') {
    console.error('请求过于频繁，请稍后重试');
    // 等待60秒后重试
    await new Promise(r => setTimeout(r, 60000));
  }
}
```

### 3. 任务失败处理

```typescript
try {
  const result = await waitForTask(taskId);
} catch (err: any) {
  if (err.code === 'TASK_FAILED') {
    console.error('任务执行失败，请检查提示词或参数');
  } else if (err.code === 'TASK_TIMEOUT') {
    console.error('任务超时，请尝试更简单的提示词');
  }
}
```

---

## 错误处理最佳实践

### 1. 始终捕获异常

```typescript
try {
  // API调用
} catch (err) {
  // 记录错误日志
  console.error('操作失败:', err);
  // 提供用户友好的错误信息
  throw new Error('操作失败，请稍后重试');
}
```

### 2. 使用重试机制

```typescript
await retryWithBackoff(
  () => generateImage(prompt),
  3,  // 最多重试3次
  1000 // 基础延迟1秒
);
```

### 3. 提供有用的错误信息

```typescript
throw new Error(
  `文生图失败: ${error.message}\n` +
  `提示词: ${prompt}\n` +
  `版本: ${version}\n` +
  `请检查参数后重试`
);
```

---

## 联系支持

如果遇到未列出的错误或需要技术支持：

- 📧 邮箱: support@volcengine.com
- 💬 官方文档: https://www.volcengine.com/docs/85621/1820192
- 🐛 问题反馈: https://github.com/aiwell0721/jimeng-ai/issues

---

*最后更新: 2026-03-27*
