import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'overlay asexual';

export default class OverlayAsexualCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['o asexual', 'overlay ace', 'o ace', 'asexual'],
      metadata: {
        category: CommandCategories.EFFECTS,
        description: 'Overlay an Asexual pride flag over an Image or Video',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
        ],
        id: Formatter.Commands.MediaIVManipulationOverlayFlagAsexual.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url>',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationOverlayFlagAsexual.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagAsexual.createMessage(context, args);
  }
}
