import * as Sentry from '@sentry/node';
import { AsyncLocalStorage } from 'async_hooks';

import { Command, CommandClient, Interaction, InteractionCommandClient } from 'detritus-client';
import { ClientEvents } from 'detritus-client/lib/constants';

import { JobError } from './api/errors';
import { isTagError } from './utils/tags/exceptions';


// everything sentry goes through here, so events get the same context, grouping and filtering everywhere
//   network errors (dns, connect timeouts, resets) are grouped by code + host and throttled, an outage is one issue
//   http errors are reported where the response is seen (`captureRestResponse`), grouped by route instead of url
//   command errors get the command, user, guild and shard attached, and skip what the reply already explains
// the privacy policy says we don't keep the text of command messages, and sentry only gets "the IDs and command details
// involved in the error", so no message content, option values, prompts or query strings go to it

export type SentryProcess = 'cluster' | 'manager';

export type SentryCommandContext = Command.Context | Interaction.InteractionContext | Interaction.InteractionAutoCompleteContext;

export interface CaptureOptions {
  context?: SentryCommandContext,
  extra?: Record<string, unknown>,
  fingerprint?: Array<string>,
  level?: Sentry.SeverityLevel,
  tags?: Record<string, boolean | number | string | null | undefined>,
  // drop the event if one with the same fingerprint was sent from this process less than this long ago
  throttle?: number,
}


// 160 cluster processes report on their own, so during an outage each sends a network error this often at most
const NETWORK_ERROR_THROTTLE = 5 * 60 * 1000;
const RESPONSE_BODY_MAX_LENGTH = 2000;
// our own breadcrumbs, sentry's console/http ones are shared by every command running in the process, so they'd attach
// other users' urls and search terms to an unrelated error
const BREADCRUMB_CATEGORIES: ReadonlyArray<string> = ['gateway'];

// connection level failures, nothing reached the server (or the response never came back)
const NETWORK_ERROR_CODES: ReadonlySet<string> = new Set([
  'EAI_AGAIN',
  'ECONNABORTED',
  'ECONNREFUSED',
  'ECONNRESET',
  'EHOSTUNREACH',
  'ENETUNREACH',
  'ENOTFOUND',
  'EPIPE',
  'ETIMEDOUT',
  'UND_ERR_BODY_TIMEOUT',
  'UND_ERR_CLOSED',
  'UND_ERR_CONNECT_TIMEOUT',
  'UND_ERR_HEADERS_TIMEOUT',
  'UND_ERR_SOCKET',
]);
// errors without a code that are still just the network
const NETWORK_ERROR_MESSAGES: ReadonlyArray<[string, string]> = [
  ['Opening handshake has timed out', 'WS_HANDSHAKE_TIMEOUT'],
];

// fingerprint -> when it was last sent
const lastSentAt = new Map<string, number>();

// the command whose run we're in, so errors reported away from it (rest responses) can still say which command it was
const commandContextStorage = new AsyncLocalStorage<SentryCommandContext>();


export function runWithCommandContext<T>(context: SentryCommandContext, callback: () => T): T {
  return commandContextStorage.run(context, callback);
}


export function getCommandContext(): SentryCommandContext | undefined {
  return commandContextStorage.getStore();
}


export function initSentry(processType: SentryProcess): void {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) {
    return;
  }
  Sentry.init({
    beforeBreadcrumb: (breadcrumb) => {
      return (breadcrumb.category && BREADCRUMB_CATEGORIES.includes(breadcrumb.category)) ? breadcrumb : null;
    },
    beforeSend,
    // urls can have search terms and user given links in their query, headers have our api's user/server headers
    dataCollection: {httpBodies: [], httpHeaders: false, urlQueryParams: false},
    dsn,
    initialScope: {tags: {process: processType}},
    integrations: (integrations) => {
      if (processType === 'manager') {
        return integrations;
      }
      // the cluster's own process handlers capture these, sentry's would double report them (and they only exist when a
      // dsn is set)
      return integrations.filter((integration) => {
        return integration.name !== 'OnUncaughtException' && integration.name !== 'OnUnhandledRejection';
      });
    },
  });
}


export function captureError(error: unknown, options: CaptureOptions = {}): void {
  if (!Sentry.isInitialized()) {
    return;
  }
  if (options.throttle && options.fingerprint && isThrottled(options.fingerprint.join(':'), options.throttle)) {
    return;
  }
  Sentry.withScope((scope) => {
    if (options.context) {
      applyCommandContext(scope, options.context);
    }
    if (options.extra) {
      scope.setExtras(options.extra);
    }
    if (options.fingerprint) {
      scope.setFingerprint(options.fingerprint);
    }
    if (options.level) {
      scope.setLevel(options.level);
    }
    if (options.tags) {
      for (let key in options.tags) {
        const value = options.tags[key];
        if (value !== null && value !== undefined) {
          scope.setTag(key, value);
        }
      }
    }
    Sentry.captureException(error);
  });
}


export function captureUnhandledError(error: unknown, type: 'onuncaughtexception' | 'onunhandledrejection'): void {
  if (!Sentry.isInitialized()) {
    return;
  }
  Sentry.captureException(error, {mechanism: {handled: false, type}});
}


// a command's `onRunError`, http errors were already reported by `captureRestResponse` and the rest are user facing
// (cancelled runs are skipped by the caller). tag errors are the tag's own doing, like its code's `console.error`
export function captureCommandError(context: SentryCommandContext, error: any, source: string = 'command_run'): void {
  if (!error || error.response || isTagError(error)) {
    return;
  }
  // a failed job with an error code is a translated error, like the media being too big
  if (error instanceof JobError && error.apiError) {
    return;
  }
  captureError(error, {context, tags: {source}});
}


// detritus' own COMMAND_ERRORs for things that aren't failures
const EXPECTED_COMMAND_ERROR_MESSAGES: ReadonlyArray<string> = [
  'Cannot send messages in this channel',
  'Command errored out while converting args',
  'Command with DMs disabled used in DM',
];

// what `onRunError` doesn't see: COMMAND_ERROR is a hook throwing (`onFinally`, `onRunError` itself, `onBefore`, etc..)
// and COMMAND_FAIL is everything outside the run (parsing args, `onBeforeRun`, `onSuccess`)
export function connectCommandErrorReporting(client: CommandClient | InteractionCommandClient): void {
  client.subscribe(ClientEvents.COMMAND_ERROR, ({context, error}: {context: SentryCommandContext, error: any}) => {
    if (error && EXPECTED_COMMAND_ERROR_MESSAGES.includes(error.message)) {
      return;
    }
    captureCommandError(context, error, 'command_error');
  });
  client.subscribe(ClientEvents.COMMAND_FAIL, ({context, error}: {context: SentryCommandContext, error: any}) => {
    captureCommandError(context, error, 'command_fail');
  });
}


// discord's non-ok responses, minus the expected ones (missing/deleted things, no permissions, ratelimits the lib retries)
const IGNORED_DISCORD_STATUSES: ReadonlyArray<number> = [403, 404, 429];
// our api's own error responses are user facing (invalid tag, media too big, etc..), only its 5xx and responses without a
// coded body are bugs. 502 and 520-523 without a body is the api restarting or cloudflare not reaching it
const API_DOWN_STATUSES: ReadonlyArray<number> = [502, 520, 521, 522, 523];

// webhook and interaction urls have their token in the path (`/webhooks/:id/:token`, `/interactions/:id/:token/callback`),
// a logger's webhook token never expires and lets anyone post in that channel. interaction followups are under webhooks
const REGEX_URL_TOKEN = /\/(webhooks|interactions)\/(\d+)\/[^/?#]+/g;

export function redactUrlTokens(url: string): string {
  return url.replace(REGEX_URL_TOKEN, '/$1/$2/:token');
}

export function captureRestResponse(options: {
  body: string,
  // the command that made the request, if any
  context?: SentryCommandContext,
  isNotSoBotApi: boolean,
  method: string,
  route: string,
  shardId: number,
  status: number,
  url: string,
}): void {
  const { body, context, isNotSoBotApi, method, route, shardId, status, url } = options;
  // the query can have search terms or user given links
  const extra = {body: body.slice(0, RESPONSE_BODY_MAX_LENGTH), url: redactUrlTokens(url.split('?')[0])};
  const tags = {'http.method': method, 'http.route': route, 'http.status': status, shard_id: shardId};

  if (!isNotSoBotApi) {
    if (IGNORED_DISCORD_STATUSES.includes(status)) {
      return;
    }
    captureError(new RestResponseError('Discord', status, method, route), {
      context,
      extra,
      fingerprint: ['discord-rest', method, route, String(status)],
      level: (500 <= status) ? 'warning' : 'error',
      tags,
    });
    return;
  }

  const hasErrorCode = isCodedApiErrorBody(body);
  if (status < 500 && hasErrorCode) {
    return;
  }
  if (API_DOWN_STATUSES.includes(status) && !hasErrorCode) {
    captureError(new RestResponseError('NotSoBot Api is down,', status, method, route), {
      context,
      extra,
      fingerprint: ['notsobot-api-down'],
      level: 'warning',
      tags,
      throttle: NETWORK_ERROR_THROTTLE,
    });
    return;
  }
  captureError(new RestResponseError('NotSoBot Api', status, method, route), {
    context,
    extra,
    fingerprint: ['notsobot-api', method, route, String(status)],
    tags,
  });
}


export class RestResponseError extends Error {
  name = 'RestResponseError';

  constructor(service: string, status: number, method: string, route: string) {
    super(`${service} ${status} ${method} ${route}`);
  }
}


function isCodedApiErrorBody(body: string): boolean {
  try {
    const information = JSON.parse(body);
    return !!information && typeof(information) === 'object' && typeof(information.code) === 'number';
  } catch(error) {
    return false;
  }
}


function applyCommandContext(scope: Sentry.Scope, context: SentryCommandContext): void {
  // a user's data deletion request has to cover sentry too, this is what lets them be found (`user.id:<id>`), see
  // notsobot.api `views/me.py`
  scope.setUser({id: context.userId});
  scope.setTag('shard_id', context.shardId);
  if (context.guildId) {
    scope.setTag('guild_id', context.guildId);
  }
  if (context.channelId) {
    scope.setTag('channel_id', context.channelId);
  }

  if (context instanceof Command.Context) {
    const command = context.command;
    scope.setTag('command.type', 'prefixed');
    if (command) {
      scope.setTag('command', command.metadata.id || command.fullName.split(' ').join('.'));
    }
    scope.setContext('command', {message_id: context.messageId});
  } else if (context instanceof Interaction.InteractionAutoCompleteContext) {
    scope.setTag('command.type', 'autocomplete');
    scope.setTag('command', context.name.split(' ').join('.'));
    scope.setContext('command', {
      interaction_id: context.interactionId,
      name: context.name,
      option: (context.option) ? context.option.name : null,
    });
  } else {
    const invoker = context.invoker;
    const metadata = (invoker && invoker.metadata) || {};
    scope.setTag('command.type', 'interaction');
    scope.setTag('command', metadata.id || context.name.split(' ').join('.'));
    // which options were given, not what was given
    scope.setContext('command', {
      interaction_id: context.interactionId,
      name: context.name,
      options: (context.options) ? Array.from(context.options.keys()) : [],
    });
  }
}


function isThrottled(key: string, interval: number): boolean {
  const now = Date.now();
  const last = lastSentAt.get(key);
  if (last !== undefined && now - last < interval) {
    return true;
  }
  lastSentAt.set(key, now);
  return false;
}


export interface NetworkErrorInfo {
  code: string,
  host: string,
}

// undici wraps the real reason as `fetch failed` with a `cause`, and node's happy eyeballs as an AggregateError of each
// address' error, so dig until something has a known code
export function getNetworkErrorInfo(error: any, depth: number = 0): NetworkErrorInfo | null {
  if (!error || typeof(error) !== 'object' || 5 < depth) {
    return null;
  }

  let code: null | string = null;
  if (typeof(error.code) === 'string' && NETWORK_ERROR_CODES.has(error.code)) {
    code = error.code;
  } else if (typeof(error.message) === 'string') {
    const match = NETWORK_ERROR_MESSAGES.find(([message]) => error.message.includes(message));
    if (match) {
      code = match[1];
    }
  }
  if (code) {
    // the cause or the aggregated errors usually know the host better
    const inner = getNetworkErrorInfo(error.cause, depth + 1) || getNetworkErrorInfo((error.errors || [])[0], depth + 1);
    return {code, host: (inner && inner.host !== 'unknown') ? inner.host : getNetworkErrorHost(error)};
  }

  const inner = getNetworkErrorInfo(error.cause, depth + 1);
  if (inner) {
    return inner;
  }
  if (Array.isArray(error.errors)) {
    for (let child of error.errors) {
      const info = getNetworkErrorInfo(child, depth + 1);
      if (info) {
        return info;
      }
    }
  }
  return null;
}

function getNetworkErrorHost(error: any): string {
  // getaddrinfo errors
  if (typeof(error.hostname) === 'string') {
    return error.hostname;
  }
  // connect errors
  if (typeof(error.address) === 'string') {
    return (error.port) ? `${error.address}:${error.port}` : error.address;
  }
  // undici's ConnectTimeoutError only has it in the message
  const match = /attempted address: ([^,)]+)/.exec(String(error.message));
  if (match) {
    return match[1];
  }
  return 'unknown';
}


function beforeSend(event: Sentry.ErrorEvent, hint: Sentry.EventHint): Sentry.ErrorEvent | null {
  const info = getNetworkErrorInfo(hint.originalException);
  if (!info) {
    return event;
  }

  const fingerprint = ['network-error', info.code, info.host];
  if (isThrottled(fingerprint.join(':'), NETWORK_ERROR_THROTTLE)) {
    return null;
  }
  event.fingerprint = fingerprint;
  event.level = 'warning';
  event.tags = {...event.tags, 'network.code': info.code, 'network.host': info.host};
  // the title is the outermost error, `fetch failed` on its own says nothing
  const values = (event.exception && event.exception.values) || [];
  const main = values[values.length - 1];
  if (main) {
    main.value = `${main.value || ''} (${info.code} ${info.host})`.trim();
  }
  return event;
}
