import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'bill';

export class MediaIVBillCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Engrave an Image or Video onto a 100 dollar bill';
  descriptionLocalizations = I18n.localizations('commands.media_iv_5.fun.bill.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationBill.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv_5.fun.bill.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationBill.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationBill.createMessage(context, args);
  }
}
