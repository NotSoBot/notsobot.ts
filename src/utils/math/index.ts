import path from 'path';
import { Worker } from 'worker_threads';
import { WorkerResponse, ERROR_TIMEOUT_MESSAGE, MAX_TIME_MATH } from './worker';

export { ERROR_TIMEOUT_MESSAGE as MATH_ERROR_TIMEOUT_MESSAGE };


export class MathWorker {
  private worker: Worker;
  private isProcessing: boolean;
  private pendingEquations: Array<{
    equation: string;
    resolve: (result: string) => void;
    reject: (error: Error) => void;
    timeoutId: NodeJS.Timeout;
  }>;
  private terminateAfterTimeout: NodeJS.Timeout | null = null;

  constructor(terminateAfter: number = 60000) {
    this.worker = this.createWorker();
    this.isProcessing = false;
    this.pendingEquations = [];
    if (terminateAfter) {
      this.terminateAfterTimeout = setTimeout(() => this.terminate(), terminateAfter);
    }
  }

  private createWorker(): Worker {
    const worker = new Worker(path.join(__dirname, 'worker.js'));
    this.setupEventHandlers(worker);
    return worker;
  }

  private setupEventHandlers(worker: Worker): void {
    worker.on('error', (error: Error) => {
      console.error('Worker error:', error);
      this.handleWorkerFailure(error);
    });

    worker.on('exit', (code: number) => {
      if (code !== 0) {
        console.error(`Worker stopped with exit code ${code}`);
        this.handleWorkerFailure(new Error(`Worker stopped with exit code ${code}`));
      }
    });

    worker.on('message', (response: WorkerResponse) => {
      this.handleWorkerResponse(response);
    });
  }

  private handleWorkerFailure(error: Error): void {
    // Clear current equation
    const currentEquation = this.pendingEquations.shift();
    if (currentEquation) {
      clearTimeout(currentEquation.timeoutId);
      currentEquation.reject(error);
    }

    // Recreate worker
    this.worker.terminate();
    this.worker = this.createWorker();
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
    if (this.isProcessing || this.pendingEquations.length === 0) return;

    const nextEquation = this.pendingEquations[0];
    if (!nextEquation) return;

    this.isProcessing = true;
    this.worker.postMessage({ equation: nextEquation.equation });
  }

  public async evaluate(equation: string, timeout: number = MAX_TIME_MATH): Promise<string> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        const index = this.pendingEquations.findIndex(eq => eq.timeoutId === timeoutId);
        if (index !== -1) {
          this.pendingEquations.splice(index, 1);
          if (index === 0 && this.isProcessing) {
            this.worker.terminate();
            this.worker = this.createWorker();
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
    this.worker.terminate();
    if (this.terminateAfterTimeout) {
      clearTimeout(this.terminateAfterTimeout);
    }
  }
}
