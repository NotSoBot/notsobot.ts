import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'bill';

export class MediaIBillCommand extends BaseInteractionImageCommandOption {
  description = 'Draw an Image on a 100 dollar bill';
  descriptionLocalizations = I18n.localizations('commands.media_i.fun.bill.description');
  metadata = {
    id: Formatter.Commands.MediaIManipulationBill.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_i.fun.bill.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIManipulationBill.CommandArgs) {
    return Formatter.Commands.MediaIManipulationBill.createMessage(context, args);
  }
}
