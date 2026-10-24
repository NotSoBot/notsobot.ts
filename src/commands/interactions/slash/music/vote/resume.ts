import { Interaction } from 'detritus-client';

import { Formatter } from '../../../../../utils';

import { BaseInteractionCommandOption } from '../../../basecommand';


export class MusicVoteResumeCommand extends BaseInteractionCommandOption {
  description = 'Make resuming someone else\'s paused song a vote';
  metadata = {
    id: Formatter.Commands.MusicVoteResume.COMMAND_ID,
  };
  name = 'resume';

  constructor() {
    super({
      options: [
        {name: 'enabled', description: 'On by default, leave empty to see it', type: Boolean},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: {enabled?: boolean}) {
    return Formatter.Commands.MusicVoteResume.createMessage(context, {
      enabled: (typeof(args.enabled) === 'boolean') ? args.enabled : null,
    });
  }
}
