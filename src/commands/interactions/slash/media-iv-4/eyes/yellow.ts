import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';

import { EYES_FLIPPED_OPTION } from './options';


export const COMMAND_NAME = 'yellow';

export class MediaIVEyesYellowCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Attach yellow eyes to people\'s faces in an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv_4.eyes.yellow.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationEyesYellow.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv_4.eyes.yellow.name');

  constructor() {
    super({
      options: [
        EYES_FLIPPED_OPTION,
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationEyesYellow.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationEyesYellow.createMessage(context, args);
  }
}
