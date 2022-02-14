import { Interaction } from 'detritus-client';

import { Formatter } from '../../../../../utils';

import { BaseInteractionImageCommandOption } from '../../../basecommand';


export class ToolsQrScanCommand extends BaseInteractionImageCommandOption {
  description = 'Scan a QR code';
  metadata = {
    id: Formatter.Commands.ToolsQrScan.COMMAND_ID,
  };
  name = 'scan';

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.ToolsQrScan.CommandArgs) {
    return Formatter.Commands.ToolsQrScan.createMessage(context, args);
  }
}
