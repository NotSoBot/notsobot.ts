import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'overlay gaben';

export default class OverlayGaben1Command extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['o gaben', 'gaben'],
      metadata: {
        description: 'Overlay an Image or Video over a sign held by Gaben Newell',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
        ],
        category: CommandCategories.IMAGE,
        id: Formatter.Commands.MediaIVManipulationOverlayPersonsGaben1.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url>',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationOverlayPersonsGaben1.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayPersonsGaben1.createMessage(context, args);
  }
}
