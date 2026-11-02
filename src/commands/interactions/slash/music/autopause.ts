import { Interaction } from 'detritus-client';

import { Formatter } from '../../../../utils';

import { BaseInteractionCommandOption } from '../../basecommand';


export class MusicAutopauseCommand extends BaseInteractionCommandOption {
  description = 'Pause when nobody\'s listening, and how long it stays paused before leaving';
  metadata = {
    id: Formatter.Commands.MusicAutopause.COMMAND_ID,
  };
  name = 'autopause';

  constructor() {
    super({
      options: [
        {name: 'enabled', description: 'On for every server, only premium servers can turn it off', type: Boolean},
        {
          name: 'leave_after',
          description: 'How long it stays paused before leaving (3 minutes by default, 24/7 stays)',
          choices: [
            {name: 'Right away', value: 0},
            {name: '15 seconds', value: 15},
            {name: '30 seconds', value: 30},
            {name: '1 minute', value: 60},
            {name: '2 minutes', value: 120},
            {name: '3 minutes', value: 180},
            {name: '4 minutes', value: 240},
            {name: '5 minutes', value: 300},
          ],
          type: Number,
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: {enabled?: boolean, leave_after?: number}) {
    return Formatter.Commands.MusicAutopause.createMessage(context, {
      enabled: (typeof(args.enabled) === 'boolean') ? args.enabled : null,
      leaveAfter: (typeof(args.leave_after) === 'number') ? args.leave_after : null,
    });
  }
}
