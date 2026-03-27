/**
 * 重试机制工具
 * 提供指数退避重试、错误分类、重试策略
 */

import { log } from './logger';

export interface RetryOptions {
  maxAttempts?: number;
  baseDelay?: number;
  maxDelay?: number;
  backoffFactor?: number;
  retryableErrors?: string[];
  onRetry?: (attempt: number, error: Error) => void;
}

export interface RetryResult<T> {
  success: boolean;
  data?: T;
  error?: Error;
  attempts: number;
}

/**
 * 默认可重试的错误列表
 */
const DEFAULT_RETRYABLE_ERRORS = [
  'ECONNRESET',
  'ETIMEDOUT',
  'ENOTFOUND',
  'ECONNREFUSED',
  'RATE_LIMIT_EXCEEDED',
  'TIMEOUT',
  'NETWORK_ERROR'
];

/**
 * 判断错误是否可重试
 */
export function isRetryableError(error: Error, retryableErrors?: string[]): boolean {
  const errorList = retryableErrors || DEFAULT_RETRYABLE_ERRORS;

  // 检查错误消息
  if (error.message) {
    for (const retryable of errorList) {
      if (error.message.includes(retryable)) {
        return true;
      }
    }
  }

  // 检查错误码
  if ((error as any).code) {
    return errorList.includes((error as any).code);
  }

  return false;
}

/**
 * 指数退避重试
 * @param fn 要执行的函数
 * @param options 重试选项
 * @returns 函数执行结果
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    baseDelay = 1000,
    maxDelay = 30000,
    backoffFactor = 2,
    retryableErrors = DEFAULT_RETRYABLE_ERRORS,
    onRetry
  } = options;

  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      log.debug(`[重试 ${attempt}/${maxAttempts}] 执行函数...`);
      const result = await fn();
      log.debug(`[重试 ${attempt}/${maxAttempts}] 执行成功`);
      return result;
    } catch (error) {
      lastError = error as Error;

      // 如果是最后一次尝试，不再重试
      if (attempt === maxAttempts) {
        log.error(`[重试 ${attempt}/${maxAttempts}] 已达最大重试次数，放弃`);
        throw lastError;
      }

      // 检查是否可重试
      if (!isRetryableError(lastError, retryableErrors)) {
        log.error(`[重试 ${attempt}/${maxAttempts}] 错误不可重试: ${lastError.message}`);
        throw lastError;
      }

      // 计算延迟时间（指数退避）
      const delay = Math.min(
        baseDelay * Math.pow(backoffFactor, attempt - 1),
        maxDelay
      );

      log.warn(
        `[重试 ${attempt}/${maxAttempts}] 失败: ${lastError.message}，${delay}ms后重试...`
      );

      // 调用重试回调
      if (onRetry) {
        onRetry(attempt, lastError);
      }

      // 等待
      await new Promise<void>((resolve) => {
        setTimeout(resolve, delay);
      });
    }
  }

  // 理论上不会到达这里，但TypeScript需要
  throw lastError!;
}

/**
 * 带结果的重试
 * @param fn 要执行的函数
 * @param options 重试选项
 * @returns 重试结果（包含成功/失败信息）
 */
export async function retryWithBackoffResult<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<RetryResult<T>> {
  const {
    maxAttempts = 3,
    baseDelay = 1000,
    maxDelay = 30000,
    backoffFactor = 2,
    retryableErrors = DEFAULT_RETRYABLE_ERRORS,
    onRetry
  } = options;

  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      log.debug(`[重试 ${attempt}/${maxAttempts}] 执行函数...`);
      const data = await fn();
      log.debug(`[重试 ${attempt}/${maxAttempts}] 执行成功`);
      return {
        success: true,
        data,
        attempts: attempt
      };
    } catch (error) {
      lastError = error as Error;

      // 如果是最后一次尝试，返回失败结果
      if (attempt === maxAttempts) {
        log.error(`[重试 ${attempt}/${maxAttempts}] 已达最大重试次数`);
        return {
          success: false,
          error: lastError,
          attempts: attempt
        };
      }

      // 检查是否可重试
      if (!isRetryableError(lastError, retryableErrors)) {
        log.error(`[重试 ${attempt}/${maxAttempts}] 错误不可重试`);
        return {
          success: false,
          error: lastError,
          attempts: attempt
        };
      }

      // 计算延迟时间
      const delay = Math.min(
        baseDelay * Math.pow(backoffFactor, attempt - 1),
        maxDelay
      );

      log.warn(
        `[重试 ${attempt}/${maxAttempts}] 失败，${delay}ms后重试...`
      );

      // 调用重试回调
      if (onRetry) {
        onRetry(attempt, lastError);
      }

      // 等待
      await new Promise<void>((resolve) => {
        setTimeout(resolve, delay);
      });
    }
  }

  // 理论上不会到达这里
  return {
    success: false,
    error: lastError!,
    attempts: maxAttempts
  };
}

/**
 * 批量重试
 * @param tasks 任务数组
 * @param options 重试选项
 * @returns 结果数组
 */
export async function retryBatch<T>(
  tasks: Array<() => Promise<T>>,
  options: RetryOptions = {}
): Promise<RetryResult<T>[]> {
  log.info(`开始批量重试，共 ${tasks.length} 个任务`);
  const results: RetryResult<T>[] = [];

  for (let i = 0; i < tasks.length; i++) {
    log.info(`处理任务 ${i + 1}/${tasks.length}...`);
    const result = await retryWithBackoffResult(tasks[i], options);
    results.push(result);

    if (result.success) {
      log.info(`任务 ${i + 1} 成功`);
    } else {
      log.error(`任务 ${i + 1} 失败: ${result.error?.message}`);
    }
  }

  const successCount = results.filter(r => r.success).length;
  log.info(`批量重试完成: ${successCount}/${tasks.length} 成功`);

  return results;
}

/**
 * 创建重试包装器
 * @param fn 要包装的函数
 * @param options 重试选项
 * @returns 包装后的函数
 */
export function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): () => Promise<T> {
  return () => retryWithBackoff(fn, options);
}
