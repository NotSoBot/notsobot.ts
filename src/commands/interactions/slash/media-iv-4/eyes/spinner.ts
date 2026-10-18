import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';

import { EYES_FLIPPED_OPTION } from './options';


export const COMMAND_NAME = 'spinner';

export class MediaIVEyesSpinnerCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Attach spinner eyes to people\'s faces in an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv_4.eyes.spinner.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationEyesSpinner.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv_4.eyes.spinner.name');

  constructor() {
    super({
      options: [
        EYES_FLIPPED_OPTION,
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationEyesSpinner.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationEyesSpinner.createMessage(context, args);
  }
}
