import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'music stop';

export default class MusicStopCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      disableDm: true,
      metadata: {
        description: 'Stop the music without leaving the voice channel, it asks whether to clear the queue or keep it paused. With DJ mode on it needs Manage Server, the DJ role or Manage Channel on the bot\'s voice channel',
        examples: [
          COMMAND_NAME,
        ],
        category: CommandCategories.MUSIC,
        id: Formatter.Commands.MusicStop.COMMAND_ID,
        usage: '',
      },
    });
  }

  async run(context: Command.Context) {
    return Formatter.Commands.MusicStop.createMessage(context);
  }
}
