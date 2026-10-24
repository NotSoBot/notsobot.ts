import { Interaction } from 'detritus-client';

import { Formatter, Parameters } from '../../../../utils';

import { BaseInteractionCommandOption } from '../../basecommand';


const parseSeconds = Parameters.secondsWithOptions({float: false});

export class MusicRulesCommand extends BaseInteractionCommandOption {
  description = 'See or change the queue\'s rules';
  metadata = {
    id: Formatter.Commands.MusicRules.COMMAND_ID,
  };
  name = 'rules';

  constructor() {
    super({
      options: [
        {
          name: 'max-length',
          description: 'The longest song that can be queued, like 10:00, or off',
          // seconds, 0 for off
          value: (value: string, context: Interaction.InteractionContext) => {
            const text = value.trim().toLowerCase();
            return (text === 'off' || text === 'none' || text === '0') ? 0 : parseSeconds(text, context);
          },
        },
        {name: 'duplicates', description: 'Let the same song be queued more than once at a time', type: Boolean},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: {duplicates?: boolean, 'max-length'?: number}) {
    return Formatter.Commands.MusicRules.createMessage(context, {
      duplicates: args.duplicates,
      maxDuration: args['max-length'],
    });
  }
}
