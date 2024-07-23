import { Interaction } from 'detritus-client';
import {
  ApplicationIntegrationTypes,
  InteractionContextTypes,
  MessageFlags,
} from 'detritus-client/lib/constants';

import { utilitiesFetchMedia } from '../../../../api';
import {
  DefaultParameters,
  Formatter,
  findMediaUrlInMessages,
  getOrFetchRealUrl,
} from '../../../../utils';

import { BaseContextMenuMessageCommand, ContextMenuMessageArgs } from '../../basecommand';


export interface TranslateCommandArgs extends ContextMenuMessageArgs {
  text: string,
  url?: string | null,
}

export const COMMAND_NAME = 'Translate (w/ OCR & Transcribe)';

export default class TranslateCommand extends BaseContextMenuMessageCommand {
  metadata = {
    id: Formatter.Commands.ToolsTranslate.COMMAND_ID,
  };
  name = COMMAND_NAME;

  contexts = [
    InteractionContextTypes.GUILD,
    InteractionContextTypes.BOT_DM,
    InteractionContextTypes.PRIVATE_CHANNEL,
  ];
  integrationTypes = [
    ApplicationIntegrationTypes.GUILD_INSTALL,
    ApplicationIntegrationTypes.USER_INSTALL,
  ];

  async onBeforeRun(context: Interaction.InteractionContext, args: TranslateCommandArgs) {
    args.text = args.message.content;
    args.url = findMediaUrlInMessages([args.message]);
    if (args.url) {
      args.url = await getOrFetchRealUrl(context, args.url);
    }
    return !!(args.text || args.url);
  }

  onCancelRun(context: Interaction.InteractionContext, args: TranslateCommandArgs) {
    return context.editOrRespond({
      content: 'Message must have some sort of media or text to translate!',
      flags: MessageFlags.EPHEMERAL,
    });
  }

  async run(context: Interaction.InteractionContext, args: TranslateCommandArgs) {
    const to = await DefaultParameters.locale(context);
    if (args.url) {
      const response = await utilitiesFetchMedia(context, {url: args.url});
      const file = {
        filename: response.file.filename,
        value: Buffer.from(response.file.value, 'base64'),
      };

      const { mimetype } = response.file.metadata;
      if (mimetype.startsWith('audio/') || mimetype.startsWith('video/')) {
        // transcribe
        return Formatter.Commands.ToolsTranscribeTranslate.createMessage(context, {
          file,
          isEphemeral: true,
          to,
        });
      } else if (mimetype.startsWith('text/')) {
        return Formatter.Commands.ToolsTranslate.createMessage(context, {
          isEphemeral: true,
          text: file.value.toString(),
          to,
        });
      }

      return Formatter.Commands.ToolsOCRTranslate.createMessage(context, {
        file,
        isEphemeral: true,
        to,
      });
    }
    return Formatter.Commands.ToolsTranslate.createMessage(context, {
      isEphemeral: true,
      text: args.text,
      to,
    });
  }
}
