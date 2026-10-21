import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'artistic';

export class MediaIVArtisticCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Turn an Image or Video into an embossed painting';
  descriptionLocalizations = I18n.localizations('commands.media_iv_5.fun.artistic.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationArtistic.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv_5.fun.artistic.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationArtistic.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationArtistic.createMessage(context, args);
  }
}
