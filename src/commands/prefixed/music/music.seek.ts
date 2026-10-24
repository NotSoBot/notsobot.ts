import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'music seek';

export default class MusicSeekCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      disableDm: true,
      label: 'position',
      metadata: {
        description: 'Jump to a timestamp in what the music is playing',
        examples: [
          `${COMMAND_NAME} 1:30`,
          `${COMMAND_NAME} 90`,
        ],
        category: CommandCategories.MUSIC,
        id: Formatter.Commands.MusicSeek.COMMAND_ID,
        usage: '<timestamp>',
      },
      required: true,
      type: Parameters.secondsWithOptions(),
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MusicSeek.CommandArgs) {
    return Formatter.Commands.MusicSeek.createMessage(context, args);
  }
}
