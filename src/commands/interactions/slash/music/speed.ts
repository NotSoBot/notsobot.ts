import { Interaction } from 'detritus-client';
import { ApplicationCommandOptionTypes } from 'detritus-client/lib/constants';

import { MAX_MUSIC_SPEED, MIN_MUSIC_SPEED } from '../../../../constants';
import { Formatter } from '../../../../utils';

import { BaseInteractionCommandOption } from '../../basecommand';


export class MusicSpeedCommand extends BaseInteractionCommandOption {
  description = 'Speed the music up or slow it down for everyone, the pitch kept (premium, a DJ in the bot\'s channel)';
  metadata = {
    id: Formatter.Commands.MusicSpeed.COMMAND_ID,
  };
  name = 'speed';

  constructor() {
    super({
      options: [
        {
          name: 'speed',
          description: `How fast, 1 is normal (${MIN_MUSIC_SPEED / 100} to ${MAX_MUSIC_SPEED / 100}), the current one is shown by default`,
          maxValue: MAX_MUSIC_SPEED / 100,
          minValue: MIN_MUSIC_SPEED / 100,
          type: ApplicationCommandOptionTypes.NUMBER,
          // a percent, like `music speed`'s
          value: (value: number) => Math.round(value * 100),
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MusicSpeed.CommandArgs) {
    return Formatter.Commands.MusicSpeed.createMessage(context, args);
  }
}
