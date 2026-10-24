import { Interaction } from 'detritus-client';

import { Formatter } from '../../../../../utils';

import { BaseInteractionCommandOption } from '../../../basecommand';


export class MusicEffectRemoveCommand extends BaseInteractionCommandOption {
  description = 'Take an effect off the music (in the bot\'s channel with Manage Server or the DJ role)';
  metadata = {
    id: Formatter.Commands.MusicEffect.COMMAND_ID,
  };
  name = 'remove';

  constructor() {
    super({
      options: [
        {
          name: 'effect',
          description: 'Which one (one of it, when it\'s on more than once)',
          required: true,
          // only what's on
          onAutoComplete: Formatter.Commands.MusicEffect.autoCompleteRemove,
          value: Formatter.Commands.MusicEffect.parseMusicEffect,
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: {effect: Formatter.Commands.MusicEffect.Effect | null}) {
    return Formatter.Commands.MusicEffect.createRemoveMessage(context, args);
  }
}
