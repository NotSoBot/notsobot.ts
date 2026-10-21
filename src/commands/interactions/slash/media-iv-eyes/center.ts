import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../basecommand';

import { EYES_FLIPPED_OPTION } from './options';


export const COMMAND_NAME = 'center';

export class MediaIVEyesCenterCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Attach center eyes to people\'s faces in an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv_4.eyes.center.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationEyesCenter.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv_4.eyes.center.name');

  constructor() {
    super({
      options: [
        EYES_FLIPPED_OPTION,
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationEyesCenter.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationEyesCenter.createMessage(context, args);
  }
}
