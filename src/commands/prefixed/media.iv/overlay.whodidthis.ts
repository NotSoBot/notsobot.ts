import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'overlay whodidthis';

export default class OverlayWhoDidThisCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['o whodidthis', 'whodidthis', 'wdt'],
      metadata: {
        description: 'Place an Image or Video inside of a Who Did This meme',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
        ],
        category: CommandCategories.EFFECTS,
        id: Formatter.Commands.MediaIVManipulationOverlayWhoDidThis.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url>',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationOverlayWhoDidThis.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayWhoDidThis.createMessage(context, args);
  }
}
