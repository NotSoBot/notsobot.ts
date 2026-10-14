import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'overlay shotgun';

export default class OverlayShotgunCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['o shotgun', 'shotgun'],
      metadata: {
        category: CommandCategories.EFFECTS,
        description: 'This command is disabled while we wait for Discord Compliance approval.',
        examples: [],
        id: Formatter.Commands.MediaIVManipulationOverlayHalfLifeShotgun.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url>',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationOverlayHalfLifeShotgun.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayHalfLifeShotgun.createMessage(context, args);
  }
}
