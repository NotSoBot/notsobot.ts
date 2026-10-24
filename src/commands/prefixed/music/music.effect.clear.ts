import { CommandClient, Command } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'music effect clear';

export default class MusicEffectClearCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['music effects clear', 'music fx clear'],
      disableDm: true,
      metadata: {
        description: 'Take every effect off the music (in the bot\'s channel with Manage Server or the DJ role)',
        examples: [
          COMMAND_NAME,
        ],
        category: CommandCategories.MUSIC,
        id: Formatter.Commands.MusicEffect.COMMAND_ID,
      },
      // ahead of `music effect`
      priority: 1,
    });
  }

  async run(context: Command.Context) {
    return Formatter.Commands.MusicEffect.createClearMessage(context);
  }
}
