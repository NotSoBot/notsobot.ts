import { Command, CommandClient } from 'detritus-client';

import { CommandCategories, MusicLoopModes } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'music loop';

export default class MusicLoopCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      disableDm: true,
      label: 'mode',
      metadata: {
        description: 'Loop the track or the whole queue (nothing given goes from off to the track to the queue)',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} track`,
          `${COMMAND_NAME} queue`,
          `${COMMAND_NAME} off`,
        ],
        category: CommandCategories.MUSIC,
        id: Formatter.Commands.MusicLoop.COMMAND_ID,
        usage: '?<off|track|queue>',
      },
      type: Parameters.oneOf({choices: MusicLoopModes}),
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MusicLoop.CommandArgs) {
    return Formatter.Commands.MusicLoop.createMessage(context, args);
  }
}
