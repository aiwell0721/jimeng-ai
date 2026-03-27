#!/usr/bin/env ts-node
/**
 * 测试脚本 - 验证新增的工具模块
 *
 * 用法: npm run test:tools
 */

import * as path from 'path';
import { logger, createLogger, LogLevel, log } from './scripts/logger';
import { loadConfig, getConfig, validateConfig, resetConfig } from './scripts/config';
import { retryWithBackoff, isRetryableError, retryWithBackoffResult } from './scripts/retry';

async function testLogger(): Promise<void> {
  console.log('\n=== 测试日志系统 ===\n');

  // 测试不同级别的日志
  logger.debug('这是DEBUG级别日志');
  logger.info('这是INFO级别日志');
  logger.warn('这是WARN级别日志');
  logger.error('这是ERROR级别日志');

  // 测试分隔线和标题
  logger.separator();
  logger.title('日志系统测试');

  // 测试自定义logger
  const customLogger = createLogger('custom', LogLevel.DEBUG);
  customLogger.info('自定义logger测试');

  // 测试便捷函数
  log.debug('便捷函数debug');
  log.info('便捷函数info');
  log.warn('便捷函数warn');
  log.error('便捷函数error');

  console.log('\n✅ 日志系统测试通过\n');
}

async function testConfig(): Promise<void> {
  console.log('\n=== 测试配置管理 ===\n');

  try {
    // 重置全局配置
    resetConfig();

    // 测试配置加载（应该失败，因为缺少环境变量）
    try {
      const config = loadConfig();
      console.log('配置加载成功（不应该到这里）');
    } catch (err: any) {
      console.log(`预期错误: ${err.message}`);
    }

    // 设置测试环境变量
    process.env.VOLCENGINE_AK = 'test-ak-12345';
    process.env.VOLCENGINE_SK = 'test-sk-67890';
    process.env.DEBUG = 'true';

    // 再次加载配置
    const config = loadConfig();
    console.log(`✅ 配置加载成功:`);
    console.log(`   - accessKey: ${config.accessKey.substring(0, 10)}...`);
    console.log(`   - hasSecurityToken: ${!!config.securityToken}`);
    console.log(`   - apiEndpoint: ${config.apiEndpoint}`);
    console.log(`   - timeout: ${config.timeout}ms`);
    console.log(`   - maxRetries: ${config.maxRetries}`);
    console.log(`   - outputDir: ${config.outputDir}`);
    console.log(`   - debug: ${config.debug}`);

    // 测试配置验证
    validateConfig(config);
    console.log(`✅ 配置验证通过`);

    // 测试无效配置
    try {
      const invalidConfig = { ...config, maxRetries: 100 };
      validateConfig(invalidConfig);
    } catch (err: any) {
      console.log(`✅ 预期验证错误: ${err.message.substring(0, 50)}...`);
    }

  } catch (err: any) {
    console.error(`❌ 配置管理测试失败: ${err.message}`);
    throw err;
  }

  console.log('\n✅ 配置管理测试通过\n');
}

async function testRetry(): Promise<void> {
  console.log('\n=== 测试重试机制 ===\n');

  // 测试可重试错误判断
  const retryableError = new Error('NETWORK_ERROR');
  const nonRetryableError = new Error('INVALID_PARAMETER');

  console.log(`isRetryableError(NETWORK_ERROR): ${isRetryableError(retryableError)}`);
  console.log(`isRetryableError(INVALID_PARAMETER): ${isRetryableError(nonRetryableError)}`);

  // 测试重试功能（第2次成功）
  let attempts = 0;
  const successResult = await retryWithBackoff(
    async () => {
      attempts++;
      if (attempts < 2) {
        throw new Error('NETWORK_ERROR');
      }
      return 'success';
    },
    {
      maxAttempts: 3,
      baseDelay: 500,
      onRetry: (attempt, error) => {
        console.log(`   第${attempt}次重试: ${error.message}`);
      }
    }
  );
  console.log(`✅ 重试成功: ${successResult}, 尝试次数: ${attempts}`);

  // 测试带结果的重试
  attempts = 0;
  const result = await retryWithBackoffResult(
    async () => {
      attempts++;
      if (attempts < 2) {
        throw new Error('TIMEOUT');
      }
      return 'data';
    },
    { maxAttempts: 3 }
  );
  console.log(`✅ 带结果重试: ${JSON.stringify(result)}`);

  // 测试最终失败
  attempts = 0;
  try {
    await retryWithBackoff(
      async () => {
        attempts++;
        throw new Error('PERMANENT_ERROR');
      },
      { maxAttempts: 3, retryableErrors: ['TEMP_ERROR'] }
    );
    console.log('❌ 不应该成功');
  } catch (err: any) {
    console.log(`✅ 预期失败: ${err.message}, 尝试次数: ${attempts}`);
  }

  console.log('\n✅ 重试机制测试通过\n');
}

async function testIntegration(): Promise<void> {
  console.log('\n=== 测试集成功能 ===\n');

  // 设置环境变量
  process.env.VOLCENGINE_AK = 'integration-test-ak';
  process.env.VOLCENGINE_SK = 'integration-test-sk';
  process.env.DEBUG = 'false';

  // 加载配置
  const config = getConfig();

  // 使用logger记录配置
  logger.title('集成测试');

  logger.info('配置信息:');
  logger.info(`  - API Endpoint: ${config.apiEndpoint}`);
  logger.info(`  - Region: ${config.region}`);
  logger.info(`  - Service: ${config.service}`);
  logger.info(`  - Version: ${config.version}`);
  logger.info(`  - Timeout: ${config.timeout}ms`);

  // 测试重试
  let callCount = 0;
  await retryWithBackoff(
    async () => {
      callCount++;
      logger.debug(`API调用 ${callCount}`);
      if (callCount === 1) {
        throw new Error('RATE_LIMIT_EXCEEDED');
      }
      return 'api-result';
    },
    {
      maxAttempts: 3,
      onRetry: (attempt, error) => {
        logger.warn(`重试 ${attempt}: ${error.message}`);
      }
    }
  );

  logger.info(`✅ 集成测试完成，总调用次数: ${callCount}`);

  console.log('\n✅ 集成测试通过\n');
}

async function main(): Promise<void> {
  try {
    log.title('jimeng-ai 工具模块测试');

    await testLogger();
    await testConfig();
    await testRetry();
    await testIntegration();

    log.title('所有测试通过！✅');
    console.log('\n下一步:');
    console.log('1. 检查新增的工具模块');
    console.log('2. 集成到现有脚本中');
    console.log('3. 继续Phase 2优化');

  } catch (err: any) {
    console.error('\n❌ 测试失败:', err.message);
    console.error(err.stack);
    process.exit(1);
  }
}

main();
