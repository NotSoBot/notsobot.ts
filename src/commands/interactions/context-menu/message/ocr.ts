import { Interaction } from 'detritus-client';
import {
  ApplicationIntegrationTypes,
  InteractionContextTypes,
  MessageFlags,
} from 'detritus-client/lib/constants';

import { Formatter, I18n, findMediaUrlInMessages } from '../../../../utils';

import { BaseContextMenuMessageCommand, ContextMenuMessageArgs } from '../../basecommand';


export interface OCRCommandArgs extends ContextMenuMessageArgs {
  url?: string | null,
}

export const COMMAND_NAME = 'OCR';

export default class OCRCommand extends BaseContextMenuMessageCommand {
  metadata = {
    id: Formatter.Commands.ToolsOCR.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.context.ocr.name');

  contexts = [
    InteractionContextTypes.GUILD,
    InteractionContextTypes.BOT_DM,
    InteractionContextTypes.PRIVATE_CHANNEL,
  ];
  integrationTypes = [
    ApplicationIntegrationTypes.GUILD_INSTALL,
    ApplicationIntegrationTypes.USER_INSTALL,
  ];

  onBeforeRun(context: Interaction.InteractionContext, args: OCRCommandArgs) {
    args.url = findMediaUrlInMessages([args.message], {audio: false, video: false});
    return !!args.url;
  }

  async onCancelRun(context: Interaction.InteractionContext, args: OCRCommandArgs) {
    const { translate } = await I18n.getTranslator(context);
    return context.editOrRespond({
      content: translate('commands.context.ocr.no_media'),
      flags: MessageFlags.EPHEMERAL,
    });
  }

  async run(context: Interaction.InteractionContext, args: OCRCommandArgs) {
    return Formatter.Commands.ToolsOCR.createMessage(context, {
      isEphemeral: true,
      url: args.url || '',
    });
  }
}
