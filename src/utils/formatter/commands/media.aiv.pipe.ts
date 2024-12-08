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
} from '../../../utils';


export const COMMAND_ID = 'media.aiv.pipe';

export interface CommandArgs {
  commands: Array<Parameters.PipingCommand>,
  url: string,
}

export interface PipingCommandExecution extends Parameters.PipingCommand {
  execute: (
    context: Command.Context | Interaction.InteractionContext,
    args: Record<string, any>,
  ) => Promise<RestResponsesRaw.FileResponse>,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const isFromInteraction = (context instanceof Interaction.InteractionContext);
  const embed = (isFromInteraction) ? new Embed() : createUserEmbed(context.user);

  embed.setDescription('piping wip');

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
        if (formatter.IS_PIPEABLE && typeof(formatter.createResponse) === 'function') {
          pipers.push({command, commandArgs, execute: formatter.createResponse});
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
  let imageReplyOptions: {description?: string, options: ImageReplyOptions} | undefined;
  // set an interval and set the current image, like every 3 seconds?
  for (let {command, commandArgs, execute} of pipers) {
    if (file) {
      commandArgs.file = file;
    } else {
      commandArgs.url = args.url;
    }

    const response = await execute(context, commandArgs);
    const currentImageReplyOptions = generateImageReplyOptionsFromResponse(response);
    if (imageReplyOptions) {
      // add imageReplyOptions.description maybe?
      currentImageReplyOptions.options.framesOld = imageReplyOptions.options.framesOld;
      currentImageReplyOptions.options.took = (currentImageReplyOptions.options.took || 0) + (imageReplyOptions.options.took || 0);
    }
    imageReplyOptions = currentImageReplyOptions;

    const buffer = (response.file.value) ? Buffer.from(response.file.value, 'base64') : Buffer.alloc(0);
    file = {
      filename: `piped-media.${currentImageReplyOptions.options.extension || 'png'}`,
      value: buffer,
    };
  }

  embed.setDescription(`piped: ${pipers.map((x) => x.command.name).join(' -> ')}`);

  // include piping command names in embed description
  if (file && imageReplyOptions) {
    imageReplyOptions.options.embed = embed;
    return imageReplyFromOptions(context, file.value, imageReplyOptions.options);
  }

  embed.setDescription('failed to pipe?');

  return editOrReply(context, {embed});
}
