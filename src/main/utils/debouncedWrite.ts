import * as fs from 'fs';
import * as path from 'path';

/**
 * Debounced file write manager
 * Batches multiple write requests to reduce I/O operations
 * This helps avoid antimalware false positives from high-frequency writes
 */

interface PendingWrite {
  filePath: string;
  data: any;
  timeout: NodeJS.Timeout;
  resolve: (value: { success: boolean; error?: string }) => void;
  reject: (error: Error) => void;
}

class DebouncedWriteManager {
  private pendingWrites: Map<string, PendingWrite> = new Map();
  private defaultDelay: number;

  constructor(delayMs: number = 2000) {
    this.defaultDelay = delayMs;
  }

  /**
   * Schedule a debounced write
   * If multiple writes to the same file occur within the delay period,
   * only the last one will be written
   */
  write(
    filePath: string,
    data: any,
    delayMs?: number
  ): Promise<{ success: boolean; error?: string }> {
    const delay = delayMs ?? this.defaultDelay;

    return new Promise((resolve, reject) => {
      // Cancel any pending write to this file
      const existing = this.pendingWrites.get(filePath);
      if (existing) {
        clearTimeout(existing.timeout);
        // Resolve the previous promise with the new data
        existing.resolve({ success: true });
      }

      // Schedule the new write
      const timeout = setTimeout(async () => {
        this.pendingWrites.delete(filePath);

        try {
          const dataDir = path.dirname(filePath);

          // Ensure directory exists
          if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
          }

          // Write the file
          fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');

          resolve({ success: true });
        } catch (error) {
          console.error(`Debounced write failed for ${filePath}:`, error);
          reject(error instanceof Error ? error : new Error(String(error)));
        }
      }, delay);

      // Store the pending write
      this.pendingWrites.set(filePath, {
        filePath,
        data,
        timeout,
        resolve,
        reject,
      });
    });
  }

  /**
   * Force immediate write of all pending writes
   * Useful for app shutdown or critical save points
   */
  async flushAll(): Promise<void> {
    const promises: Promise<void>[] = [];

    for (const [filePath, pending] of this.pendingWrites.entries()) {
      clearTimeout(pending.timeout);

      promises.push(
        (async () => {
          try {
            const dataDir = path.dirname(filePath);

            if (!fs.existsSync(dataDir)) {
              fs.mkdirSync(dataDir, { recursive: true });
            }

            fs.writeFileSync(filePath, JSON.stringify(pending.data, null, 2), 'utf8');
            pending.resolve({ success: true });
          } catch (error) {
            console.error(`Flush failed for ${filePath}:`, error);
            pending.reject(error instanceof Error ? error : new Error(String(error)));
          }
        })()
      );
    }

    this.pendingWrites.clear();
    await Promise.all(promises);
  }

  /**
   * Flush a specific file immediately
   */
  async flush(filePath: string): Promise<void> {
    const pending = this.pendingWrites.get(filePath);
    if (!pending) return;

    clearTimeout(pending.timeout);
    this.pendingWrites.delete(filePath);

    try {
      const dataDir = path.dirname(filePath);

      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      fs.writeFileSync(filePath, JSON.stringify(pending.data, null, 2), 'utf8');
      pending.resolve({ success: true });
    } catch (error) {
      console.error(`Flush failed for ${filePath}:`, error);
      pending.reject(error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Cancel a pending write
   */
  cancel(filePath: string): void {
    const pending = this.pendingWrites.get(filePath);
    if (pending) {
      clearTimeout(pending.timeout);
      pending.resolve({ success: true }); // Resolve with success (write was superseded)
      this.pendingWrites.delete(filePath);
    }
  }

  /**
   * Get the number of pending writes
   */
  getPendingCount(): number {
    return this.pendingWrites.size;
  }
}

// Singleton instance with 2-second debounce (reduces I/O by ~80-90%)
export const debouncedWriter = new DebouncedWriteManager(2000);

// Export the class for testing or custom instances
export { DebouncedWriteManager };
