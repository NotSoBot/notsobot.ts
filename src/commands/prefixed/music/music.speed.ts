import { Command, CommandClient } from 'detritus-client';

import { CommandCategories, MAX_MUSIC_SPEED, MIN_MUSIC_SPEED } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'music speed';

export default class MusicSpeedCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['music tempo'],
      disableDm: true,
      label: 'speed',
      metadata: {
        description: `Speed the music up or slow it down for everyone on a premium server (${MIN_MUSIC_SPEED / 100}x to ${MAX_MUSIC_SPEED / 100}x), the pitch stays the same. Changing it (back to 1x too) needs you in the bot's channel with Manage Server or the DJ role. Nothing given shows it`,
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} 1.25`,
          `${COMMAND_NAME} 0.75x`,
          `${COMMAND_NAME} 150%`,
          `${COMMAND_NAME} reset`,
        ],
        category: CommandCategories.MUSIC,
        id: Formatter.Commands.MusicSpeed.COMMAND_ID,
        usage: `?<${MIN_MUSIC_SPEED / 100}-${MAX_MUSIC_SPEED / 100}|reset>`,
      },
      type: Formatter.Commands.MusicSpeed.parseMusicSpeed,
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MusicSpeed.CommandArgs) {
    return Formatter.Commands.MusicSpeed.createMessage(context, args);
  }
}
