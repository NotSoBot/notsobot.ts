import { Interaction } from 'detritus-client';

import { GuildFeatures } from '../../../../constants';
import { Formatter } from '../../../../utils';

import { BaseInteractionCommandOption } from '../../basecommand';


export class MusicStayCommand extends BaseInteractionCommandOption {
  description = 'Keep the bot in voice when the queue runs out (premium servers, on by default)';
  metadata = {
    id: Formatter.Commands.MusicStay.COMMAND_ID,
    // it only does anything on a premium server
    premiumServer: GuildFeatures.MUSIC_ACCESS,
  };
  name = '247';

  constructor() {
    super({
      options: [
        {name: 'enabled', description: 'On by default, leave empty to see it', type: Boolean},
        {name: 'pause_when_alone', description: 'Pause when everyone leaves the channel and carry on when someone\'s back (off by default)', type: Boolean},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: {enabled?: boolean, pause_when_alone?: boolean}) {
    return Formatter.Commands.MusicStay.createMessage(context, {
      enabled: (typeof(args.enabled) === 'boolean') ? args.enabled : null,
      pauseAlone: (typeof(args.pause_when_alone) === 'boolean') ? args.pause_when_alone : null,
    });
  }
}
