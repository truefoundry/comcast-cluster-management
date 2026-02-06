import { Logger } from '@nestjs/common';

/**
 * Configuration options for the retry utility
 */
export interface RetryOptions {
  /** Maximum number of retry attempts */
  maxRetries: number;
  /** Delay in milliseconds between retries */
  delayMs: number;
  /** Optional logger instance for logging success/retry messages */
  logger?: Logger;
  /** Name of the operation (for error messages) */
  operationName: string;
  /** Message to log on success */
  successMessage: string;
  /** Function to generate retry message for each attempt */
  retryMessage: (attempt: number, maxRetries: number) => string;
  /** Optional function to determine if an error is retryable (default: always retry) */
  isRetryable?: (error: Error) => boolean;
}

/**
 * Generic retry utility for async operations
 *
 * @param operation - The async function to execute
 * @param options - Configuration for retry behavior and logging
 * @returns The result of the operation if successful
 * @throws The last error if all retries are exhausted
 *
 * @example
 * ```typescript
 * const result = await withRetry(
 *   () => fetchData(),
 *   {
 *     maxRetries: 3,
 *     delayMs: 1000,
 *     logger: this.logger,
 *     operationName: 'fetchData',
 *     successMessage: 'Data fetched successfully',
 *     retryMessage: (attempt, max) => `Fetch failed, retrying in 1s`,
 *     isRetryable: (error) => error.message.includes('timeout'),
 *   },
 * );
 * ```
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions,
): Promise<T> {
  const {
    maxRetries,
    delayMs,
    logger,
    successMessage,
    retryMessage,
    isRetryable,
  } = options;

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await operation();
      logger?.log(successMessage);
      return result;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Check if error is retryable (default: always retry)
      const shouldRetry = isRetryable ? isRetryable(lastError) : true;

      if (shouldRetry && attempt < maxRetries) {
        logger?.debug(
          `${retryMessage(attempt, maxRetries)} (attempt ${attempt}/${maxRetries})`,
        );
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      } else {
        break;
      }
    }
  }

  throw lastError!;
}
