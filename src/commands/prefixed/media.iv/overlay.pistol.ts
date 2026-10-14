import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'overlay pistol';

export default class OverlayPistolCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['o pistol', 'pistol'],
      metadata: {
        category: CommandCategories.EFFECTS,
        description: 'This command is disabled while we wait for Discord Compliance approval.',
        examples: [],
        id: Formatter.Commands.MediaIVManipulationOverlayHalfLifePistol.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url>',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationOverlayHalfLifePistol.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayHalfLifePistol.createMessage(context, args);
  }
}
