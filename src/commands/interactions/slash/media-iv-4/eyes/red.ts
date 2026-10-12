import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'red';

export class MediaIVEyesRedCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Attach red eyes to people\'s faces in an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv_4.eyes.red.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationEyesRed.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv_4.eyes.red.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationEyesRed.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationEyesRed.createMessage(context, args);
  }
}
