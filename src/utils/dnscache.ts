import dns from 'dns';
import { isIP } from 'net';
import { promisify } from 'util';

import { log } from '../log';
import { incrementCounter } from '../metrics';


// A DNS cache in front of `dns.lookup`, for this process. node has none: every connection (rest requests, the gateway
// and api events websockets, voice) asks the host's resolver again. On 2026-11-24 the host's systemd-resolved hit its
// limit of queries in flight (09:24-09:27) and refused every lookup, cached names too, so every cluster's
// `gateway.nsb.gg` lookup failed with EAI_AGAIN until about 09:30.
//
// `net` and `tls` (and so undici and `ws`) read `dns.lookup` from the module each time they connect, so replacing it
// covers all of them. What it does:
//   - an answer is reused for FRESH_MS, the lookups for one name at the same time share one query
//   - when a lookup fails, or takes longer than SLOW_MS, the last answer is used, up to STALE_MS old
//   - a failed lookup is repeated (or its last answer used) for the lookups in the next FAILURE_MS, so a tight
//     retry loop can't keep the resolver's slots full
// `notsobot_dns_lookups_total{result}` counts them: hit, miss, joined (shared a query in flight), stale, failed

const FRESH_MS = 60 * 1000;
const STALE_MS = 6 * 60 * 60 * 1000;
const SLOW_MS = 2000;
const FAILURE_MS = 1000;
// the bot only connects to a few hosts (discord, its cdn, the api, voice servers), this only stops it growing forever
const MAX_ENTRIES = 2000;
// a name that doesn't exist isn't a resolver failure, the last answer isn't used for it
const NOT_FOUND_CODES: ReadonlySet<string> = new Set(['ENOTFOUND', 'ENODATA']);
// at most one "using the last answer" warning per name in this long
const WARN_EVERY_MS = 60 * 1000;

type LookupCallback = (error: NodeJS.ErrnoException | null, address?: string | Array<dns.LookupAddress>, family?: number) => void;

interface Waiter {
  all: boolean,
  callback: LookupCallback,
}

interface CacheEntry {
  addresses?: Array<dns.LookupAddress>,
  // when `addresses` was resolved
  at: number,
  error?: NodeJS.ErrnoException,
  // until when `error` is repeated
  errorUntil: number,
  // the lookup in flight, its waiters
  pending: Array<Waiter> | null,
  // the lookup in flight is past SLOW_MS, new lookups use the last answer instead of waiting for it
  slow: boolean,
  warnedAt: number,
}

// kept on the process, so the module being loaded again never wraps the cache in another one
const state: {cache: Map<string, CacheEntry>, original: typeof dns.lookup | null} =
  (globalThis as any).notsobotDnsCache = (globalThis as any).notsobotDnsCache || {cache: new Map(), original: null};


function count(result: 'failed' | 'hit' | 'joined' | 'miss' | 'stale'): void {
  incrementCounter('notsobot_dns_lookups_total', {result});
}

// each caller gets its own copy, net changes the error it's given (and could the list)
function copyError(error: NodeJS.ErrnoException): NodeJS.ErrnoException {
  const copy: NodeJS.ErrnoException = new Error(error.message);
  copy.code = error.code;
  copy.errno = error.errno;
  copy.syscall = error.syscall;
  (copy as any).hostname = (error as any).hostname;
  return copy;
}

function answer(waiter: Waiter, error: NodeJS.ErrnoException | null, addresses?: Array<dns.LookupAddress>): void {
  if (error) {
    const copy = copyError(error);
    process.nextTick(() => waiter.callback(copy));
  } else if (waiter.all) {
    const copy = addresses!.map((x) => ({...x}));
    process.nextTick(() => waiter.callback(null, copy));
  } else {
    const first = addresses![0];
    process.nextTick(() => waiter.callback(null, first.address, first.family));
  }
}

function setEntry(key: string, entry: CacheEntry): void {
  state.cache.delete(key);
  state.cache.set(key, entry);
  if (MAX_ENTRIES < state.cache.size) {
    // the oldest one not waiting on a lookup
    for (const [oldKey, oldEntry] of state.cache) {
      if (!oldEntry.pending) {
        state.cache.delete(oldKey);
        break;
      }
    }
  }
}

function hasStale(entry: CacheEntry, now: number): boolean {
  return !!entry.addresses && now - entry.at < STALE_MS;
}

function useStale(hostname: string, entry: CacheEntry, reason: string, now: number): void {
  if (WARN_EVERY_MS <= now - entry.warnedAt) {
    entry.warnedAt = now;
    const age = Math.round((now - entry.at) / 1000);
    log.warn(`DNS lookup for ${hostname} ${reason}, using its answer from ${age}s ago`);
  }
}

// a failed lookup's answer: the last good one if there's one recent enough, the error otherwise
function failOrStale(waiter: Waiter, entry: CacheEntry, now: number): void {
  if (hasStale(entry, now)) {
    count('stale');
    answer(waiter, null, entry.addresses);
  } else {
    count('failed');
    answer(waiter, entry.error!);
  }
}

function resolve(key: string, hostname: string, options: dns.LookupOptions, entry: CacheEntry): void {
  const original = state.original!;
  let settled = false;

  // a slow resolver doesn't hold up connections that have an answer to use, the lookup still finishes for the cache
  const slowTimer = setTimeout(() => {
    const now = Date.now();
    if (!settled && entry.pending && hasStale(entry, now)) {
      entry.slow = true;
      useStale(hostname, entry, `is taking over ${SLOW_MS}ms`, now);
      const waiters = entry.pending;
      entry.pending = [];
      for (const waiter of waiters) {
        count('stale');
        answer(waiter, null, entry.addresses);
      }
    }
  }, SLOW_MS);
  slowTimer.unref();

  original(hostname, {...options, all: true}, (error, addresses) => {
    settled = true;
    clearTimeout(slowTimer);
    const now = Date.now();
    const waiters = entry.pending || [];
    entry.pending = null;
    entry.slow = false;

    if (!error && Array.isArray(addresses) && addresses.length) {
      entry.addresses = addresses;
      entry.at = now;
      entry.error = undefined;
      entry.errorUntil = 0;
      setEntry(key, entry);
      for (const waiter of waiters) {
        answer(waiter, null, addresses);
      }
      return;
    }

    const failure: NodeJS.ErrnoException = error || Object.assign(new Error(`getaddrinfo ENOTFOUND ${hostname}`), {
      code: 'ENOTFOUND',
      syscall: 'getaddrinfo',
      hostname,
    });
    if (NOT_FOUND_CODES.has(failure.code || '')) {
      // the name is gone, so is its old answer
      entry.addresses = undefined;
    }
    // the lookups in the next FAILURE_MS get the same, without asking the resolver again
    entry.error = failure;
    entry.errorUntil = now + FAILURE_MS;
    setEntry(key, entry);
    if (hasStale(entry, now)) {
      useStale(hostname, entry, `failed (${failure.code})`, now);
    }
    for (const waiter of waiters) {
      failOrStale(waiter, entry, now);
    }
  });
}

function cachedLookup(hostname: string, options: any, callback?: LookupCallback): void {
  if (typeof options === 'function') {
    callback = options;
    options = {};
  } else if (typeof options === 'number') {
    options = {family: options};
  } else if (!options) {
    options = {};
  }
  const original = state.original!;
  if (typeof hostname !== 'string' || !hostname || isIP(hostname) || typeof callback !== 'function') {
    // nothing to cache (or bad arguments, node's own lookup throws the right error for those)
    return (original as any)(hostname, options, callback);
  }

  const { all, ...rest } = options as dns.LookupAllOptions | dns.LookupOneOptions;
  const lookupOptions: dns.LookupOptions = rest;
  const key = [
    lookupOptions.family || 0,
    lookupOptions.hints || 0,
    lookupOptions.order || ((lookupOptions.verbatim === undefined) ? '' : String(lookupOptions.verbatim)),
    hostname.toLowerCase(),
  ].join('|');
  const waiter: Waiter = {all: !!all, callback};
  const now = Date.now();

  let entry = state.cache.get(key);
  if (entry) {
    if (entry.addresses && now - entry.at < FRESH_MS) {
      count('hit');
      return answer(waiter, null, entry.addresses);
    }
    if (entry.error && now < entry.errorUntil) {
      return failOrStale(waiter, entry, now);
    }
    if (entry.pending) {
      if (entry.slow && hasStale(entry, now)) {
        count('stale');
        return answer(waiter, null, entry.addresses);
      }
      count('joined');
      entry.pending.push(waiter);
      return;
    }
  } else {
    entry = {at: 0, errorUntil: 0, pending: null, slow: false, warnedAt: 0};
    setEntry(key, entry);
  }

  count('miss');
  entry.pending = [waiter];
  resolve(key, hostname, lookupOptions, entry);
}

// `util.promisify(dns.lookup)` resolves with `{address, family}` (or the list for `all`), like node's own
(cachedLookup as any)[promisify.custom] = (hostname: string, options?: any) => {
  return new Promise((resolve, reject) => {
    cachedLookup(hostname, options, (error, address, family) => {
      if (error) {
        reject(error);
      } else if (Array.isArray(address)) {
        resolve(address);
      } else {
        resolve({address, family});
      }
    });
  });
};


export function installDnsCache(): void {
  if (!state.original) {
    state.original = dns.lookup;
  }
  if (dns.lookup !== (cachedLookup as any)) {
    (dns as any).lookup = cachedLookup;
  }
}
