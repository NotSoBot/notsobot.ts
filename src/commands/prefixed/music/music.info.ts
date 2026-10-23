import { Command, CommandClient } from 'detritus-client';

import { CommandCategories, GuildFeatures } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'music info';

export default class MusicInfoCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      disableDm: true,
      metadata: {
        description: 'Show what the music is playing, its position and the voice connection',
        examples: [
          COMMAND_NAME,
        ],
        category: CommandCategories.MUSIC,
        // premium users, premium servers and servers given the feature (`owner guild features add`)
        premiumServer: GuildFeatures.MUSIC_ACCESS,
        id: Formatter.Commands.MusicInfo.COMMAND_ID,
        usage: '',
      },
    });
  }

  async run(context: Command.Context) {
    return Formatter.Commands.MusicInfo.createMessage(context);
  }
}
