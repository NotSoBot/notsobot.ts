import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'gold';

export class MediaIVGoldCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Gold tintify an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.tint.gold.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationGold.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.tint.gold.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationGold.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationGold.createMessage(context, args);
  }
}
