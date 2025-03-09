import path from 'path';
import { Worker } from 'worker_threads';
import { WorkerResponse, ERROR_TIMEOUT_MESSAGE, MAX_TIME_MATH } from './worker';

export { ERROR_TIMEOUT_MESSAGE as MATH_ERROR_TIMEOUT_MESSAGE };


export class MathWorker {
  private worker: Worker | null = null;
  private isProcessing: boolean;
  private pendingEquations: Array<{
    equation: string;
    resolve: (result: string) => void;
    reject: (error: Error) => void;
    timeoutId: NodeJS.Timeout;
  }>;
  private terminateAfterTimeout: NodeJS.Timeout | null = null;

  constructor(terminateAfter: number = 60000) {
    this.isProcessing = false;
    this.pendingEquations = [];
    if (terminateAfter) {
      this.terminateAfterTimeout = setTimeout(() => this.terminate(), terminateAfter);
    }
  }

  async initialize() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    this.worker = await this.createWorker();
  }

  private async createWorker(): Promise<Worker> {
    const worker = new Worker(path.join(__dirname, 'worker.js'));
    await this.setupEventHandlers(worker);
    return worker;
  }

  private async setupEventHandlers(worker: Worker): Promise<void> {
    return new Promise((resolve, reject) => {
      worker.on('error', async (error: Error) => {
        console.error('Worker error:', error);
        await this.handleWorkerFailure(error);
        reject(error);
      });

      worker.on('exit', async (code: number) => {
        if (code !== 0) {
          console.error(`Worker stopped with exit code ${code}`);
          const error = new Error(`Worker stopped with exit code ${code}`);
          await this.handleWorkerFailure(error);
          reject(error);
        }
        reject();
      });

      worker.on('message', (response: WorkerResponse) => {
        this.handleWorkerResponse(response);
      });

      const timeoutId = setTimeout(() => {
        reject(new Error('Math Worker took too long to initialize'));
      }, 1000);

      worker.on('online', () => {
        clearTimeout(timeoutId);
        resolve();
      });
    });
  }

  private async handleWorkerFailure(error: Error): Promise<void> {
    // Clear current equation
    const currentEquation = this.pendingEquations.shift();
    if (currentEquation) {
      clearTimeout(currentEquation.timeoutId);
      currentEquation.reject(error);
    }

    // Recreate worker
    await this.initialize();
    this.isProcessing = false;

    // Process next equation if any
    this.processNextEquation();
  }

  private handleWorkerResponse(response: WorkerResponse): void {
    const currentEquation = this.pendingEquations.shift();
    if (!currentEquation) return;

    clearTimeout(currentEquation.timeoutId);

    if (response.success && response.result !== undefined) {
      currentEquation.resolve(response.result);
    } else {
      currentEquation.reject(new Error(response.error || 'Unknown error'));
    }

    this.isProcessing = false;
    this.processNextEquation();
  }

  private processNextEquation(): void {
    if (this.isProcessing || this.pendingEquations.length === 0 || !this.worker) return;

    const nextEquation = this.pendingEquations[0];
    if (!nextEquation) return;

    this.isProcessing = true;
    this.worker.postMessage({ equation: nextEquation.equation });
  }

  public async evaluate(equation: string, timeout: number = MAX_TIME_MATH): Promise<string> {
    if (!this.worker) {
      await this.initialize();
    }
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(async () => {
        const index = this.pendingEquations.findIndex(eq => eq.timeoutId === timeoutId);
        if (index !== -1) {
          this.pendingEquations.splice(index, 1);
          if (index === 0 && this.isProcessing) {
            await this.initialize();
            this.isProcessing = false;
            this.processNextEquation();
          }
        }
        reject(new Error(`${ERROR_TIMEOUT_MESSAGE} after ${timeout}ms`));
      }, timeout);

      this.pendingEquations.push({ equation, resolve, reject, timeoutId });
      if (!this.isProcessing) {
        this.processNextEquation();
      }
    });
  }

  public terminate(): void {
    for (const eq of this.pendingEquations) {
      clearTimeout(eq.timeoutId);
      eq.reject(new Error('Worker terminated'));
    }
    this.pendingEquations = [];
    if (this.worker) {
      this.worker.terminate();
    }
    if (this.terminateAfterTimeout) {
      clearTimeout(this.terminateAfterTimeout);
    }
  }
}
