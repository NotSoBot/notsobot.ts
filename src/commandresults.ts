import { CommandClient, InteractionCommandClient } from 'detritus-client';
import { ClientEvents } from 'detritus-client/lib/constants';
import { EventSubscription } from 'detritus-utils';

import { isContentBlockedError } from './api/errors';
import type { GuildSettingsRule } from './api/structures/guildsettings';
import type { UserWarningPending } from './api/structures/user';
import type { DiscordSkuIds } from './constants';
import { CommandRunCancelledError, InteractionExpiredError } from './utils/errors';
import { isTagError } from './utils/tags/exceptions';


// how a command attempt ended, sent with its usage from the commands' `onFinally` so clickhouse can break uses down by it
export enum CommandResults {
  ARGUMENT_ERROR = 'argument_error',
  BLOCKED = 'blocked',
  BOT_MISSING_PERMISSIONS = 'bot_missing_permissions',
  // the api blocked the media (or text) for being nsfw or against discord's guidelines, the filter working and not our
  // failure, so it's kept out of `run_error` like `script_error`
  CONTENT_BLOCKED = 'content_blocked',
  // stopped before running without saying why, like `onBeforeRun` returning false (no media found), or its trigger
  // being edited or deleted (or its reply taken over) while it ran
  CANCELLED = 'cancelled',
  // `onBeforeRun` or `onSuccess` threw
  FAIL = 'fail',
  MISSING_PERMISSIONS = 'missing_permissions',
  RAN = 'ran',
  RATELIMITED = 'ratelimited',
  RUN_ERROR = 'run_error',
  // the user's own script broke, a tag (or the code/mediascript it ran) erroring, or `code` printing to stderr. kept apart
  // from `run_error` so that one is only our failures
  SCRIPT_ERROR = 'script_error',
}

const RESULT_EVENTS: Array<[ClientEvents, CommandResults]> = [
  [ClientEvents.COMMAND_FAIL, CommandResults.FAIL],
  [ClientEvents.COMMAND_PERMISSIONS_FAIL, CommandResults.MISSING_PERMISSIONS],
  [ClientEvents.COMMAND_PERMISSIONS_FAIL_CLIENT, CommandResults.BOT_MISSING_PERMISSIONS],
  [ClientEvents.COMMAND_RAN, CommandResults.RAN],
  [ClientEvents.COMMAND_RATELIMIT, CommandResults.RATELIMITED],
];

type ContextWithMetadata = {metadata?: Record<string, any>};


// only the first one sticks, an attempt can go through more than one (a run error, then `onRunError` throwing)
export function setCommandResult(context: ContextWithMetadata, result: CommandResults): void {
  const metadata = context.metadata = context.metadata || {};
  if (!metadata.result) {
    metadata.result = result;
  }
}

// null while nothing set one
export function getCommandResult(context: ContextWithMetadata): CommandResults | null {
  return (context.metadata && context.metadata.result) || null;
}

// why an attempt didn't run, for its usage row next to the result. the commands set the ones only they know (no media
// found, the usage shown), the first one sticks like the result
export function setCommandReason(context: ContextWithMetadata, reason: string): void {
  const metadata = context.metadata = context.metadata || {};
  if (!metadata.reason) {
    metadata.reason = reason;
  }
}

// what gets recorded with `result`: nothing for a clean run, otherwise what a command set, the gate that stopped it
// (`premium`, `rule`, `nsfw`...), its trigger being edited or deleted, or how its job ended. '' when nothing said why
export function getRecordedCommandReason(context: ContextWithMetadata, result: CommandResults): string {
  const metadata = context.metadata;
  if (!metadata || result === CommandResults.RAN) {
    return '';
  }
  if (metadata.reason) {
    return metadata.reason;
  }
  const gate: CommandGate | undefined = metadata.gate;
  if (gate) {
    return gate.kind;
  }
  if (metadata.cancelled) {
    return 'trigger_changed';
  }
  const jobState: JobRunStates | undefined = metadata.jobState;
  if (jobState && jobState !== JobRunStates.SUCCEEDED) {
    return `job_${jobState}`;
  }
  return '';
}

// what gets recorded: nothing set means it stopped before running without an event saying why (`onBefore` or
// `onBeforeRun` returning false, a dm-only block, a hook throwing before `run`), counted as cancelled like it always was
export function getRecordedCommandResult(context: ContextWithMetadata): CommandResults {
  return getCommandResult(context) || CommandResults.CANCELLED;
}

// the clients emit these before the command's `onFinally`, blocked and argument errors are set by the hooks instead
// its subscriptions, `CommandHooksListener` (listeners/commandhooks.ts) keeps them so `.refresh` can swap them for the reloaded ones
export function connectCommandResults(client: CommandClient | InteractionCommandClient): Array<EventSubscription> {
  const subscriptions: Array<EventSubscription> = [];
  for (let [event, result] of RESULT_EVENTS) {
    subscriptions.push(client.subscribe(event, ({context}: {context: ContextWithMetadata}) => setCommandResult(context, result)));
  }
  // async for reading the api error's body, still set before `onFinally` since detritus awaits `onRunError` (which reads
  // the same cached body and replies) between emitting this and calling it
  subscriptions.push(client.subscribe(ClientEvents.COMMAND_RUN_ERROR, async ({context, error}: {context: ContextWithMetadata, error: any}) => {
    setCommandResult(context, await getRunErrorResult(error));
  }));
  return subscriptions;
}

export async function getRunErrorResult(error: any): Promise<CommandResults> {
  // its trigger was edited or deleted, `cancelCommandRun` already set it as cancelled (this is for the metrics)
  if (error instanceof CommandRunCancelledError) {
    return CommandResults.CANCELLED;
  }
  // its reply came after discord's 3 seconds, the command didn't fail
  if (error instanceof InteractionExpiredError) {
    return CommandResults.CANCELLED;
  }
  if (isTagError(error)) {
    return CommandResults.SCRIPT_ERROR;
  }
  if (await isContentBlockedError(error)) {
    return CommandResults.CONTENT_BLOCKED;
  }
  return CommandResults.RUN_ERROR;
}


// a job `jobReply` left polling: it returns once the thinking reply is up, so `run` (and detritus' COMMAND_RAN and
// `onFinally`) are done long before the job is. waiting in its queue or running, then one of the ends
export enum JobRunStates {
  QUEUED = 'queued',
  STARTED = 'started',
  // its result was posted
  SUCCEEDED = 'succeeded',
  // the job's own error was shown
  FAILED = 'failed',
  // the api answered with a status we don't know
  UNKNOWN = 'unknown',
  // polled for longer than `MAX_JOB_WAIT_TIME` (or the poll itself got stuck, see `JOB_RUN_GRACE_TIME`)
  TIMED_OUT = 'timed_out',
  // its thinking reply was edited by something else or deleted, nothing's waiting on it
  TAKEN_OVER = 'taken_over',
  // its trigger was edited or deleted
  CANCELLED = 'cancelled',
  // polling, or posting what it ended with, threw
  ERRORED = 'errored',
}

export interface JobRunEnd {
  // the command's duration runs until here
  ended: number,
  result: CommandResults,
  state: JobRunStates,
}

// past the polling deadline, for a last poll or the result's upload to finish before `done` stops waiting on them
const JOB_RUN_GRACE_TIME = 5 * 60 * 1000;

export class JobRun {
  readonly context: ContextWithMetadata;
  readonly done: Promise<JobRunEnd>;
  readonly jobId: string;
  end: JobRunEnd | null = null;
  state: JobRunStates;

  private resolve!: (end: JobRunEnd) => void;
  private timeout: ReturnType<typeof setTimeout>;

  // `maxWait` is the polling deadline, `done` settles by then (plus the grace) whatever happens to the polling
  constructor(context: ContextWithMetadata, jobId: string, state: JobRunStates.QUEUED | JobRunStates.STARTED, maxWait: number) {
    this.context = context;
    this.jobId = jobId;
    this.state = state;
    this.done = new Promise((resolve) => this.resolve = resolve);
    this.timeout = setTimeout(() => this.finish(JobRunStates.TIMED_OUT, CommandResults.RUN_ERROR), maxWait + JOB_RUN_GRACE_TIME);
    const metadata = context.metadata = context.metadata || {};
    const runs: Set<JobRun> = metadata.jobRuns = metadata.jobRuns || new Set();
    runs.add(this);
  }

  // the one way it ends, later calls (a reply failing after it already ended, the guard after a slow upload) do nothing.
  // the job's result takes the place of `ran`, which only meant the thinking reply went up
  finish(state: JobRunStates, result: CommandResults): boolean {
    if (this.end) {
      return false;
    }
    clearTimeout(this.timeout);
    this.state = state;
    this.end = {ended: Date.now(), result, state};
    const metadata = this.context.metadata = this.context.metadata || {};
    if (!metadata.result || metadata.result === CommandResults.RAN) {
      metadata.result = result;
    }
    // the last job's, for the usage row's reason (`getRecordedCommandReason`)
    metadata.jobState = state;
    if (metadata.jobRuns) {
      metadata.jobRuns.delete(this);
    }
    this.resolve(this.end);
    return true;
  }
}

export function getPendingJobRuns(context: ContextWithMetadata): Array<JobRun> {
  const runs: Set<JobRun> | undefined = context.metadata && context.metadata.jobRuns;
  return (runs) ? Array.from(runs) : [];
}

// once the jobs it has polling right now ended, ones started after this (another eyes pick) aren't waited on
export async function waitForJobRuns(context: ContextWithMetadata): Promise<void> {
  await Promise.all(getPendingJobRuns(context).map((run) => run.done));
}

// for the usage and metrics recording, so they count how its jobs ended and their whole time. right away without any,
// otherwise in the background: nothing detritus does after `onFinally` should wait minutes on a job (`done` always
// settles, see `JobRun`)
export function afterJobRuns(
  context: ContextWithMetadata,
  callback: () => Promise<unknown> | unknown,
  onError: (error: any) => void,
): Promise<void> {
  if (!getPendingJobRuns(context).length) {
    return Promise.resolve(callback()).then(() => {});
  }
  waitForJobRuns(context).then(callback).catch(onError);
  return Promise.resolve();
}


// why a command was stopped before running, one at a time. set by the clients' `onCommandCheck` and the commands'
// `onBefore` with `setCommandGate`, read by their cancel hooks. `message` is what the user is told, the prefixed ones
// mostly say nothing (or react) and leave it out
export type CommandGate = (
  // the user or server is blocked, or the user couldn't be loaded
  | {kind: 'user_blocked', message?: string}
  | {kind: 'user_fetch_failed', message?: string}
  | {kind: 'server_blocked', message?: string}
  | {kind: 'dm_disabled', message?: string}
  // a warning from NotSoBot staff takes the command's place, interactions make its notice in the check
  | {kind: 'warnings_pending', message?: string, warningIds?: Array<string>, warnings: Array<UserWarningPending>}
  // the server's discord command permissions for its slash version (prefixed)
  | {kind: 'command_permissions', message?: undefined}
  // one of the server's rules, `message` is the rule's own for prefixed (null without one)
  | {kind: 'rule', message: null | string, rule: GuildSettingsRule}
  // the server's settings couldn't be loaded and there's no older copy, so its rules can't be checked
  | {kind: 'settings_fetch_failed', message?: string}
  // a prefixed command after prefix commands ended (`PREFIX_COMMANDS_END`), the client's cancel hook replies with how
  // else to run it
  | {kind: 'prefix_ended', message?: undefined}
  // the server turned NotSoBot off in this channel (a user install's public command)
  | {kind: 'channel_turned_off', message: string}
  | {kind: 'nsfw', message: string}
  // `skuId` is the tier's store page to link
  | {kind: 'premium', message: string, skuId: DiscordSkuIds}
);

// returns false for the checks to return
export function setCommandGate(context: ContextWithMetadata, gate: CommandGate): false {
  const metadata = context.metadata = context.metadata || {};
  metadata.gate = gate;
  return false;
}

export function clearCommandGate(context: ContextWithMetadata): void {
  if (context.metadata) {
    delete context.metadata.gate;
  }
}

export function getCommandGate(context: ContextWithMetadata): CommandGate | null {
  return (context.metadata && context.metadata.gate) || null;
}

export function getCommandGateMessage(context: ContextWithMetadata): string | null {
  const gate = getCommandGate(context);
  return (gate && gate.message) || null;
}
