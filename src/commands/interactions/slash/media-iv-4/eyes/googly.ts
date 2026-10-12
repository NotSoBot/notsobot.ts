import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'googly';

export class MediaIVEyesGooglyCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Attach googly eyes to people\'s faces in an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv_4.eyes.googly.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationEyesGoogly.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv_4.eyes.googly.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationEyesGoogly.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationEyesGoogly.createMessage(context, args);
  }
}
