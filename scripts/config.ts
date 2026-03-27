/**
 * 配置管理模块
 * 从环境变量和默认值读取配置
 */

import * as path from 'path';
import { log } from './logger';

export interface Config {
  // API凭证
  accessKey: string;
  secretKey: string;
  securityToken?: string;

  // API配置
  apiEndpoint: string;
  region: string;
  service: string;
  version: string;
  timeout: number;

  // 重试配置
  maxRetries: number;
  retryDelay: number;

  // 输出配置
  outputDir: string;

  // 日志配置
  debug: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

/**
 * 获取环境变量值
 */
function getEnv(key: string, defaultValue?: string): string {
  const value = process.env[key];
  if (value === undefined || value === null || value === '') {
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    throw new Error(`环境变量 ${key} 未设置`);
  }
  return value;
}

/**
 * 获取数字环境变量
 */
function getEnvNumber(key: string, defaultValue: number): number {
  const value = process.env[key];
  if (value === undefined || value === null || value === '') {
    return defaultValue;
  }
  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) {
    log.warn(`环境变量 ${key} 不是有效的数字，使用默认值 ${defaultValue}`);
    return defaultValue;
  }
  return parsed;
}

/**
 * 获取布尔环境变量
 */
function getEnvBoolean(key: string, defaultValue: boolean): boolean {
  const value = process.env[key];
  if (value === undefined || value === null || value === '') {
    return defaultValue;
  }
  return value === 'true' || value === '1';
}

/**
 * 加载配置
 */
export function loadConfig(): Config {
  try {
    const config: Config = {
      // API凭证
      accessKey: getEnv('VOLCENGINE_AK'),
      secretKey: getEnv('VOLCENGINE_SK'),
      securityToken: process.env.VOLCENGINE_TOKEN,

      // API配置
      apiEndpoint: getEnv('VOLCENGINE_API_ENDPOINT', 'https://open.volcengineapi.com/'),
      region: getEnv('VOLCENGINE_REGION', 'cn-beijing'),
      service: getEnv('VOLCENGINE_SERVICE', 'cv'),
      version: getEnv('VOLCENGINE_VERSION', '2024-06-06'),
      timeout: getEnvNumber('VOLCENGINE_TIMEOUT', 30000),

      // 重试配置
      maxRetries: getEnvNumber('MAX_RETRIES', 3),
      retryDelay: getEnvNumber('RETRY_DELAY', 1000),

      // 输出配置
      outputDir: getEnv('OUTPUT_DIR', './output'),

      // 日志配置
      debug: getEnvBoolean('DEBUG', false),
      logLevel: getEnv('LOG_LEVEL', 'info') as 'debug' | 'info' | 'warn' | 'error'
    };

    // 验证必需配置
    if (!config.accessKey || config.accessKey === 'your-access-key-here') {
      throw new Error('请设置有效的 VOLCENGINE_AK 环境变量');
    }

    if (!config.secretKey || config.secretKey === 'your-secret-key-here') {
      throw new Error('请设置有效的 VOLCENGINE_SK 环境变量');
    }

    // 规范化输出目录路径
    config.outputDir = path.resolve(process.cwd(), config.outputDir);

    log.debug('配置加载成功:', {
      hasAccessKey: !!config.accessKey,
      hasSecretKey: !!config.secretKey,
      hasSecurityToken: !!config.securityToken,
      apiEndpoint: config.apiEndpoint,
      timeout: config.timeout,
      maxRetries: config.maxRetries
    });

    return config;
  } catch (err: any) {
    log.error('配置加载失败:', err.message);
    throw err;
  }
}

// 全局配置实例（懒加载）
let globalConfig: Config | null = null;

/**
 * 获取全局配置
 */
export function getConfig(): Config {
  if (!globalConfig) {
    globalConfig = loadConfig();
  }
  return globalConfig;
}

/**
 * 重置全局配置（用于测试）
 */
export function resetConfig(): void {
  globalConfig = null;
}

/**
 * 验证配置
 */
export function validateConfig(config: Config): void {
  const errors: string[] = [];

  if (!config.accessKey) {
    errors.push('缺少 accessKey');
  }

  if (!config.secretKey && !config.securityToken) {
    errors.push('缺少 secretKey 或 securityToken');
  }

  if (config.maxRetries < 0 || config.maxRetries > 10) {
    errors.push('maxRetries 必须在 0-10 之间');
  }

  if (config.retryDelay < 100 || config.retryDelay > 60000) {
    errors.push('retryDelay 必须在 100-60000 毫秒之间');
  }

  if (config.timeout < 1000 || config.timeout > 120000) {
    errors.push('timeout 必须在 1000-120000 毫秒之间');
  }

  if (errors.length > 0) {
    throw new Error(`配置验证失败:\n${errors.join('\n')}`);
  }
}
