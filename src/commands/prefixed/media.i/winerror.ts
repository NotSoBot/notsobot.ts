import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'winerror';

export default class WinErrorCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['winerr', 'windowserror'],

      args: [
        {name: 'buttons', aliases: ['b'], metadata: {description: 'up to 3 buttons split by | (default: OK)'}},
        {name: 'color', aliases: ['c'], metadata: {description: 'window color on 1.0 and 8, #hex or r,g,b'}},
        {name: 'default', aliases: ['d'], type: Number, metadata: {description: 'which button is focused, 1 to 3 (default: 1)'}},
        {name: 'disabled', metadata: {description: 'buttons drawn greyed out, like 2,3'}},
        {name: 'gradient', aliases: ['g'], metadata: {description: 'title bar colors on 95/98/2000, one or two #hex'}},
        {name: 'icon', aliases: ['i'], metadata: {description: 'error, warning, question or an icon number (default: error)'}},
        {name: 'noclose', type: Boolean, metadata: {description: 'grey out the close button'}},
        {name: 'os', aliases: ['system', 'windows', 'w'], metadata: {description: '1, 3, 3.1, 95, 98, 2000, whistler, xp, longhorn, vista-basic, 7, 8, 10, 11 (default: xp)'}},
        {name: 'scale', aliases: ['s'], type: Number, metadata: {description: 'pixel size, 1 to 4 (default: 1)'}},
        {name: 'title', aliases: ['t'], metadata: {description: 'the title bar (default: Error)'}},
      ],
      label: 'text',
      metadata: {
        category: CommandCategories.EFFECTS,
        credits: Formatter.Commands.MediaICreateWinError.CREDITS,
        description: 'Make a fake Windows error message, from Windows 1.0 to 11',
        examples: [
          `${COMMAND_NAME} Task failed successfully.`,
          `${COMMAND_NAME} Do you want to save changes? -os 7 -icon question -buttons Yes|No|Cancel`,
          `${COMMAND_NAME} Abort, Retry, Fail? -os 95 -title Disk -buttons Abort|Retry|Ignore -disabled 2 -scale 2`,
          `${COMMAND_NAME} icons -os 10`,
        ],
        id: Formatter.Commands.MediaICreateWinError.COMMAND_ID,
        usage: '<...text> (-buttons <a|b|c>) (-color <color>) (-default <1-3>) (-disabled <1-3>) (-gradient <color> <color>) (-icon <name|number>) (-noclose) (-os <windows>) (-scale <1-4>) (-title <text>)',
      },
    });
  }

  onBeforeRun(context: Command.Context, args: Formatter.Commands.MediaICreateWinError.CommandArgs) {
    return !!args.text;
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaICreateWinError.CommandArgs) {
    return Formatter.Commands.MediaICreateWinError.createMessage(context, args);
  }
}
