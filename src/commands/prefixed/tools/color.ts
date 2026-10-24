import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'color';

export default class ColorCommand extends BaseCommand<Formatter.Commands.ToolsColor.CommandArgs> {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['colour', 'hex'],
      label: 'color',
      metadata: {
        category: CommandCategories.UTILITY,
        pipeable: true,
        description: 'Show a color\'s hex, RGB, HSL, HSV, CMYK, closest name and more, a random one when empty',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} #6A5ACD`,
          `${COMMAND_NAME} 1, 85, 120`,
          `${COMMAND_NAME} red`,
          `${COMMAND_NAME} hsl(248, 53%, 58%)`,
        ],
        id: Formatter.Commands.ToolsColor.COMMAND_ID,
        usage: '?<hex,rgb,hsl,hsv,cmyk,integer,name,random>',
      },
      // below `color remove` and other `color *` commands so those get matched first
      priority: -1,
      type: Parameters.targetText,
    });
  }

  run(context: Command.Context, args: Formatter.Commands.ToolsColor.CommandArgs) {
    return Formatter.Commands.ToolsColor.createMessage(context, args);
  }
}
