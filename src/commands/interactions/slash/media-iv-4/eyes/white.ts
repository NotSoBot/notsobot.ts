import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'white';

export class MediaIVEyesWhiteCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Attach white eyes to people\'s faces in an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv_4.eyes.white.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationEyesWhite.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv_4.eyes.white.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationEyesWhite.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationEyesWhite.createMessage(context, args);
  }
}
