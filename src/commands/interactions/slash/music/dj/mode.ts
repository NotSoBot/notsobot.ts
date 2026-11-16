import { Interaction } from 'detritus-client';

import { Formatter } from '../../../../../utils';

import { BaseInteractionCommandOption } from '../../../basecommand';


export class MusicDjModeCommand extends BaseInteractionCommandOption {
  description = 'Only DJs control the music, everyone else votes to skip, pause or resume (on by default)';
  metadata = {
    id: Formatter.Commands.MusicDj.COMMAND_ID,
  };
  name = 'mode';

  constructor() {
    super({
      options: [
        {name: 'enabled', description: 'On by default, leave empty to see it', type: Boolean},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: {enabled?: boolean}) {
    return Formatter.Commands.MusicDj.createMessage(context, {
      enabled: (typeof(args.enabled) === 'boolean') ? args.enabled : null,
    });
  }
}
