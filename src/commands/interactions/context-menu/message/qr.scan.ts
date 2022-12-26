import { Interaction } from 'detritus-client';
import { MessageFlags } from 'detritus-client/lib/constants';

import { Formatter, findMediaUrlInMessages } from '../../../../utils';

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

  onBeforeRun(context: Interaction.InteractionContext, args: QRScanCommandArgs) {
    args.url = findMediaUrlInMessages([args.message], {audio: false, video: false});
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
