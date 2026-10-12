import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'small';

export class MediaIVEyesSmallCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Attach small eyes to people\'s faces in an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv_4.eyes.small.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationEyesSmall.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv_4.eyes.small.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationEyesSmall.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationEyesSmall.createMessage(context, args);
  }
}
