import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'blue';

export class MediaIVEyesBlueCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Attach blue eyes to people\'s faces in an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv_4.eyes.blue.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationEyesBlue.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv_4.eyes.blue.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationEyesBlue.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationEyesBlue.createMessage(context, args);
  }
}
