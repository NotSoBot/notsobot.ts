import { Interaction } from 'detritus-client';

import { Formatter } from '../../../../utils';

import { BaseInteractionMediaCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'seesaw';

export class MediaAIVToolsSeeSawCommand extends BaseInteractionMediaCommandOption {
  description = 'SeeSaw an Animated Image/Audio/Video, add a reversed copy of itself at the end of it';
  metadata = {
    id: Formatter.Commands.MediaAIVToolsSeeSaw.COMMAND_ID,
  };
  name = COMMAND_NAME;

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaAIVToolsSeeSaw.CommandArgs) {
    return Formatter.Commands.MediaAIVToolsSeeSaw.createMessage(context, args);
  }
}
