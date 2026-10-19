import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'foggy';

export default class FoggyWindowCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['fog', 'foggywindow'],
      args: [
        {aliases: ['b', 'bg'], name: 'background', type: Number, metadata: {description: '1 to 3'}},
      ],
      label: 'text',
      metadata: {
        category: CommandCategories.EFFECTS,
        description: 'Write text on a foggy window',
        examples: [
          `${COMMAND_NAME} notsobot`,
        ],
        id: Formatter.Commands.MediaICreateFoggyWindow.COMMAND_ID,
        usage: '<text> (-background <1-3>)',
      },
    });
  }

  onBeforeRun(context: Command.Context, args: Formatter.Commands.MediaICreateFoggyWindow.CommandArgs) {
    return !!args.text;
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaICreateFoggyWindow.CommandArgs) {
    return Formatter.Commands.MediaICreateFoggyWindow.createMessage(context, args);
  }
}
