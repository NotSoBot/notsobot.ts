import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../utils';

import { BaseInteractionMediaCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'seesaw';

export class MediaAIVSeeSawCommand extends BaseInteractionMediaCommandOption {
  description = 'SeeSaw an Animated Image/Audio/Video, add a reversed copy of itself at the end of it';
  descriptionLocalizations = I18n.localizations('commands.media_aiv.seesaw.description');
  metadata = {
    id: Formatter.Commands.MediaAIVManipulationSeeSaw.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_aiv.seesaw.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaAIVManipulationSeeSaw.CommandArgs) {
    return Formatter.Commands.MediaAIVManipulationSeeSaw.createMessage(context, args);
  }
}
