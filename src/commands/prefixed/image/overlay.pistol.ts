import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseImageCommand } from '../basecommand';


export interface CommandArgsBefore {
  url?: null | string,
}

export const COMMAND_NAME = 'overlay pistol';

export default class OverlayPistolCommand extends BaseImageCommand<Formatter.Commands.ImageOverlayPistol.CommandArgs> {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['o pistol', 'pistol'],
      metadata: {
        category: CommandCategories.IMAGE,
        description: 'Overlay a Half Life Pistol over an image',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
        ],
        id: Formatter.Commands.ImageOverlayPistol.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url>',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.ImageOverlayPistol.CommandArgs) {
    return Formatter.Commands.ImageOverlayPistol.createMessage(context, args);
  }
}
