import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'illuminati';

export class MediaIVEyesIlluminatiCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Attach illuminati eyes to people\'s faces in an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv_4.eyes.illuminati.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationEyesIlluminati.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv_4.eyes.illuminati.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationEyesIlluminati.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationEyesIlluminati.createMessage(context, args);
  }
}
