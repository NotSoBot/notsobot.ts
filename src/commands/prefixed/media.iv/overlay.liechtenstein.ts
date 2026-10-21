import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'overlay liechtenstein';

export default class OverlayLiechtensteinCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['o liechtenstein', 'liechtenstein'],
      metadata: {
        category: CommandCategories.EFFECTS,
        description: 'Overlay a Liechtenstein flag over an Image or Video',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
        ],
        id: Formatter.Commands.MediaIVManipulationOverlayFlagLiechtenstein.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url>',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationOverlayFlagLiechtenstein.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagLiechtenstein.createMessage(context, args);
  }
}
