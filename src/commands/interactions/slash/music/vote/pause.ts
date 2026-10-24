import { Interaction } from 'detritus-client';

import { Formatter } from '../../../../../utils';

import { BaseInteractionCommandOption } from '../../../basecommand';


export class MusicVotePauseCommand extends BaseInteractionCommandOption {
  description = 'Make pausing someone else\'s song a vote';
  metadata = {
    id: Formatter.Commands.MusicVotePause.COMMAND_ID,
  };
  name = 'pause';

  constructor() {
    super({
      options: [
        {name: 'enabled', description: 'On by default, leave empty to see it', type: Boolean},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: {enabled?: boolean}) {
    return Formatter.Commands.MusicVotePause.createMessage(context, {
      enabled: (typeof(args.enabled) === 'boolean') ? args.enabled : null,
    });
  }
}
