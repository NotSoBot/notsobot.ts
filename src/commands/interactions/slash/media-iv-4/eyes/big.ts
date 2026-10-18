import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';

import { EYES_FLIPPED_OPTION } from './options';


export const COMMAND_NAME = 'big';

export class MediaIVEyesBigCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Attach big eyes to people\'s faces in an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv_4.eyes.big.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationEyesBig.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv_4.eyes.big.name');

  constructor() {
    super({
      options: [
        EYES_FLIPPED_OPTION,
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationEyesBig.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationEyesBig.createMessage(context, args);
  }
}
