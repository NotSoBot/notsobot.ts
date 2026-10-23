import { Interaction } from 'detritus-client';

import { GuildFeatures } from '../../../../../constants';
import { Formatter } from '../../../../../utils';

import { BaseInteractionCommandOption } from '../../../basecommand';


// `1 3 5` or `1,3,5`, anything that isn't a positive number is left out (like the prefix command)
function positions(value: string): Array<number> {
  const numbers = value.split(/[\s,]+/).filter(Boolean).map((x) => parseInt(x));
  return Array.from(new Set(numbers.filter((x) => Number.isSafeInteger(x) && 0 < x)));
}

export class MusicQueueRemoveCommand extends BaseInteractionCommandOption {
  description = 'Remove songs from the queue by their positions';
  metadata = {
    id: Formatter.Commands.MusicQueueRemove.COMMAND_ID,
    premiumServer: GuildFeatures.MUSIC_ACCESS,
  };
  name = 'remove';

  constructor() {
    super({
      options: [
        {name: 'positions', description: 'Their positions in the queue, like 2 or 1 3 5', required: true, value: positions},
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
