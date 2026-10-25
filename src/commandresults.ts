import { CommandClient, InteractionCommandClient } from 'detritus-client';
import { ClientEvents } from 'detritus-client/lib/constants';

import { isTagError } from './utils/tags/exceptions';


// how a command attempt ended, sent with its usage from the commands' `onFinally` so clickhouse can break uses down by it
export enum CommandResults {
  ARGUMENT_ERROR = 'argument_error',
  BLOCKED = 'blocked',
  BOT_MISSING_PERMISSIONS = 'bot_missing_permissions',
  // stopped before running without saying why, like `onBeforeRun` returning false (no media found)
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


// only the first one sticks, an attempt can go through more than one (a run error, then `onRunError` throwing)
export function setCommandResult(context: {metadata?: Record<string, any>}, result: CommandResults): void {
  const metadata = context.metadata = context.metadata || {};
  if (!metadata.result) {
    metadata.result = result;
  }
}

export function getCommandResult(context: {metadata?: Record<string, any>}): CommandResults {
  return (context.metadata && context.metadata.result) || CommandResults.CANCELLED;
}

// the clients emit these before the command's `onFinally`, blocked and argument errors are set by the hooks instead
export function connectCommandResults(client: CommandClient | InteractionCommandClient): void {
  for (let [event, result] of RESULT_EVENTS) {
    client.subscribe(event, ({context}: {context: {metadata?: Record<string, any>}}) => setCommandResult(context, result));
  }
  client.subscribe(ClientEvents.COMMAND_RUN_ERROR, ({context, error}: {context: {metadata?: Record<string, any>}, error: any}) => {
    setCommandResult(context, getRunErrorResult(error));
  });
}

export function getRunErrorResult(error: any): CommandResults {
  return (isTagError(error)) ? CommandResults.SCRIPT_ERROR : CommandResults.RUN_ERROR;
}
