import { Command, CommandClient } from 'detritus-client';

import { CommandCategories, MAX_MUSIC_VOLUME } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'music volume';

export default class MusicVolumeCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['music vol'],
      disableDm: true,
      label: 'volume',
      metadata: {
        description: `Set the music's volume for everyone on a premium server (0 to ${MAX_MUSIC_VOLUME}%), changing it (back to 100 too) needs you in the bot's channel with Manage Server or the DJ role. Nothing given shows it`,
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} 50`,
          `${COMMAND_NAME} 150%`,
          `${COMMAND_NAME} reset`,
        ],
        category: CommandCategories.MUSIC,
        id: Formatter.Commands.MusicVolume.COMMAND_ID,
        usage: `?<0-${MAX_MUSIC_VOLUME}|reset>`,
      },
      type: Formatter.Commands.MusicVolume.parseMusicVolume,
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MusicVolume.CommandArgs) {
    return Formatter.Commands.MusicVolume.createMessage(context, args);
  }
}
