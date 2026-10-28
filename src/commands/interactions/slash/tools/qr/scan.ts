import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageCommandOption } from '../../../basecommand';


export class ToolsQrScanCommand extends BaseInteractionImageCommandOption {
  description = 'Scan an Image for QR codes';
  descriptionLocalizations = I18n.localizations('commands.tools.qr.scan.description');
  metadata = {
    id: Formatter.Commands.ToolsQrScan.COMMAND_ID,
  };
  name = 'scan';
  nameLocalizations = I18n.localizations('commands.tools.qr.scan.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.ToolsQrScan.CommandArgs) {
    return Formatter.Commands.ToolsQrScan.createMessage(context, args);
  }
}
