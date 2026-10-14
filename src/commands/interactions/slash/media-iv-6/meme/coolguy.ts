import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'coolguy';

export class MediaIVMemeCoolGuyCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Turn an Image or Video into the face of the Cool Guy meme';
  descriptionLocalizations = I18n.localizations('commands.media_iv_6.meme.coolguy.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayCoolGuy.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv_6.meme.coolguy.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayCoolGuy.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayCoolGuy.createMessage(context, args);
  }
}
