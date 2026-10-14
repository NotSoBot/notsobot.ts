import path from 'path';
import { runInNewContext } from 'vm';
import { Worker } from 'worker_threads';

import { isSimpleMath } from './tools';
import {
  executeEquation,
  WorkerResponse,
  ERROR_TIMEOUT_MESSAGE,
  MAX_TIME_MATH,
} from './worker';

export { ERROR_TIMEOUT_MESSAGE as MATH_ERROR_TIMEOUT_MESSAGE };


export class MathWorker {
  private worker: Worker | null = null;
  private workerStarting: Promise<Worker> | null = null;
  private isProcessing: boolean;
  private pendingEquations: Array<{
    equation: string;
    resolve: (result: string) => void;
    reject: (error: Error) => void;
    timeoutId: NodeJS.Timeout;
  }>;
  private terminateAfter: number;
  private terminateAfterTimeout: NodeJS.Timeout | null = null;

  constructor(terminateAfter: number = 60000) {
    this.isProcessing = false;
    this.pendingEquations = [];
    this.terminateAfter = terminateAfter;
    this.startTerminateTimer();
  }

  private startTerminateTimer(): void {
    if (this.terminateAfter && !this.terminateAfterTimeout) {
      this.terminateAfterTimeout = setTimeout(() => this.terminate(), this.terminateAfter);
    }
  }

  // only one worker is ever alive, concurrent callers share the one being started
  private async getWorker(): Promise<Worker> {
    if (this.worker) {
      return this.worker;
    }
    if (!this.workerStarting) {
      this.workerStarting = this.createWorker().finally(() => {
        this.workerStarting = null;
      });
    }
    return this.workerStarting;
  }

  private createWorker(): Promise<Worker> {
    const worker = new Worker(path.join(__dirname, 'worker.js'));
    this.worker = worker;

    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        this.killWorker(worker);
        reject(new Error('Math Worker took too long to initialize'));
      }, 1000);

      worker.on('online', () => {
        clearTimeout(timeoutId);
        resolve(worker);
      });

      worker.on('message', (response: WorkerResponse) => {
        if (worker === this.worker) {
          this.handleWorkerResponse(response);
        }
      });

      // `error` is followed by `exit`, so only handle the crash once, on exit
      worker.on('error', (error: Error) => {
        console.error('Math Worker error:', error);
      });

      worker.on('exit', (code: number) => {
        clearTimeout(timeoutId);
        reject(new Error(`Math Worker stopped with exit code ${code}`));
        // workers we terminate ourselves are detached first, so this is only an unexpected crash
        if (worker === this.worker) {
          this.worker = null;
          this.handleWorkerFailure(new Error(`Math Worker stopped with exit code ${code}`));
        }
      });
    });
  }

  // unset it before terminating so its exit isn't treated as a crash (which used to spawn a new, never terminated worker)
  // the exit listener stays so a worker killed while starting still rejects its startup promise
  private killWorker(worker: Worker | null = this.worker): void {
    if (!worker) {
      return;
    }
    if (worker === this.worker) {
      this.worker = null;
    }
    worker.removeAllListeners('message');
    worker.terminate().catch(() => {});
  }

  private handleWorkerFailure(error: Error): void {
    // the equation being processed is what crashed it
    if (this.isProcessing) {
      const currentEquation = this.pendingEquations.shift();
      if (currentEquation) {
        clearTimeout(currentEquation.timeoutId);
        currentEquation.reject(error);
      }
    }
    this.isProcessing = false;
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
    this.isProcessing = true;
    this.getWorker().then((worker) => {
      // it might've timed out while the worker was starting
      if (this.pendingEquations[0] === nextEquation) {
        worker.postMessage({equation: nextEquation.equation});
      }
    }).catch((error) => {
      if (this.pendingEquations[0] === nextEquation) {
        this.pendingEquations.shift();
        clearTimeout(nextEquation.timeoutId);
        nextEquation.reject(error);
      }
      this.isProcessing = false;
      this.processNextEquation();
    });
  }

  public async evaluate(equation: string, timeout: number = MAX_TIME_MATH): Promise<string> {
    if (isSimpleMath(equation)) {
      return String(runInNewContext(
        `executeEquation(equation)`,
        {equation, executeEquation},
        {timeout},
      ));
    }
    // used again after being terminated, make sure the new worker gets cleaned up too
    this.startTerminateTimer();

    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        const index = this.pendingEquations.findIndex((eq) => eq.timeoutId === timeoutId);
        if (index !== -1) {
          this.pendingEquations.splice(index, 1);
          if (index === 0 && this.isProcessing) {
            // the worker is stuck on this equation, kill it and start the next one on a fresh worker
            this.killWorker();
            this.isProcessing = false;
            this.processNextEquation();
          }
        }
        reject(new Error(`${ERROR_TIMEOUT_MESSAGE} after ${timeout}ms`));
      }, timeout);

      this.pendingEquations.push({equation, resolve, reject, timeoutId});
      this.processNextEquation();
    });
  }

  public terminate(): void {
    for (const eq of this.pendingEquations) {
      clearTimeout(eq.timeoutId);
      eq.reject(new Error('Worker terminated'));
    }
    this.pendingEquations = [];
    this.isProcessing = false;
    this.killWorker();
    if (this.terminateAfterTimeout) {
      clearTimeout(this.terminateAfterTimeout);
      this.terminateAfterTimeout = null;
    }
  }
}
