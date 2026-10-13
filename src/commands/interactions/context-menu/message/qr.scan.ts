import { Interaction } from 'detritus-client';
import {
  ApplicationIntegrationTypes,
  InteractionContextTypes,
} from 'detritus-client/lib/constants';

import { Formatter, I18n, displayReply, findMediaUrlInMessages, getOrFetchRealUrl } from '../../../../utils';

import { BaseContextMenuMessageCommand, ContextMenuMessageArgs } from '../../basecommand';


export interface QRScanCommandArgs extends ContextMenuMessageArgs {
  url?: string | null,
}

export const COMMAND_NAME = 'QR Scan';

export default class QRScanCommand extends BaseContextMenuMessageCommand {
  metadata = {
    id: Formatter.Commands.ToolsQrScan.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.context.qr_scan.name');

  contexts = [
    InteractionContextTypes.GUILD,
    InteractionContextTypes.BOT_DM,
    InteractionContextTypes.PRIVATE_CHANNEL,
  ];
  integrationTypes = [
    ApplicationIntegrationTypes.GUILD_INSTALL,
    ApplicationIntegrationTypes.USER_INSTALL,
  ];

  async onBeforeRun(context: Interaction.InteractionContext, args: QRScanCommandArgs) {
    args.url = findMediaUrlInMessages([args.message], {audio: false, video: false});
    if (args.url) {
      args.url = await getOrFetchRealUrl(context, args.url);
    }
    return !!args.url;
  }

  async onCancelRun(context: Interaction.InteractionContext, args: QRScanCommandArgs) {
    const { translate } = await I18n.getTranslator(context);
    return displayReply(context, {description: translate('commands.context.qr_scan.no_media'), ephemeral: true});
  }

  async run(context: Interaction.InteractionContext, args: QRScanCommandArgs) {
    return Formatter.Commands.ToolsQrScan.createMessage(context, {
      isEphemeral: true,
      url: args.url || '',
    });
  }
}
