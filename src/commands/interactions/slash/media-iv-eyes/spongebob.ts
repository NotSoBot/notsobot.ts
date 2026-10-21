import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../basecommand';

import { EYES_FLIPPED_OPTION } from './options';


export const COMMAND_NAME = 'spongebob';

export class MediaIVEyesSpongebobCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Attach spongebob eyes to people\'s faces in an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv_4.eyes.spongebob.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationEyesSpongebob.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv_4.eyes.spongebob.name');

  constructor() {
    super({
      options: [
        EYES_FLIPPED_OPTION,
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationEyesSpongebob.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationEyesSpongebob.createMessage(context, args);
  }
}
