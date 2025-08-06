import { Command, Interaction } from 'detritus-client';
import { Embed, Markup } from 'detritus-client/lib/utils';
import { RequestFile, Response } from 'detritus-rest';

import { RestResponsesRaw } from '../../../api/types';
import {
  EmbedBrands,
  EmbedColors,
  GoogleLocales,
  GoogleLocalesText,
} from '../../../constants';
import {
  Formatter,
  Parameters,
  createUserEmbed,
  editOrReply,
  generateImageReplyOptionsFromResponse,
  imageReplyFromOptions,
  ImageReplyOptions,
  jobWaitForResult,
  mediaReply,
} from '../../../utils';


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
  ) => Promise<RestResponsesRaw.FileResponse>,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const isFromInteraction = (context instanceof Interaction.InteractionContext);

  const pipers: Array<PipingCommandExecution> = [];
  for (let {command, commandArgs} of args.commands) {
    const commandId = (command.metadata && command.metadata.id) || '';
    if (!commandId) {
      throw new Error(`cant pipe ${command.name} lol`);
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
          throw new Error(`${command.name} is not a valid piping command`);
        }
        break;
      }
    }
    if (!found) {
      throw new Error(`dunno how to pipe ${command.name} yet, sorry`);
    }
  }

  let file: RequestFile | undefined;
  let fileResponse: RestResponsesRaw.FileResponse | undefined;
  // set an interval and set the current image, like every 3 seconds?
  for (let {command, commandArgs, createJob, createResponse} of pipers) {
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

    if (createJob) {
      const job = await createJob(context, commandArgs).then((x) => jobWaitForResult(context, x));
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
      const response = await createResponse(context, commandArgs);
      if (fileResponse) {
        response.file_old = fileResponse.file_old;
        response.took += fileResponse.took;
      }
      fileResponse = response;
    } else {
      throw new Error('Unknown Piping Error');
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

  return editOrReply(context, 'failed to pipe?');
}
