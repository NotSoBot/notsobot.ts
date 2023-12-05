import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'imagine';

export default class ImagineCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      args: [
        {name: 'count', aliases: ['c'], type: Number, metadata: {description: 'grid size (1..4)'}},
        {name: 'guidance', type: 'float', metadata: {description: 'influence of prompt on sampling (-Inf..Inf)'}},
        {name: 'no', metadata: {escription: 'negative prompt'}},
        {name: 'seed', type: Number, metadata: {description: 'initial noise'}},
        {name: 'steps', type: Number, metadata: {description: 'number of samples to take (2..50)'}},
      ],
      label: 'query',
      metadata: {
        category: CommandCategories.TOOLS,
        description: 'Alter an Image with machine learning (thanks evan)',
        examples: [
          `${COMMAND_NAME} an animal eating strawberries`,
          `${COMMAND_NAME} an animal eating strawberries -guidance 50`,
        ],
        id: Formatter.Commands.ToolsMLImagine.COMMAND_ID,
        usage: '<...query> (-count <number>) (-guidance <number>) (-no <query>) (-seed <number>) (-steps <number>) (-strength <number>)',
      },
      ratelimits: [
        {duration: 10000, limit: 3, key: Formatter.Commands.ToolsMLImagine.COMMAND_ID, type: 'guild'},
        {duration: 5000, limit: 1, key: Formatter.Commands.ToolsMLImagine.COMMAND_ID, type: 'channel'},
      ],
    });
  }

  onBeforeRun(context: Command.Context, args: Formatter.Commands.ToolsMLImagine.CommandArgs) {
    return !!args.query;
  }

  async run(context: Command.Context, args: Formatter.Commands.ToolsMLImagine.CommandArgs) {
    return Formatter.Commands.ToolsMLImagine.createMessage(context, args);
  }
}
