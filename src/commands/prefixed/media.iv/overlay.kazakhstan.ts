import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'overlay kazakhstan';

export default class OverlayKazakhstanCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['o kazakhstan', 'kazakhstan'],
      metadata: {
        category: CommandCategories.EFFECTS,
        description: 'Overlay a Kazakh flag over an Image or Video',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
        ],
        id: Formatter.Commands.MediaIVManipulationOverlayFlagKazakhstan.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url>',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationOverlayFlagKazakhstan.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagKazakhstan.createMessage(context, args);
  }
}
