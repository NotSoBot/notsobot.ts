import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../basecommand';

import { EYES_FLIPPED_OPTION } from './options';


export const COMMAND_NAME = 'horror';

export class MediaIVEyesHorrorCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Attach horror eyes to people\'s faces in an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv_4.eyes.horror.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationEyesHorror.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv_4.eyes.horror.name');

  constructor() {
    super({
      options: [
        EYES_FLIPPED_OPTION,
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationEyesHorror.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationEyesHorror.createMessage(context, args);
  }
}
