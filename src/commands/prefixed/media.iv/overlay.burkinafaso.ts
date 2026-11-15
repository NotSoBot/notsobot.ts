import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'overlay burkinafaso';

export default class OverlayBurkinaFasoCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['o burkinafaso', 'overlay burkina', 'o burkina', 'burkinafaso', 'burkina'],
      metadata: {
        category: CommandCategories.EFFECTS,
        description: 'Overlay a Burkinabé flag over an Image or Video',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
        ],
        id: Formatter.Commands.MediaIVManipulationOverlayFlagBurkinaFaso.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url>',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationOverlayFlagBurkinaFaso.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagBurkinaFaso.createMessage(context, args);
  }
}
