import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseSearchCommand } from '../basecommand';


export const COMMAND_NAME = 'badmeme';

export default class BadMemeCommand extends BaseSearchCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      metadata: {
        category: CommandCategories.SEARCH,
        description: 'Show a Bad Meme',
        examples: [
          COMMAND_NAME,
        ],
        id: Formatter.Commands.SearchBadMeme.COMMAND_ID,
        usage: '',
      },
    });
  }

  onBeforeRun(context: Command.Context, args: Formatter.Commands.SearchBadMeme.CommandArgs) {
    return true;
  }

  run(context: Command.Context, args: Formatter.Commands.SearchBadMeme.CommandArgs) {
    return Formatter.Commands.SearchBadMeme.createMessage(context, args);
  }
}
