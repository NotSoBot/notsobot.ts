import { Interaction } from 'detritus-client';

import { MusicStatsPeriods, MusicStatsSorts } from '../../../../constants';
import { Formatter, Parameters } from '../../../../utils';

import { BaseInteractionCommandOption } from '../../basecommand';


export class MusicStatsCommand extends BaseInteractionCommandOption {
  description = 'See what the music played in this server the most';
  metadata = {
    id: Formatter.Commands.MusicStats.COMMAND_ID,
  };
  name = 'stats';

  constructor() {
    super({
      options: [
        {
          name: 'period',
          description: 'How far back to count, all time by default',
          choices: Parameters.Slash.oneOf({choices: MusicStatsPeriods, doNotSort: true}),
        },
        {
          name: 'sort',
          description: 'Rank by plays or by time played, plays by default',
          choices: Parameters.Slash.oneOf({choices: MusicStatsSorts, doNotSort: true}),
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MusicStats.CommandArgs) {
    return Formatter.Commands.MusicStats.createMessage(context, args);
  }
}
