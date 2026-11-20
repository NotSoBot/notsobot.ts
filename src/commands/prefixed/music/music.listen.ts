import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'music listen';

export default class MusicListenCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      disableDm: true,
      label: 'target',
      type: Formatter.Commands.MusicListen.parseTarget,
      metadata: {
        description: 'Find a song playing in voice: everyone\'s audio at once by default, or just one person\'s (like you playing a song near your mic, or another bot\'s music). It listens for up to 2 minutes and stops as soon as it finds one. NotSoBot itself as the target shows what it\'s playing (the song in a file or link it plays is identified from where it\'s at)',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} @cakedan`,
          `${COMMAND_NAME} everyone`,
          `${COMMAND_NAME} @NotSoBot`,
        ],
        category: CommandCategories.MUSIC,
        id: Formatter.Commands.MusicListen.COMMAND_ID,
        usage: '?<user,everyone>',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MusicListen.CommandArgs) {
    return Formatter.Commands.MusicListen.createMessage(context, args);
  }
}
