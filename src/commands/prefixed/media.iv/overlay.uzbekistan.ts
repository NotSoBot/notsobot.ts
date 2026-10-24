import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'overlay uzbekistan';

export default class OverlayUzbekistanCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['o uzbekistan', 'uzbekistan'],
      metadata: {
        category: CommandCategories.EFFECTS,
        description: 'Overlay an Uzbek flag over an Image or Video',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
        ],
        id: Formatter.Commands.MediaIVManipulationOverlayFlagUzbekistan.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url>',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationOverlayFlagUzbekistan.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagUzbekistan.createMessage(context, args);
  }
}
