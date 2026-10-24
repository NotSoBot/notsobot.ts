import { Interaction } from 'detritus-client';
import { ApplicationCommandOptionTypes } from 'detritus-client/lib/constants';

import { MAX_MUSIC_VOLUME } from '../../../../constants';
import { Formatter } from '../../../../utils';

import { BaseInteractionCommandOption } from '../../basecommand';


export class MusicVolumeCommand extends BaseInteractionCommandOption {
  description = 'Set the music\'s volume for everyone (premium, a DJ in the bot\'s channel)';
  metadata = {
    id: Formatter.Commands.MusicVolume.COMMAND_ID,
  };
  name = 'volume';

  constructor() {
    super({
      options: [
        {
          name: 'volume',
          description: `Percent, 100 is normal (0 to ${MAX_MUSIC_VOLUME}), the current one is shown by default`,
          maxValue: MAX_MUSIC_VOLUME,
          minValue: 0,
          type: ApplicationCommandOptionTypes.INTEGER,
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MusicVolume.CommandArgs) {
    return Formatter.Commands.MusicVolume.createMessage(context, args);
  }
}
