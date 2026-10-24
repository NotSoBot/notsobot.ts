import { Interaction } from 'detritus-client';

import { GuildFeatures } from '../../../../constants';
import { Formatter } from '../../../../utils';

import { BaseInteractionCommandOption } from '../../basecommand';


export class MusicFairCommand extends BaseInteractionCommandOption {
  description = 'Make the queue take turns between who queued';
  metadata = {
    id: Formatter.Commands.MusicFair.COMMAND_ID,
    premiumServer: GuildFeatures.MUSIC_ACCESS,
  };
  name = 'fair';

  constructor() {
    super({
      options: [
        {name: 'enabled', description: 'Off by default, leave empty to see it', type: Boolean},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: {enabled?: boolean}) {
    return Formatter.Commands.MusicFair.createMessage(context, {
      enabled: (typeof(args.enabled) === 'boolean') ? args.enabled : null,
    });
  }
}
