import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'bloodshot';

export class MediaIVEyesBloodshotCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Attach bloodshot eyes to people\'s faces in an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv_4.eyes.bloodshot.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationEyesBloodshot.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv_4.eyes.bloodshot.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationEyesBloodshot.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationEyesBloodshot.createMessage(context, args);
  }
}
