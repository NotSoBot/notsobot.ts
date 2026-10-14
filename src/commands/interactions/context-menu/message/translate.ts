import { Interaction } from 'detritus-client';
import {
  ApplicationIntegrationTypes,
  InteractionContextTypes,
} from 'detritus-client/lib/constants';

import { utilitiesFetchMedia } from '../../../../api';
import {
  DefaultParameters,
  Formatter,
  I18n,
  displayReply,
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
  nameLocalizations = I18n.localizations('commands.context.translate.name');

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
    args.text = args.message.content || '';
    // translate the message's own text when it has any, any media (even an embed thumbnail from a link) used to make
    // it ocr the image instead. only look for media when there's no text besides links
    const hasText = !!args.text.replace(/https?:\/\/\S+/gi, '').trim();
    if (!hasText) {
      args.url = findMediaUrlInMessages([args.message]);
      if (args.url) {
        args.url = await getOrFetchRealUrl(context, args.url);
      }
    }
    return !!(args.text || args.url);
  }

  async onCancelRun(context: Interaction.InteractionContext, args: TranslateCommandArgs) {
    const { translate } = await I18n.getTranslator(context);
    return displayReply(context, {description: translate('commands.context.translate.no_media'), ephemeral: true});
  }

  async run(context: Interaction.InteractionContext, args: TranslateCommandArgs) {
    const to = await DefaultParameters.locale(context);
    if (args.url) {
      const response = await utilitiesFetchMedia(context, {url: args.url});
      const file = {
        filename: response.file.filename,
        value: (response.file.value) ? Buffer.from(response.file.value, 'base64') : Buffer.alloc(0),
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
