import { Interaction } from 'detritus-client';

import { Formatter } from '../../../../../utils';

import { BaseInteractionCommandOption } from '../../../basecommand';


export class MusicVoteSkipCommand extends BaseInteractionCommandOption {
  description = 'Make skipping someone else\'s song a vote';
  metadata = {
    id: Formatter.Commands.MusicVoteSkip.COMMAND_ID,
  };
  name = 'skip';

  constructor() {
    super({
      options: [
        {name: 'enabled', description: 'On by default, leave empty to see it', type: Boolean},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: {enabled?: boolean}) {
    return Formatter.Commands.MusicVoteSkip.createMessage(context, {
      enabled: (typeof(args.enabled) === 'boolean') ? args.enabled : null,
    });
  }
}
