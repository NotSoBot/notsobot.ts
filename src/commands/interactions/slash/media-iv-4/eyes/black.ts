import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'black';

export class MediaIVEyesBlackCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Attach black eyes to people\'s faces in an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv_4.eyes.black.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationEyesBlack.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv_4.eyes.black.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationEyesBlack.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationEyesBlack.createMessage(context, args);
  }
}
