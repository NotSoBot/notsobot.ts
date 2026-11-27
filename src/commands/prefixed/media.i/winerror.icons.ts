import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'winerror icons';

export default class WinErrorIconsCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['winerr icons'],

      args: [
        {name: 'os', aliases: ['system', 'windows', 'w'], metadata: {description: '1, 3, 3.1, 95, 98, 2000, whistler, xp, longhorn, vista-basic, 7, 8, 10, 11 (default: xp)'}},
      ],
      metadata: {
        category: CommandCategories.EFFECTS,
        credits: Formatter.Commands.MediaICreateWinError.CREDITS,
        description: 'Show every numbered icon `winerror -icon` can use on a Windows version',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} -os 10`,
        ],
        id: Formatter.Commands.MediaICreateWinError.ICONS_COMMAND_ID,
        usage: '(-os <windows>)',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaICreateWinError.IconsCommandArgs) {
    return Formatter.Commands.MediaICreateWinError.createIconsMessage(context, args);
  }
}
