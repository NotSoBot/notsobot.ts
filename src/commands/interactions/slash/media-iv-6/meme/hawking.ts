import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'hawking';

export class MediaIVMemeStephenHawking1Command extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay an Image or Video on a chalkboard next to Stephen Hawking';
  descriptionLocalizations = I18n.localizations('commands.media_iv_6.meme.hawking.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayPersonsStephenHawking1.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv_6.meme.hawking.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayPersonsStephenHawking1.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayPersonsStephenHawking1.createMessage(context, args);
  }
}
