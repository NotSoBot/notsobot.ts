import path from 'path';
import { Script, createContext } from 'vm';
import { Worker } from 'worker_threads';

import { BaseCollection } from 'detritus-utils';

import { isSimpleMath } from './tools';
import {
  executeEquation,
  WorkerMessage,
  WorkerResponse,
  ERROR_TIMEOUT_MESSAGE,
  MAX_TIME_MATH,
  SESSION_IDLE_TIME,
} from './worker';

export { ERROR_TIMEOUT_MESSAGE as MATH_ERROR_TIMEOUT_MESSAGE };


// every tag run used to start its own worker thread (with mathjs loaded, tens of mb each) that stayed alive for a
// minute, so a few busy tags meant dozens of threads. now the process shares a couple of them
export const POOL_SIZE = 2;
// a worker with nothing to do for this long is stopped, longer than a tag can run so a tag's parser isn't lost midway
export const WORKER_IDLE_TIME = 150 * 1000;
// a worker that never says it's ready (mathjs failing to load) is given up on
export const WORKER_START_TIMEOUT = 10 * 1000;
// when every worker is stuck behind slow equations, new ones fail right away (or after waiting this long) instead of
// piling up, the tag gets an error it can show instead of hanging
export const MAX_QUEUE_LENGTH = 500;
export const MAX_QUEUE_WAIT = 5 * 1000;

export const MATH_ERROR_BUSY_MESSAGE = 'Math is busy right now, try again in a bit';
// the worker running this run's equations was restarted (another equation on it timed out), so its variables are gone
export const MATH_ERROR_RESET_MESSAGE = 'Math variables were reset, a slow equation restarted the calculator';


// `took` is only the time it spent running, not waiting in the queue behind other runs' equations
export interface MathResult {
  result: string,
  took: number,
}

interface MathJob {
  equation: string,
  id: number,
  reject: (error: Error) => void,
  resolve: (result: MathResult) => void,
  session: number,
  startedAt: number,
  timeout: number,
  timer: NodeJS.Timeout | null,
}


class MathPoolWorker {
  current: MathJob | null = null;
  idleTimeout: NodeJS.Timeout | null = null;
  queue: Array<MathJob> = [];
  ready: boolean = false;
  // sessions whose parser lives in this worker
  sessions = new Set<number>();
  worker: Worker | null = null;

  constructor(private pool: MathPool) {}

  get load(): number {
    return this.queue.length + ((this.current) ? 1 : 0);
  }

  enqueue(job: MathJob): void {
    if (MAX_QUEUE_LENGTH <= this.queue.length) {
      job.reject(new Error(MATH_ERROR_BUSY_MESSAGE));
      return;
    }
    job.timer = setTimeout(() => {
      const index = this.queue.indexOf(job);
      if (index !== -1) {
        this.queue.splice(index, 1);
        job.reject(new Error(MATH_ERROR_BUSY_MESSAGE));
      }
    }, MAX_QUEUE_WAIT);
    this.queue.push(job);
    this.next();
  }

  dispose(session: number): void {
    this.sessions.delete(session);
    if (this.worker && this.ready) {
      this.worker.postMessage({type: 'dispose', session} as WorkerMessage);
    }
  }

  private start(): void {
    const worker = this.worker = new Worker(path.join(__dirname, 'worker.js'));
    this.ready = false;
    const startTimeout = setTimeout(() => {
      if (worker === this.worker && !this.ready) {
        this.fail(new Error('Math Worker took too long to start'));
      }
    }, WORKER_START_TIMEOUT);

    worker.on('message', (response: WorkerResponse) => {
      if (worker !== this.worker) {
        return;
      }
      if (response.type === 'ready') {
        clearTimeout(startTimeout);
        this.ready = true;
        this.next();
        return;
      }
      const job = this.current;
      if (!job || job.id !== response.id) {
        return;
      }
      this.finish();
      if (response.success && response.result !== undefined) {
        job.resolve({result: response.result, took: Date.now() - job.startedAt});
      } else {
        job.reject(new Error(response.error || 'Unknown error'));
      }
      this.next();
    });
    // `error` is followed by `exit`, the crash is handled once there
    worker.on('error', (error: Error) => {
      console.error('Math Worker error:', error);
    });
    worker.on('exit', (code: number) => {
      clearTimeout(startTimeout);
      if (worker === this.worker) {
        this.fail(new Error(`Math Worker stopped with exit code ${code}`));
      }
    });
  }

  // the running equation is done (or gave up on), stop its timer
  private finish(): void {
    if (this.current) {
      clearTimeout(this.current.timer!);
      this.current = null;
    }
  }

  private next(): void {
    if (this.current) {
      return;
    }
    if (!this.queue.length) {
      this.startIdleTimeout();
      return;
    }
    this.stopIdleTimeout();
    if (!this.worker) {
      this.start();
    }
    if (!this.ready) {
      // `ready` calls this again
      return;
    }

    const job = this.current = this.queue.shift()!;
    clearTimeout(job.timer!);
    job.startedAt = Date.now();
    // the timeout only counts the time it's actually running, not the wait in the queue
    job.timer = setTimeout(() => {
      if (this.current === job) {
        // stuck on it, the only way to stop it is to kill the thread (and every parser in it)
        this.fail(new Error(`${ERROR_TIMEOUT_MESSAGE} ${job.timeout}ms`), job);
      }
    }, job.timeout);
    this.sessions.add(job.session);
    this.worker!.postMessage({type: 'evaluate', equation: job.equation, id: job.id, session: job.session} as WorkerMessage);
  }

  // the worker crashed, timed out on an equation, or never started: drop it and carry on with a fresh one
  private fail(error: Error, job: MathJob | null = this.current): void {
    const worker = this.worker;
    const wasReady = this.ready;
    this.worker = null;
    this.ready = false;
    if (worker) {
      worker.removeAllListeners('message');
      worker.terminate().catch(() => {});
    }
    if (job && job === this.current) {
      this.finish();
      job.reject(error);
    }
    // their variables were in the dead worker, the next equation of each of them says so instead of a confusing
    // "undefined symbol". they stay on this worker, so a run's later equations don't end up split between two parsers
    for (let session of this.sessions) {
      this.pool.markReset(session);
    }
    this.sessions.clear();
    if (!wasReady) {
      // it couldn't even start (mathjs failing to load, the file missing), restarting right away would just loop
      for (let queued of this.queue.splice(0)) {
        clearTimeout(queued.timer!);
        queued.reject(error);
      }
      return;
    }
    this.next();
  }

  private startIdleTimeout(): void {
    if (!this.worker || this.idleTimeout) {
      return;
    }
    this.idleTimeout = setTimeout(() => {
      this.idleTimeout = null;
      if (!this.load && this.worker) {
        // nothing used it for longer than a tag can run, so the parsers in it belong to finished runs
        const worker = this.worker;
        this.worker = null;
        this.ready = false;
        worker.removeAllListeners('message');
        worker.terminate().catch(() => {});
        this.sessions.clear();
      }
    }, WORKER_IDLE_TIME);
    this.idleTimeout.unref();
  }

  private stopIdleTimeout(): void {
    if (this.idleTimeout) {
      clearTimeout(this.idleTimeout);
      this.idleTimeout = null;
    }
  }
}


class MathPool {
  private lastId: number = 0;
  private lastSession: number = 0;
  // sessions whose worker got restarted since their last equation. tags don't dispose their session, so both of these
  // forget it once it hasn't been used for as long as the worker keeps its parser
  private resetSessions = new BaseCollection<number, true>({expire: SESSION_IDLE_TIME});
  // a session's parser lives in one worker, so its equations always go to that one
  private sessionWorkers = new BaseCollection<number, MathPoolWorker>({expire: SESSION_IDLE_TIME});
  private workers: Array<MathPoolWorker> = [];

  constructor(size: number) {
    for (let i = 0; i < size; i++) {
      this.workers.push(new MathPoolWorker(this));
    }
  }

  createSession(): number {
    return ++this.lastSession;
  }

  disposeSession(session: number): void {
    this.resetSessions.delete(session);
    const worker = this.sessionWorkers.get(session);
    if (worker) {
      this.sessionWorkers.delete(session);
      worker.dispose(session);
    }
  }

  evaluate(session: number, equation: string, timeout: number): Promise<MathResult> {
    if (this.resetSessions.delete(session)) {
      return Promise.reject(new Error(MATH_ERROR_RESET_MESSAGE));
    }
    let worker = this.sessionWorkers.get(session);
    if (!worker) {
      // the least busy one
      worker = this.workers.reduce((x, y) => (y.load < x.load) ? y : x);
      this.sessionWorkers.set(session, worker);
    }
    return new Promise((resolve, reject) => {
      worker!.enqueue({equation, id: ++this.lastId, reject, resolve, session, startedAt: 0, timeout, timer: null});
    });
  }

  markReset(session: number): void {
    if (this.sessionWorkers.has(session)) {
      this.resetSessions.set(session, true);
    }
  }
}

// one per process, created on first use
let pool: MathPool | null = null;
function getPool(): MathPool {
  return pool = pool || new MathPool(POOL_SIZE);
}


// simple equations (numbers and a few functions, no variables) run right here in a sandbox for the timeout. it's one
// shared context instead of a new one per equation, the run is synchronous so nothing else can use it meanwhile
const SIMPLE_SANDBOX = createContext({equation: '', executeEquation});
const SIMPLE_SCRIPT = new Script('executeEquation(equation)');


// one tag run's (or `.math`'s) calculator, its variables carry over between its equations. the threads are shared
export class MathSession {
  private session: null | number = null;

  public async evaluate(equation: string, timeout: number = MAX_TIME_MATH): Promise<string> {
    return (await this.evaluateTimed(equation, timeout)).result;
  }

  // with how long it actually ran, tags only count that against their processing time
  public async evaluateTimed(equation: string, timeout: number = MAX_TIME_MATH): Promise<MathResult> {
    if (isSimpleMath(equation)) {
      const started = Date.now();
      SIMPLE_SANDBOX.equation = equation;
      try {
        const result = String(SIMPLE_SCRIPT.runInContext(SIMPLE_SANDBOX, {timeout}));
        return {result, took: Date.now() - started};
      } finally {
        SIMPLE_SANDBOX.equation = '';
      }
    }
    const pool = getPool();
    if (this.session === null) {
      this.session = pool.createSession();
    }
    return pool.evaluate(this.session, equation, timeout);
  }

  // drops its variables, it can still be used after (with none)
  public terminate(): void {
    if (this.session !== null) {
      getPool().disposeSession(this.session);
      this.session = null;
    }
  }
}
