import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'wall';

export class MediaIVWallCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Create a wall out of an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.fun.wall.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationWall.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.fun.wall.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationWall.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationWall.createMessage(context, args);
  }
}
