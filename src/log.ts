import { format } from 'util';


// One line per call: `2026-11-09T19:08:46.672Z INFO  [cluster 12] Shard #96 - READY`. `[main]` is the cluster manager
// (or a bot that runs without one), every process writes to the same output.
// `NOTSOBOT_LOG_LEVEL` is debug, info (the default), warn or error. The arguments are formatted like console.log's, an
// error prints its stack

const LEVELS = {debug: 10, info: 20, warn: 30, error: 40} as const;
type Level = keyof typeof LEVELS;

const threshold = LEVELS[(process.env.NOTSOBOT_LOG_LEVEL || '').toLowerCase() as Level] || LEVELS.info;

// the cluster manager gives each of its processes their cluster id
const source = (process.env.CLUSTER_ID) ? `cluster ${process.env.CLUSTER_ID}` : 'main';

function write(level: Level, args: Array<unknown>): void {
  if (LEVELS[level] < threshold) {
    return;
  }
  const line = `${new Date().toISOString()} ${level.toUpperCase().padEnd(5)} [${source}] ${format(...args)}`;
  if (level === 'error' || level === 'warn') {
    console.error(line);
  } else {
    console.log(line);
  }
}

export const log = Object.freeze({
  debug: (...args: Array<unknown>) => write('debug', args),
  error: (...args: Array<unknown>) => write('error', args),
  info: (...args: Array<unknown>) => write('info', args),
  warn: (...args: Array<unknown>) => write('warn', args),
});
