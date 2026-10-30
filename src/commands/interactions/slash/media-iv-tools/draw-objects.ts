import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'draw-objects';

export class MediaIVToolsDrawObjectsCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Draw a labeled box around every object detected in an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv_tools.draw_objects.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationDrawObjects.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv_tools.draw_objects.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationDrawObjects.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationDrawObjects.createMessage(context, args);
  }
}
