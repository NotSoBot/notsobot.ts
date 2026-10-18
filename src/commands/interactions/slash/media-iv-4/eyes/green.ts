import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';

import { EYES_FLIPPED_OPTION } from './options';


export const COMMAND_NAME = 'green';

export class MediaIVEyesGreenCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Attach green eyes to people\'s faces in an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv_4.eyes.green.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationEyesGreen.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv_4.eyes.green.name');

  constructor() {
    super({
      options: [
        EYES_FLIPPED_OPTION,
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationEyesGreen.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationEyesGreen.createMessage(context, args);
  }
}
