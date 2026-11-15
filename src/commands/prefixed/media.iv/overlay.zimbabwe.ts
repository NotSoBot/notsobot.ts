import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'overlay zimbabwe';

export default class OverlayZimbabweCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['o zimbabwe', 'zimbabwe'],
      metadata: {
        category: CommandCategories.EFFECTS,
        description: 'Overlay a Zimbabwean flag over an Image or Video',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
        ],
        id: Formatter.Commands.MediaIVManipulationOverlayFlagZimbabwe.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url>',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationOverlayFlagZimbabwe.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagZimbabwe.createMessage(context, args);
  }
}
