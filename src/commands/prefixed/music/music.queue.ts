import { Command, CommandClient } from 'detritus-client';

import { CommandCategories, GuildFeatures } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'music queue';

export default class MusicQueueCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      disableDm: true,
      metadata: {
        description: 'Show what the music is playing and what is queued after it',
        examples: [
          COMMAND_NAME,
        ],
        category: CommandCategories.MUSIC,
        // premium users, premium servers and servers given the feature (`owner guild features add`)
        premiumServer: GuildFeatures.MUSIC_ACCESS,
        id: Formatter.Commands.MusicQueue.COMMAND_ID,
        usage: '',
      },
    });
  }

  async run(context: Command.Context) {
    return Formatter.Commands.MusicQueue.createMessage(context);
  }
}
