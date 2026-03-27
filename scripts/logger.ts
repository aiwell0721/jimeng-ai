/**
 * 日志系统工具
 * 提供分级日志输出、格式化、日志级别管理
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  SILENT = 99
}

export interface LogOptions {
  timestamp?: boolean;
  color?: boolean;
  prefix?: string;
}

export class Logger {
  private level: LogLevel = LogLevel.INFO;
  private options: LogOptions = {
    timestamp: true,
    color: true,
    prefix: 'jimeng-ai'
  };

  constructor(level: LogLevel = LogLevel.INFO, options?: LogOptions) {
    this.level = level;
    if (options) {
      this.options = { ...this.options, ...options };
    }
  }

  /**
   * 设置日志级别
   */
  setLevel(level: LogLevel): void {
    this.level = level;
  }

  /**
   * 设置日志选项
   */
  setOptions(options: LogOptions): void {
    this.options = { ...this.options, ...options };
  }

  /**
   * 格式化日志消息
   */
  private format(level: string, message: string, ...args: any[]): string {
    const timestamp = this.options.timestamp
      ? `[${new Date().toISOString()}]`
      : '';
    const prefix = this.options.prefix ? `[${this.options.prefix}]` : '';
    const levelTag = `[${level}]`;
    return `${timestamp}${prefix}${levelTag} ${message}`;
  }

  /**
   * 彩色输出（仅在支持的环境）
   */
  private colorize(level: LogLevel, message: string): string {
    if (!this.options.color) {
      return message;
    }

    const colors: Record<number, string> = {
      [LogLevel.DEBUG]: '\x1b[36m',    // 青色
      [LogLevel.INFO]: '\x1b[32m',     // 绿色
      [LogLevel.WARN]: '\x1b[33m',     // 黄色
      [LogLevel.ERROR]: '\x1b[31m'     // 红色
    };

    const reset = '\x1b[0m';
    const color = colors[level] || '';
    return `${color}${message}${reset}`;
  }

  /**
   * DEBUG 级别日志
   */
  debug(message: string, ...args: any[]): void {
    if (this.level <= LogLevel.DEBUG) {
      const formatted = this.format('DEBUG', message, ...args);
      const colored = this.colorize(LogLevel.DEBUG, formatted);
      console.error(colored, ...args);
    }
  }

  /**
   * INFO 级别日志
   */
  info(message: string, ...args: any[]): void {
    if (this.level <= LogLevel.INFO) {
      const formatted = this.format('INFO', message, ...args);
      const colored = this.colorize(LogLevel.INFO, formatted);
      console.log(colored, ...args);
    }
  }

  /**
   * WARN 级别日志
   */
  warn(message: string, ...args: any[]): void {
    if (this.level <= LogLevel.WARN) {
      const formatted = this.format('WARN', message, ...args);
      const colored = this.colorize(LogLevel.WARN, formatted);
      console.warn(colored, ...args);
    }
  }

  /**
   * ERROR 级别日志
   */
  error(message: string, ...args: any[]): void {
    if (this.level <= LogLevel.ERROR) {
      const formatted = this.format('ERROR', message, ...args);
      const colored = this.colorize(LogLevel.ERROR, formatted);
      console.error(colored, ...args);
    }
  }

  /**
   * 分隔线
   */
  separator(): void {
    console.error('─'.repeat(80));
  }

  /**
   * 标题
   */
  title(message: string): void {
    this.separator();
    this.info(message);
    this.separator();
  }
}

// 全局默认logger实例
export const logger = new Logger(
  process.env.DEBUG === 'true' ? LogLevel.DEBUG : LogLevel.INFO,
  {
    timestamp: true,
    color: true,
    prefix: 'jimeng-ai'
  }
);

// 导出便捷函数
export const log = {
  debug: (message: string, ...args: any[]) => logger.debug(message, ...args),
  info: (message: string, ...args: any[]) => logger.info(message, ...args),
  warn: (message: string, ...args: any[]) => logger.warn(message, ...args),
  error: (message: string, ...args: any[]) => logger.error(message, ...args),
  separator: () => logger.separator(),
  title: (message: string) => logger.title(message)
};

/**
 * 创建带前缀的logger
 */
export function createLogger(prefix: string, level?: LogLevel): Logger {
  return new Logger(level || logger['level'], {
    ...logger['options'],
    prefix
  });
}
