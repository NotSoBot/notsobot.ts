import { Interaction } from 'detritus-client';

import { GuildFeatures, MusicLoopModes } from '../../../../constants';
import { Formatter, Parameters } from '../../../../utils';

import { BaseInteractionCommandOption } from '../../basecommand';


export class MusicLoopCommand extends BaseInteractionCommandOption {
  description = 'Loop the song or the whole queue';
  metadata = {
    id: Formatter.Commands.MusicLoop.COMMAND_ID,
    premiumServer: GuildFeatures.MUSIC_ACCESS,
  };
  name = 'loop';

  constructor() {
    super({
      options: [
        {
          name: 'mode',
          description: 'What to loop, the next one after the current by default',
          choices: Parameters.Slash.oneOf({choices: MusicLoopModes, doNotSort: true}),
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MusicLoop.CommandArgs) {
    return Formatter.Commands.MusicLoop.createMessage(context, args);
  }
}
