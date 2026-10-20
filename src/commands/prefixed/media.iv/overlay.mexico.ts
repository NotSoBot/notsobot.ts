import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'overlay mexico';

export default class OverlayMexicoCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['o mexico', 'mexico'],
      metadata: {
        category: CommandCategories.EFFECTS,
        description: 'Overlay a Mexican flag over an Image or Video',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
        ],
        id: Formatter.Commands.MediaIVManipulationOverlayFlagMexico.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url>',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationOverlayFlagMexico.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagMexico.createMessage(context, args);
  }
}
