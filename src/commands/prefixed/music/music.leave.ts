import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'music leave';

export default class MusicLeaveCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      disableDm: true,
      metadata: {
        description: 'Stop the music and leave the voice channel, it asks before clearing the queue. With DJ mode on it needs Manage Server or the DJ role',
        examples: [
          COMMAND_NAME,
        ],
        category: CommandCategories.MUSIC,
        id: Formatter.Commands.MusicLeave.COMMAND_ID,
        usage: '',
      },
    });
  }

  async run(context: Command.Context) {
    return Formatter.Commands.MusicLeave.createMessage(context);
  }
}
