import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'money';

export class MediaIVEyesMoneyCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Attach money eyes to people\'s faces in an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv_4.eyes.money.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationEyesMoney.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv_4.eyes.money.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationEyesMoney.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationEyesMoney.createMessage(context, args);
  }
}
