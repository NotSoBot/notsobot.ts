import { Command, Interaction } from 'detritus-client';
import { ComponentContext, InteractionModalContext, Markup } from 'detritus-client/lib/utils';
import { RequestFile, Response } from 'detritus-rest';

import { utilitiesMediascript } from '../../../api';
import { JobError } from '../../../api/errors';
import { RestResponsesRaw } from '../../../api/types';
import {
  EmbedBrands,
  EmbedColors,
  GoogleLocales,
  GoogleLocalesText,
  MAX_PIPE_COMMANDS_STEPS,
} from '../../../constants';
import { log } from '../../../log';
import { recordPipeRun } from '../../../metrics';
import {
  DefaultParameters,
  Formatter,
  Parameters,
  TagFormatter,
  displayReply,
  jobWaitForResult,
  mediaReply,
} from '../../../utils';
import { getTranslator } from '../../i18n';
import { UserError } from '../../errors';
import { MediascriptChain } from '../mediascript';


export const COMMAND_ID = 'media.aiv.pipe';

export interface CommandArgs {
  commands: Array<Parameters.PipingCommand>,
  // reply with the mediascript the pipe runs as (or what keeps it from being one) instead of running it
  script?: boolean,
  url: string,
}

// longer goes as a file, a code block in the reply only fits so much
const SCRIPT_MAX_INLINE_LENGTH = 3800;

export interface PipingCommandExecution extends Parameters.PipingCommand {
  createJob?: (
    context: Command.Context | Interaction.InteractionContext,
    args: Record<string, any>,
  ) => Promise<RestResponsesRaw.JobResponse>,
  createResponse?: (
    context: Command.Context | Interaction.InteractionContext,
    args: Record<string, any>,
    signal?: AbortSignal,
  ) => Promise<RestResponsesRaw.FileResponse>,
  // the step as mediascript lines on `chain.key`, null when its args can't be written as any
  createMediascript?: (
    args: Record<string, any>,
    chain: MediascriptChain,
    context?: Command.Context | Interaction.InteractionContext,
  ) => Array<string> | null | string,
}


// the message is made by the loop, it knows which step ran out of time
class PipeTimeoutError extends Error {
  constructor() {
    super('Pipe took too long');
    this.name = 'PipeTimeoutError';
  }
}


// stops waiting once the pipe's deadline passes, `signal` is also handed to the job polling so it gets cancelled
async function withDeadline<T>(
  signal: AbortSignal,
  promise: Promise<T>,
): Promise<T> {
  const createError = () => new PipeTimeoutError();
  if (signal.aborted) {
    promise.catch(() => {});
    throw createError();
  }
  let onAbort!: () => void;
  const aborted = new Promise<never>((resolve, reject) => {
    onAbort = () => reject(createError());
    signal.addEventListener('abort', onAbort, {once: true});
  });
  try {
    return await Promise.race([promise, aborted]);
  } catch(error) {
    // the job polling's own abort error can win the race, report it as the timeout
    if (signal.aborted) {
      throw createError();
    }
    throw error;
  } finally {
    signal.removeEventListener('abort', onAbort);
    aborted.catch(() => {});
  }
}

export interface MediascriptChainResult {
  chain: MediascriptChain | null,
  // without a chain, the first step that has no mediascript version (or args it can't take) and why
  blocker?: PipingCommandExecution,
  reason?: string,
}

// no chain when any step has no mediascript version (or args it can't take), those pipes run a job per step
export function createMediascriptChain(
  pipers: Array<PipingCommandExecution>,
  url: string,
  context?: Command.Context | Interaction.InteractionContext,
): MediascriptChainResult {
  const chain = new MediascriptChain(url);
  for (let piper of pipers) {
    const { commandArgs, createMediascript } = piper;
    if (!createMediascript) {
      return {blocker: piper, chain: null, reason: 'no mediascript version'};
    }
    let lines: Array<string> | null | string;
    try {
      lines = createMediascript(commandArgs, chain, context);
    } catch(error) {
      // a value a line can't hold (NaN from a bad number), the job per step gives the route's own error for it
      return {blocker: piper, chain: null, reason: String(error)};
    }
    if (lines === null) {
      return {blocker: piper, chain: null, reason: 'args it can\'t take'};
    }
    chain.lines.push(...((Array.isArray(lines)) ? lines : [lines]));
  }
  return {chain};
}

// `-script`: the code to copy into a `{mediascript:...}` (the links are the media's, an attachment's expire), nothing runs
async function replyScript(
  context: Command.Context | Interaction.InteractionContext,
  chain: MediascriptChain | null,
  blocker: PipingCommandExecution | undefined,
  translate: Awaited<ReturnType<typeof getTranslator>>['translate'],
) {
  if (!chain) {
    return displayReply(context, {
      description: translate('media.pipe.script_blocked', {command: Markup.codestring((blocker) ? blocker.command.name : '?')}),
    });
  }
  const code = chain.code;
  if (code.length <= SCRIPT_MAX_INLINE_LENGTH) {
    return displayReply(context, {description: Markup.codeblock(code)});
  }
  return displayReply(context, {files: [{filename: 'pipe.mediascript.txt', value: Buffer.from(code)}]});
}

// `replyTo`: a press (or a modal from one) the result is sent through as its own message, like Edit Media's menu
export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
  replyTo?: ComponentContext | InteractionModalContext,
) {
  const safe = DefaultParameters.safe(context);
  const { translate } = await getTranslator(context);

  const pipers: Array<PipingCommandExecution> = [];
  for (let {command, commandArgs} of args.commands) {
    const commandId = (command.metadata && command.metadata.id) || '';
    if (!commandId) {
      throw new UserError(translate('media.pipe.cant_pipe', {command: command.name}));
    }
    let found = false;
    for (let key in Formatter.Commands) {
      const formatter = (Formatter.Commands as any)[key];
      if (formatter.COMMAND_ID === commandId) {
        if (formatter.IS_PIPEABLE && (typeof(formatter.createResponse) === 'function' || typeof(formatter.createJob) === 'function')) {
          pipers.push({
            command,
            // the prefixed command's parsed args, the shape its `run` turns into the formatter's when that does more
            // than pass them on (`veg`'s `payload`)
            commandArgs: (typeof(formatter.fromCommandArgs) === 'function') ? formatter.fromCommandArgs(commandArgs) : commandArgs,
            createJob: formatter.createJob,
            createMediascript: formatter.createMediascript,
            createResponse: formatter.createResponse,
          });
          found = true;
        } else {
          throw new UserError(translate('media.pipe.not_pipeable', {command: command.name}));
        }
        break;
      }
    }
    if (!found) {
      throw new UserError(translate('media.pipe.unknown_command', {command: command.name}));
    }
  }

  // the whole pipe shares one deadline, same limits as tagscript (scaled by the user's and server's premium)
  const maxTime = await TagFormatter.getMaxTime(context, TagFormatter.TagLimitDefaults);
  const signal = AbortSignal.timeout(maxTime);

  // every step has a mediascript version: one job, the media stays on the worker between steps
  const { blocker, chain, reason } = createMediascriptChain(pipers, args.url, context);
  if (args.script) {
    return replyScript(context, chain, blocker, translate);
  }
  if (chain) {
    recordPipeRun('script');
    const description = `piped: ${pipers.map((x) => x.command.name).join(' -> ')}`;
    try {
      const job = await withDeadline(signal, utilitiesMediascript(context, {code: chain.code, safe}).then((x) => {
        return jobWaitForResult(context, x, undefined, signal);
      }));
      if (job.result.error) {
        throw new JobError(job);
      }
      if (!job.result.response) {
        throw new Error('Job Failed for some reason');
      }
      return mediaReply(context, job.result.response, {description, replyTo});
    } catch(error) {
      if (error instanceof PipeTimeoutError) {
        throw new UserError(translate('media.pipe.took_too_long_script', {max: (maxTime / 1000).toLocaleString()}));
      }
      throw error;
    }
  }

  const blockerId = (blocker && blocker.command.metadata && blocker.command.metadata.id) || '';
  recordPipeRun('steps', blockerId);
  log.info(`[pipe] job per step, ${blockerId || 'unknown'} (${reason}): ${pipers.map((x) => x.command.name).join(' -> ')}`);
  // every step is its own job and a round trip of the media, fewer of them than a script can do
  if (MAX_PIPE_COMMANDS_STEPS < pipers.length) {
    throw new UserError(translate('media.pipe.too_many_steps', {
      command: (blocker) ? blocker.command.name : '?',
      max: MAX_PIPE_COMMANDS_STEPS,
    }));
  }

  let file: RequestFile | undefined;
  let fileResponse: RestResponsesRaw.FileResponse | undefined;
  // set an interval and set the current image, like every 3 seconds?
  for (let step = 0; step < pipers.length; step++) {
    const { command, commandArgs, createJob, createResponse } = pipers[step];
    if (file) {
      commandArgs.file = file;
      if (commandArgs.urls) {
        commandArgs.urls.shift();
      }
      commandArgs.url = undefined;
    } else {
      if (commandArgs.urls) {
        commandArgs.urls[0] = args.url;
      } else {
        commandArgs.url = args.url;
      }
    }

    try {
      if (createJob) {
        const job = await withDeadline(signal, createJob(context, commandArgs).then((x) => {
          return jobWaitForResult(context, x, undefined, signal);
        }));
        if (job.result.response) {
          if (fileResponse) {
            job.result.response.items[0].source = fileResponse.items[0].source;
            job.result.response.took += fileResponse.took;
          }
          fileResponse = job.result.response;
        } else if (job.result.error) {
          // coded ones get translated (and skipped by sentry) like any other job's
          throw new JobError(job);
        } else {
          throw new Error('Job Failed for some reason');
        }
      } else if (createResponse) {
        const response = await withDeadline(signal, createResponse(context, {
          safe, ...commandArgs,
        }, signal));
        if (fileResponse) {
          response.items[0].source = fileResponse.items[0].source;
          response.took += fileResponse.took;
        }
        fileResponse = response;
      } else {
        throw new Error('Unknown Piping Error');
      }
    } catch(error) {
      if (!(error instanceof PipeTimeoutError)) {
        throw error;
      }
      const message = translate('media.pipe.took_too_long', {
        command: command.name,
        max: (maxTime / 1000).toLocaleString(),
        step: (step + 1).toLocaleString(),
      });
      if (!fileResponse) {
        throw new UserError(message);
      }
      // show what the steps before it made
      const description = `piped: ${pipers.slice(0, step).map((x) => x.command.name).join(' -> ')}\n${message}`;
      return mediaReply(context, fileResponse, {description, replyTo});
    }

    if (fileResponse) {
      const piped = fileResponse.items[0].file;
      const buffer = (piped.value) ? Buffer.from(piped.value, 'base64') : Buffer.alloc(0);
      file = {
        filename: `piped-media.${piped.metadata.extension || 'png'}`,
        value: buffer,
      };
    }
  }

  if (fileResponse) {
    return mediaReply(context, fileResponse, {description: `piped: ${pipers.map((x) => x.command.name).join(' -> ')}`, replyTo});
  }

  return displayReply(context, {description: translate('media.pipe.failed')}, {replyTo});
}
