#!/usr/bin/env ts-node
/**
 * 文生图脚本 - Text to Image (优化版)
 * 支持即梦AI v3.0/v3.1/v4.0 文生图API
 * 集成了日志系统、配置管理、重试机制
 *
 * 用法: ts-node text2image.ts "提示词" [选项]
 *
 * 选项:
 *   --version <v30|v31|v40>  API版本 (默认: v31)
 *   --ratio <宽高比>         图片宽高比 (默认: 9:16)
 *   --count <数量>           生成数量 1-4 (默认: 1)
 *   --width <宽度>           指定宽度 (可选)
 *   --height <高度>          指定高度 (可选)
 *   --size <面积>            指定面积 (可选, 如 4194304 表示 2048x2048)
 *   --seed <种子>            随机种子 (可选)
 *   --output <目录>          图片下载目录 (默认: ./output)
 *   --no-download            不下载图片，只返回URL
 *   --wait                   等待任务完成
 *   --debug                  开启调试模式
 *
 * 示例:
 *   ts-node text2image.ts "一只可爱的猫咪"
 *   ts-node text2image.ts "山水风景画" --version v40 --ratio 16:9 --count 2
 *   ts-node text2image.ts "科幻城市" --width 2048 --height 1152 --output ~/Pictures
 */

import * as path from 'path';
import * as fs from 'fs';
import * as crypto from 'crypto';
import {
  REQ_KEYS,
  VALID_RATIOS,
  submitTask,
  waitForTask,
  generateOpenApiSignature,
  jsonStringify,
  API_ENDPOINT,
  VERSION,
  SUBMIT_ACTION,
  QUERY_ACTION
} from './common';
import { getConfig, Config } from './config';
import { logger } from './logger';
import { retryWithBackoff } from './retry';

interface Text2ImageOptions {
  prompt: string;
  version: 'v30' | 'v31' | 'v40';
  ratio: string;
  count: number;
  width?: number;
  height?: number;
  size?: number;
  seed?: number;
  outputDir: string;
  download: boolean;
  wait: boolean;
  debug: boolean;
}

function parseArgs(): Text2ImageOptions {
  const args = process.argv.slice(2);

  if (args.length < 1) {
    logger.error('用法: ts-node text2image.ts "提示词" [选项]');
    console.error('');
    console.error('选项:');
    console.error('  --version <v30|v31|v40>  API版本 (默认: v31)');
    console.error('  --ratio <宽高比>         图片宽高比 (默认: 9:16)');
    console.error('  --count <数量>           生成数量 1-4 (默认: 1)');
    console.error('  --width <宽度>           指定宽度 (可选)');
    console.error('  --height <高度>          指定高度 (可选)');
    console.error('  --size <面积>            指定面积 (可选)');
    console.error('  --seed <种子>            随机种子 (可选)');
    console.error('  --output <目录>          图片下载目录 (默认: ./output)');
    console.error('  --no-download            不下载图片，只返回URL');
    console.error('  --wait                   等待任务完成');
    console.error('  --debug                  开启调试模式');
    console.error('');
    console.error('支持的宽高比: ' + VALID_RATIOS.join(', '));
    console.error('');
    console.error('环境变量:');
    console.error('  VOLCENGINE_AK  火山引擎 Access Key');
    console.error('  VOLCENGINE_SK  火山引擎 Secret Key');
    console.error('  VOLCENGINE_TOKEN  火山引擎 Security Token (可选)');
    console.error('');
    console.error('配置文件:');
    console.error('  .env  - 环境变量配置文件');
    process.exit(1);
  }

  const prompt = args[0];
  let version: 'v30' | 'v31' | 'v40' = 'v31';
  let ratio = '16:9';
  let count = 1;
  let width: number | undefined;
  let height: number | undefined;
  let size: number | undefined;
  let seed: number | undefined;
  let outputDir = './output';
  let download = true;
  let wait = false;
  let debug = false;

  for (let i = 1; i < args.length; i++) {
    switch (args[i]) {
      case '--version':
        const v = args[++i];
        if (v !== 'v30' && v !== 'v31' && v !== 'v40') {
          throw new Error(`不支持的版本: ${v}，支持的值: v30, v31, v40`);
        }
        version = v;
        break;
      case '--ratio':
        ratio = args[++i];
        if (!VALID_RATIOS.includes(ratio)) {
          throw new Error(`不支持的宽高比: ${ratio}，支持的值: ${VALID_RATIOS.join(', ')}`);
        }
        break;
      case '--count':
        count = parseInt(args[++i], 10);
        if (isNaN(count) || count < 1 || count > 4) {
          throw new Error('count 必须是 1-4 之间的整数');
        }
        break;
      case '--width':
        width = parseInt(args[++i], 10);
        break;
      case '--height':
        height = parseInt(args[++i], 10);
        break;
      case '--size':
        size = parseInt(args[++i], 10);
        break;
      case '--seed':
        seed = parseInt(args[++i], 10);
        break;
      case '--output':
        outputDir = args[++i];
        break;
      case '--no-download':
        download = false;
        break;
      case '--wait':
        wait = true;
        break;
      case '--debug':
        debug = true;
        break;
    }
  }

  return { prompt, version, ratio, count, width, height, size, seed, outputDir, download, wait, debug };
}

/**
 * 计算字符串的 MD5 哈希值
 */
function md5Hash(str: string): string {
  return crypto.createHash('md5').update(str, 'utf8').digest('hex');
}

/**
 * 清理路径，防止路径遍历攻击
 * 移除 ../ 和 ./ 等危险路径段
 */
function sanitizePath(inputPath: string): string {
  const normalized = path.normalize(inputPath);
  const cleaned = normalized.replace(/^(\.\.[\/\\])+/, '');
  if (cleaned.startsWith('/') || cleaned.startsWith('\\')) {
    throw new Error('不允许使用绝对路径');
  }
  return cleaned;
}

/**
 * 获取任务文件夹路径
 * 使用 md5(提示词) 作为子文件夹名
 * 包含路径遍历防护
 */
function getTaskFolderPath(prompt: string, baseOutputDir: string): string {
  const hash = md5Hash(prompt);
  const cwd = process.cwd();
  const safeOutputDir = sanitizePath(baseOutputDir);
  const fullPath = path.join(cwd, safeOutputDir, hash);
  
  const resolvedCwd = path.resolve(cwd);
  const resolvedPath = path.resolve(fullPath);
  if (!resolvedPath.startsWith(resolvedCwd + path.sep) && resolvedPath !== resolvedCwd) {
    throw new Error('路径安全检查失败：输出目录必须在当前工作目录内');
  }
  return fullPath;
}

/**
 * 保存任务信息到文件夹
 */
function saveTaskInfo(folderPath: string, params: any, response: any, taskId: string): void {
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
  }

  const paramPath = path.join(folderPath, 'param.json');
  fs.writeFileSync(paramPath, JSON.stringify(params, null, 2), 'utf8');

  const responsePath = path.join(folderPath, 'response.json');
  fs.writeFileSync(responsePath, JSON.stringify(response, null, 2), 'utf8');

  const taskIdPath = path.join(folderPath, 'taskId.txt');
  fs.writeFileSync(taskIdPath, taskId, 'utf8');
}

/**
 * 读取已保存的任务ID
 */
function loadTaskId(folderPath: string): string | null {
  const taskIdPath = path.join(folderPath, 'taskId.txt');
  if (fs.existsSync(taskIdPath)) {
    return fs.readFileSync(taskIdPath, 'utf8').trim();
  }
  return null;
}

/**
 * 检查文件夹中是否有图片文件
 */
function hasImages(folderPath: string): boolean {
  if (!fs.existsSync(folderPath)) {
    return false;
  }
  const files = fs.readdirSync(folderPath);
  return files.some(file => {
    const ext = path.extname(file).toLowerCase();
    return ext === '.jpg' || ext === '.jpeg' || ext === '.png' || ext === '.gif' || ext === '.webp';
  });
}

/**
 * 获取文件夹中的图片文件路径列表
 */
function getImagesInFolder(folderPath: string): string[] {
  if (!fs.existsSync(folderPath)) {
    return [];
  }
  const files = fs.readdirSync(folderPath);
  const imageFiles = files.filter(file => {
    const ext = path.extname(file).toLowerCase();
    return ext === '.jpg' || ext === '.jpeg' || ext === '.png' || ext === '.gif' || ext === '.webp';
  });
  return imageFiles.map(file => path.join(folderPath, file));
}

/**
 * 将 base64 数据解码保存为图片文件
 * @returns 保存的图片文件路径列表
 */
function saveBase64Images(folderPath: string, base64Data: string[]): string[] {
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
  }

  const savedPaths: string[] = [];

  for (let i = 0; i < base64Data.length; i++) {
    const base64String = base64Data[i];
    const filename = `${i + 1}.jpg`;
    const outputPath = path.join(folderPath, filename);

    try {
      const buffer = Buffer.from(base64String, 'base64');
      fs.writeFileSync(outputPath, buffer);
      savedPaths.push(outputPath);
      logger.debug(`  保存图片: ${outputPath}`);
    } catch (err: any) {
      logger.error(`  保存图片失败: ${err.message}`);
    }
  }

  return savedPaths;
}

async function main(): Promise<void> {
  try {
    // 加载配置
    const config = getConfig();
    const options = parseArgs();

    // 设置调试模式
    if (options.debug) {
      process.env.DEBUG = 'true';
      logger.info('调试模式已启用');
    }

    logger.title('文生图任务开始');

    // 根据版本选择 req_key
    const reqKeyMap = {
      'v30': REQ_KEYS.T2I_V30,
      'v31': REQ_KEYS.T2I_V31,
      'v40': REQ_KEYS.T2I_V40
    };
    const reqKey = reqKeyMap[options.version];

    // 构建请求体 - OpenAPI 格式
    const ratioMap: Record<string, { width: number; height: number }> = {
      '1:1': { width: 2048, height: 2048 },
      '9:16': { width: 1440, height: 2560 },
      '16:9': { width: 2560, height: 1440 },
      '3:4': { width: 1728, height: 2304 },
      '4:3': { width: 2304, height: 1728 },
      '2:3': { width: 1664, height: 2496 },
      '3:2': { width: 2496, height: 1664 },
      '1:2': { width: 1440, height: 2880 },
      '2:1': { width: 2880, height: 1440 }
    };

    const ratioValue = ratioMap[options.ratio] || { width: 1440, height: 2560 };
    const body: Record<string, any> = {
      req_key: reqKey,
      prompt: options.prompt,
      force_single: options.count === 1,
      count: options.count || 1,
      width: options.width || ratioValue.width,
      height: options.height || ratioValue.height,
      scale: 0.5
    };

    if (options.seed !== undefined) {
      body.seed = options.seed;
    }

    logger.info('任务参数:', {
      version: options.version,
      ratio: options.ratio,
      count: options.count,
      width: body.width,
      height: body.height,
      promptLength: options.prompt.length
    });

    // 计算任务文件夹路径
    const taskFolderPath = getTaskFolderPath(options.prompt, options.outputDir);

    // 检查任务文件夹是否已存在
    if (fs.existsSync(taskFolderPath)) {
      // 已有任务 - 异步查询流程
      logger.info('发现已有任务，正在查询状态...');

      const taskId = loadTaskId(taskFolderPath);
      if (!taskId) {
        throw new Error('任务文件夹存在但未找到 taskId.txt');
      }

      // 检查是否已有图片文件
      if (hasImages(taskFolderPath)) {
        const existingImages = getImagesInFolder(taskFolderPath);
        logger.info(`任务已完成，图片已存在:`);
        existingImages.forEach(img => logger.info(`  - ${img}`));

        const successResult = {
          success: true,
          prompt: options.prompt,
          version: options.version,
          ratio: options.ratio,
          count: options.count,
          taskId,
          images: existingImages,
          outputDir: taskFolderPath
        };
        console.log(JSON.stringify(successResult, null, 2));
        return;
      }

      // 无图片，查询任务状态
      logger.info(`任务ID: ${taskId}`);
      logger.info('正在查询任务状态...');

      try {
        // 使用重试机制查询任务
        const result = await retryWithBackoff(
          () => waitForTask(
            config.accessKey,
            config.secretKey,
            reqKey,
            taskId,
            config.securityToken
          ),
          {
            maxAttempts: config.maxRetries,
            baseDelay: config.retryDelay,
            onRetry: (attempt, error) => {
              logger.warn(`[重试 ${attempt}/${config.maxRetries}] 查询任务: ${error.message}`);
            }
          }
        );

        // 检查是否有 base64 图片数据
        const base64Data = result?.data?.binary_data_base64;
        if (base64Data && base64Data.length > 0) {
          logger.info(`任务完成，正在保存 ${base64Data.length} 张图片...`);
          const savedPaths = saveBase64Images(taskFolderPath, base64Data);

          logger.info('任务已完成，图片保存路径:');
          savedPaths.forEach(p => logger.info(`  - ${p}`));

          const successResult = {
            success: true,
            prompt: options.prompt,
            version: options.version,
            ratio: options.ratio,
            count: options.count,
            taskId,
            images: savedPaths,
            outputDir: taskFolderPath
          };
          console.log(JSON.stringify(successResult, null, 2));
        } else {
          logger.warn('任务完成但未返回图片数据');
          const successResult = {
            success: true,
            prompt: options.prompt,
            version: options.version,
            ratio: options.ratio,
            count: options.count,
            taskId,
            images: [],
            outputDir: taskFolderPath
          };
          console.log(JSON.stringify(successResult, null, 2));
        }
      } catch (waitErr: any) {
        if (waitErr.message?.includes('超时')) {
          logger.warn(`任务未完成，TaskId: ${taskId}`);
          const pendingResult = {
            success: true,
            pending: true,
            prompt: options.prompt,
            version: options.version,
            ratio: options.ratio,
            count: options.count,
            taskId,
            folder: taskFolderPath,
            message: '任务未完成，请稍后使用相同提示词查询结果'
          };
          console.log(JSON.stringify(pendingResult, null, 2));
          return;
        } else {
          throw waitErr;
        }
      }
    } else {
      // 新任务 - 提交
      logger.info('提交新任务...');

      // 使用重试机制提交任务
      const { taskId, requestId } = await retryWithBackoff(
        () => submitTask(
          config.accessKey,
          config.secretKey,
          reqKey,
          body,
          config.securityToken
        ),
        {
          maxAttempts: config.maxRetries,
          baseDelay: config.retryDelay,
          onRetry: (attempt, error) => {
            logger.warn(`[重试 ${attempt}/${config.maxRetries}] 提交任务: ${error.message}`);
          }
        }
      );

      // 创建文件夹并保存任务信息
      fs.mkdirSync(taskFolderPath, { recursive: true });

      const paramData = {
        prompt: options.prompt,
        version: options.version,
        ratio: options.ratio,
        count: options.count,
        req_key: reqKey,
        timestamp: new Date().toISOString()
      };

      saveTaskInfo(taskFolderPath, paramData, { taskId, requestId }, taskId);

      logger.info(`任务已提交，TaskId: ${taskId}`);

      // 如果指定了 --wait，等待任务完成
      if (options.wait) {
        logger.info('等待任务完成...');
        try {
          const result = await retryWithBackoff(
            () => waitForTask(
              config.accessKey,
              config.secretKey,
              reqKey,
              taskId,
              config.securityToken
            ),
            {
              maxAttempts: config.maxRetries,
              baseDelay: config.retryDelay,
              onRetry: (attempt, error) => {
                logger.warn(`[重试 ${attempt}/${config.maxRetries}] 查询任务: ${error.message}`);
              }
            }
          );

          const base64Data = result?.data?.binary_data_base64;
          if (base64Data && base64Data.length > 0) {
            logger.info(`任务完成，正在保存 ${base64Data.length} 张图片...`);
            const savedPaths = saveBase64Images(taskFolderPath, base64Data);

            logger.info('任务已完成，图片保存路径:');
            savedPaths.forEach(p => logger.info(`  - ${p}`));

            const successResult = {
              success: true,
              prompt: options.prompt,
              version: options.version,
              ratio: options.ratio,
              count: options.count,
              taskId,
              images: savedPaths,
              outputDir: taskFolderPath
            };
            console.log(JSON.stringify(successResult, null, 2));
          } else {
            logger.warn(`任务未完成，TaskId: ${taskId}`);
            const pendingResult = {
              success: true,
              pending: true,
              prompt: options.prompt,
              version: options.version,
              ratio: options.ratio,
              count: options.count,
              taskId,
              folder: taskFolderPath,
              message: '任务未完成，请稍后使用相同提示词查询结果'
            };
            console.log(JSON.stringify(pendingResult, null, 2));
          }
        } catch (waitErr: any) {
          logger.warn(`任务未完成，TaskId: ${taskId}`);
          const pendingResult = {
            success: true,
            pending: true,
            prompt: options.prompt,
            version: options.version,
            ratio: options.ratio,
            count: options.count,
            taskId,
            folder: taskFolderPath,
            message: '任务未完成，请稍后使用相同提示词查询结果'
          };
          console.log(JSON.stringify(pendingResult, null, 2));
        }
      } else {
        // 只提交，不等待
        const result = {
          success: true,
          submitted: true,
          prompt: options.prompt,
          version: options.version,
          ratio: options.ratio,
          count: options.count,
          taskId,
          folder: taskFolderPath,
          message: '任务已提交，请稍后使用相同提示词查询结果'
        };
        console.log(JSON.stringify(result, null, 2));
      }
    }

    logger.title('文生图任务完成');

  } catch (err: any) {
    if (err.message === 'MISSING_CREDENTIALS') {
      logger.error('缺少API凭证，请设置环境变量');
      const errorResult = {
        success: false,
        error: {
          code: 'MISSING_CREDENTIALS',
          message: '请设置环境变量 VOLCENGINE_AK 和 VOLCENGINE_SK'
        }
      };
      console.error(JSON.stringify(errorResult, null, 2));
    } else {
      logger.error('任务执行失败:', err.message);
      const errorResult = {
        success: false,
        error: {
          code: err.code || 'UNKNOWN_ERROR',
          message: err.message || '未知错误'
        }
      };
      console.error(JSON.stringify(errorResult, null, 2));
    }
    process.exit(1);
  }
}

main();
