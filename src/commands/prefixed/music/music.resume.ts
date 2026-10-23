import { Command, CommandClient } from 'detritus-client';

import { CommandCategories, GuildFeatures } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'music resume';

export default class MusicResumeCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      disableDm: true,
      metadata: {
        description: 'Resume the paused music from where it was',
        examples: [
          COMMAND_NAME,
        ],
        category: CommandCategories.MUSIC,
        // premium users, premium servers and servers given the feature (`owner guild features add`)
        premiumServer: GuildFeatures.MUSIC_ACCESS,
        id: Formatter.Commands.MusicResume.COMMAND_ID,
        usage: '',
      },
    });
  }

  async run(context: Command.Context) {
    return Formatter.Commands.MusicResume.createMessage(context);
  }
}
