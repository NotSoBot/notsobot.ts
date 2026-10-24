import { Interaction } from 'detritus-client';

import { GuildFeatures } from '../../../../constants';
import { Formatter } from '../../../../utils';

import { BaseInteractionCommandOption } from '../../basecommand';


export class MusicCrossfadeCommand extends BaseInteractionCommandOption {
  description = 'Fade the end of each song into the next (premium servers)';
  metadata = {
    id: Formatter.Commands.MusicCrossfade.COMMAND_ID,
    // it only fades on a premium server
    premiumServer: GuildFeatures.MUSIC_ACCESS,
  };
  name = 'crossfade';

  constructor() {
    super({
      options: [
        {
          name: 'seconds',
          description: `How long, 0 turns it off (up to ${Formatter.Commands.MusicCrossfade.MAX_MUSIC_CROSSFADE}), leave empty to see it`,
          maxValue: Formatter.Commands.MusicCrossfade.MAX_MUSIC_CROSSFADE,
          minValue: 0,
          type: Number,
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: {seconds?: number}) {
    return Formatter.Commands.MusicCrossfade.createMessage(context, {
      seconds: (typeof(args.seconds) === 'number') ? args.seconds : null,
    });
  }
}
