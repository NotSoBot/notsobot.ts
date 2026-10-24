import { Interaction } from 'detritus-client';

import { MusicEffects, MusicEffectsToText } from '../../../../constants';
import { Formatter, Parameters } from '../../../../utils';

import { BaseInteractionCommandOption } from '../../basecommand';


const CHOICES = Parameters.Slash.oneOf({choices: MusicEffects, descriptions: MusicEffectsToText, doNotSort: true});

export class MusicEffectCommand extends BaseInteractionCommandOption {
  description = 'Put live effects on the music, up to 3 stacked (premium servers)';
  metadata = {
    id: Formatter.Commands.MusicEffect.COMMAND_ID,
  };
  name = 'effect';

  constructor() {
    super({
      options: [
        {name: 'effect', description: 'Which one (off turns them off), leave empty to see what\'s on', choices: CHOICES},
        {name: 'effect2', description: 'One more stacked on it', choices: CHOICES},
        {name: 'effect3', description: 'And another', choices: CHOICES},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: {effect?: MusicEffects, effect2?: MusicEffects, effect3?: MusicEffects}) {
    const effects = [args.effect, args.effect2, args.effect3].filter((effect): effect is MusicEffects => !!effect);
    return Formatter.Commands.MusicEffect.createMessage(context, {effects});
  }
}
