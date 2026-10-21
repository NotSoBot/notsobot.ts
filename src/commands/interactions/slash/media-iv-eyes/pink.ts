import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../basecommand';

import { EYES_FLIPPED_OPTION } from './options';


export const COMMAND_NAME = 'pink';

export class MediaIVEyesPinkCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Attach pink eyes to people\'s faces in an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv_4.eyes.pink.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationEyesPink.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv_4.eyes.pink.name');

  constructor() {
    super({
      options: [
        EYES_FLIPPED_OPTION,
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationEyesPink.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationEyesPink.createMessage(context, args);
  }
}
