import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'game imagine';

export default class GameImagineCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['imaginegame'],
      metadata: {
        // owner only while it's tested, `FUN` (and no `onBefore`) once it's public
        category: CommandCategories.OWNER,
        description: 'Recreate a secret AI image with your own prompt, then vote on who came closest. The secret prompt is random, the lobby\'s Set Prompt button lets you write it and judge instead',
        examples: [
          COMMAND_NAME,
        ],
        id: Formatter.Commands.FunGameImagine.COMMAND_ID,
        usage: '',
      },
    });
  }

  onBefore(context: Command.Context) {
    return context.user.isClientOwner;
  }

  run(context: Command.Context, args: Formatter.Commands.FunGameImagine.CommandArgs) {
    return Formatter.Commands.FunGameImagine.createMessage(context, args);
  }
}
