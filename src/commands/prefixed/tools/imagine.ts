import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'imagine';

export default class ImagineCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      args: [
        {name: 'no', metadata: {escription: 'negative prompt'}},
        {name: 'seed', type: Number, metadata: {description: 'initial noise'}},
        {name: 'steps', type: Number, metadata: {description: 'number of samples to take (2..50)'}},
      ],
      label: 'query',
      metadata: {
        category: CommandCategories.TOOLS,
        description: 'Generate an Image based off a prompt (thanks evan)',
        examples: [
          `${COMMAND_NAME} an animal eating strawberries`,
          `${COMMAND_NAME} an animal eating strawberries -seed 5`,
        ],
        id: Formatter.Commands.ToolsMLImagine.COMMAND_ID,
        usage: '<...query> (-no <query>) (-seed <number>) (-steps <number>)',
      },
      ratelimits: [
        {duration: 6000, limit: 3, key: Formatter.Commands.ToolsMLImagine.COMMAND_ID, type: 'guild'},
        {duration: 2000, limit: 1, key: Formatter.Commands.ToolsMLImagine.COMMAND_ID, type: 'channel'},
      ],
      type: Parameters.targetText,
    });
  }

  onBeforeRun(context: Command.Context, args: Formatter.Commands.ToolsMLImagine.CommandArgs) {
    return !!args.query;
  }

  async run(context: Command.Context, args: Formatter.Commands.ToolsMLImagine.CommandArgs) {
    return Formatter.Commands.ToolsMLImagine.createMessage(context, args);
  }
}
