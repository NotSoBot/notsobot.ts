import { Command, CommandClient } from 'detritus-client';

import { CommandCategories, GuildFeatures } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'music leave';

export default class MusicLeaveCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      disableDm: true,
      metadata: {
        description: 'Stop the music and leave the voice channel',
        examples: [
          COMMAND_NAME,
        ],
        category: CommandCategories.MUSIC,
        // premium users, premium servers and servers given the feature (`owner guild features add`)
        premiumServer: GuildFeatures.MUSIC_ACCESS,
        id: Formatter.Commands.MusicLeave.COMMAND_ID,
        usage: '',
      },
    });
  }

  async run(context: Command.Context) {
    return Formatter.Commands.MusicLeave.createMessage(context);
  }
}
