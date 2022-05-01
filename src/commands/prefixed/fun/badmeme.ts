import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'badmeme';

export default class BadMemeCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      metadata: {
        category: CommandCategories.FUN,
        description: 'Show a Bad Meme',
        examples: [
          COMMAND_NAME,
        ],
        id: Formatter.Commands.FunBadMeme.COMMAND_ID,
        usage: '',
      },
    });
  }

  run(context: Command.Context, args: Formatter.Commands.FunBadMeme.CommandArgs) {
    return Formatter.Commands.FunBadMeme.createMessage(context, args);
  }
}
