import { Command, Interaction } from 'detritus-client';
import { Markup } from 'detritus-client/lib/utils';
import { RequestFile, Response } from 'detritus-rest';

import { RestResponsesRaw } from '../../../api/types';
import {
  EmbedBrands,
  EmbedColors,
  GoogleLocales,
  GoogleLocalesText,
} from '../../../constants';
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


export const COMMAND_ID = 'media.aiv.pipe';

export interface CommandArgs {
  commands: Array<Parameters.PipingCommand>,
  url: string,
}

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

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const safe = DefaultParameters.safe(context);
  const { translate } = await getTranslator(context);

  const pipers: Array<PipingCommandExecution> = [];
  for (let {command, commandArgs} of args.commands) {
    const commandId = (command.metadata && command.metadata.id) || '';
    if (!commandId) {
      throw new Error(translate('media.pipe.cant_pipe', {command: command.name}));
    }
    let found = false;
    for (let key in Formatter.Commands) {
      const formatter = (Formatter.Commands as any)[key];
      if (formatter.COMMAND_ID === commandId) {
        if (formatter.IS_PIPEABLE && (typeof(formatter.createResponse) === 'function' || typeof(formatter.createJob) === 'function')) {
          pipers.push({
            command,
            commandArgs,
            createJob: formatter.createJob,
            createResponse: formatter.createResponse,
          });
          found = true;
        } else {
          throw new Error(translate('media.pipe.not_pipeable', {command: command.name}));
        }
        break;
      }
    }
    if (!found) {
      throw new Error(translate('media.pipe.unknown_command', {command: command.name}));
    }
  }

  // the whole pipe shares one deadline, same limits as tagscript (scaled by the user's and server's premium)
  const maxTime = await TagFormatter.getMaxTime(context, TagFormatter.TagLimitDefaults);
  const signal = AbortSignal.timeout(maxTime);

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
            job.result.response.file_old = fileResponse.file_old;
            job.result.response.took += fileResponse.took;
          }
          fileResponse = job.result.response;
        } else if (job.result.error) {
          throw new Error(`Job Failed: ${job.result.error}`);
        } else {
          throw new Error('Job Failed for some reason');
        }
      } else if (createResponse) {
        const response = await withDeadline(signal, createResponse(context, {
          safe, ...commandArgs,
        }, signal));
        if (fileResponse) {
          response.file_old = fileResponse.file_old;
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
        throw new Error(message);
      }
      // show what the steps before it made
      const description = `piped: ${pipers.slice(0, step).map((x) => x.command.name).join(' -> ')}\n${message}`;
      return mediaReply(context, fileResponse, {description});
    }

    if (fileResponse) {
      const buffer = (fileResponse.file.value) ? Buffer.from(fileResponse.file.value, 'base64') : Buffer.alloc(0);
      file = {
        filename: `piped-media.${fileResponse.file.metadata.extension || 'png'}`,
        value: buffer,
      };
    }
  }

  if (fileResponse) {
    return mediaReply(context, fileResponse, {description: `piped: ${pipers.map((x) => x.command.name).join(' -> ')}`});
  }

  return displayReply(context, {description: translate('media.pipe.failed')});
}
