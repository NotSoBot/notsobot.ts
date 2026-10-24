import { Interaction } from 'detritus-client';

import { Formatter } from '../../../../../utils';

import { BaseInteractionCommandOption } from '../../../basecommand';


export class MusicEffectAddCommand extends BaseInteractionCommandOption {
  description = 'Stack an effect on the music (premium, a DJ in the bot\'s channel)';
  metadata = {
    id: Formatter.Commands.MusicEffect.COMMAND_ID,
  };
  name = 'add';

  constructor() {
    super({
      options: [
        {
          name: 'effect',
          description: 'Which one',
          required: true,
          // what's on now decides which can go on and why the rest can't
          onAutoComplete: Formatter.Commands.MusicEffect.autoCompleteAdd,
          value: Formatter.Commands.MusicEffect.parseMusicEffect,
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: {effect: Formatter.Commands.MusicEffect.Effect | null}) {
    return Formatter.Commands.MusicEffect.createAddMessage(context, args);
  }
}
