import { Interaction } from 'detritus-client';

import { DefaultParameters, Formatter, I18n, Parameters } from '../../../../utils';

import { BaseInteractionCommandOption } from '../../basecommand';


export const COMMAND_NAME = '4chan';

export class Search4ChanCommand extends BaseInteractionCommandOption {
  description = 'Search 4Chan';
  descriptionLocalizations = I18n.localizations('commands.search.4chan.description');
  metadata = {
    id: Formatter.Commands.Search4Chan.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.search.4chan.name');

  constructor() {
    super({
      options: [
        {name: 'board', description: 'Board to search (ex: g, v)', ...I18n.optionLocalizations('commands.search.4chan.board')},
        {name: 'closed', description: 'Include closed threads', ...I18n.optionLocalizations('commands.search.4chan.closed'), type: Boolean},
        {name: 'randomize', description: 'Randomize the results', ...I18n.optionLocalizations('commands.search.4chan.randomize'), type: Boolean},
        {name: 'safe', description: 'Safe Search', ...I18n.optionLocalizations('commands.search.4chan.safe'), type: Boolean, default: DefaultParameters.safe, value: Parameters.Slash.safe},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.Search4Chan.CommandArgs) {
    return Formatter.Commands.Search4Chan.createMessage(context, args);
  }
}
