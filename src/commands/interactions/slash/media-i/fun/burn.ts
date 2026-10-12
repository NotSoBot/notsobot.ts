import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'burn';

export class MediaIBurnCommand extends BaseInteractionImageCommandOption {
  description = 'Draw an Image on a burning photo';
  descriptionLocalizations = I18n.localizations('commands.media_i.fun.burn.description');
  metadata = {
	id: Formatter.Commands.MediaIManipulationBurn.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_i.fun.burn.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIManipulationBurn.CommandArgs) {
	return Formatter.Commands.MediaIManipulationBurn.createMessage(context, args);
  }
}
