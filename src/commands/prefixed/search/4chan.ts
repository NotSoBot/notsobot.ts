import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { DefaultParameters, Formatter } from '../../../utils';

import { BaseSearchCommand } from '../basecommand';


export const COMMAND_NAME = '4chan';

export default class ChanCommand extends BaseSearchCommand<Formatter.Commands.Search4Chan.CommandArgs> {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['chan'],
      args: [
        {name: 'closed', aliases: ['c'], type: Boolean},
        {name: 'randomize', aliases: ['r', 'random'], type: Boolean},
        {name: 'safe', default: DefaultParameters.safe, type: () => true},
      ],
      label: 'board',
      metadata: {
        category: CommandCategories.SEARCH,
        description: 'Search 4Chan',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} fitness`,
        ],
        id: Formatter.Commands.Search4Chan.COMMAND_ID,
        usage: '?<board>',
      },
    });
  }

  onBeforeRun(context: Command.Context, args: Formatter.Commands.SearchUrban.CommandArgs) {
    return true;
  }

  run(context: Command.Context, args: Formatter.Commands.Search4Chan.CommandArgs) {
    return Formatter.Commands.Search4Chan.createMessage(context, args);
  }
}
