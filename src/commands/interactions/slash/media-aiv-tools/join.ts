import { Interaction } from 'detritus-client';

import { Formatter } from '../../../../utils';

import { BaseInteractionMediasCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'join';

export class MediaAIVToolsJoinCommand extends BaseInteractionMediasCommandOption {
  description = 'Join two Medias together';
  metadata = {
    id: Formatter.Commands.MediaAIVToolsJoin.COMMAND_ID,
  };
  name = COMMAND_NAME;

  constructor() {
    super({
      options: [
        {name: 'noresize', description: 'Do not resize media', type: Boolean},
        {name: 'noloop', description: 'Do not loop the shortest media to match the longest media timestamp', type: Boolean},
        {name: 'vertical', description: 'Join the media vertically', type: Boolean},
      ],
      minAmount: 2,
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaAIVToolsJoin.CommandArgs) {
    return Formatter.Commands.MediaAIVToolsJoin.createMessage(context, args);
  }
}
