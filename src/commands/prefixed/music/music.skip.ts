import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'music skip';

export default class MusicSkipCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      disableDm: true,
      metadata: {
        description: 'Skip to the next song in the queue',
        examples: [
          COMMAND_NAME,
        ],
        category: CommandCategories.MUSIC,
        id: Formatter.Commands.MusicSkip.COMMAND_ID,
        usage: '',
      },
    });
  }

  async run(context: Command.Context) {
    return Formatter.Commands.MusicSkip.createMessage(context);
  }
}
