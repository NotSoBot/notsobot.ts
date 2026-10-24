import { Interaction } from 'detritus-client';

import { Formatter } from '../../../../../utils';

import { BaseInteractionCommandOption } from '../../../basecommand';


export class MusicQueueRemoveCommand extends BaseInteractionCommandOption {
  description = 'Remove songs from the queue by their positions';
  metadata = {
    id: Formatter.Commands.MusicQueueRemove.COMMAND_ID,
  };
  name = 'remove';

  constructor() {
    super({
      options: [
        {name: 'positions', description: 'Their positions in the queue, like 2, 1 3 5 or 5-20', required: true, value: Formatter.Commands.MusicQueueRemove.musicQueuePositions},
      ],
    });
  }

  onBeforeRun(context: Interaction.InteractionContext, args: Formatter.Commands.MusicQueueRemove.CommandArgs) {
    return !!args.positions.length;
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MusicQueueRemove.CommandArgs) {
    return Formatter.Commands.MusicQueueRemove.createMessage(context, args);
  }
}
