import { Interaction } from 'detritus-client';
import {
  ApplicationIntegrationTypes,
  InteractionContextTypes,
  MessageFlags,
} from 'detritus-client/lib/constants';

import { Formatter, findMediaUrlInMessages, getOrFetchRealUrl } from '../../../../utils';

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

  onCancelRun(context: Interaction.InteractionContext, args: QRScanCommandArgs) {
    return context.editOrRespond({
      content: 'Message must have some sort of image to scan!',
      flags: MessageFlags.EPHEMERAL,
    });
  }

  async run(context: Interaction.InteractionContext, args: QRScanCommandArgs) {
    return Formatter.Commands.ToolsQrScan.createMessage(context, {
      isEphemeral: true,
      url: args.url || '',
    });
  }
}
