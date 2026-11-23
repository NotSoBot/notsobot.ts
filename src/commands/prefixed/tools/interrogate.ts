import { Command, CommandClient } from 'detritus-client';

import { CommandCategories, CommandRatelimits, MLInterrogateModels, MLInterrogateModelsToText } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseImageCommand } from '../basecommand';


export const COMMAND_NAME = 'interrogate';

export default class InterrogateCommand extends BaseImageCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['identify'],
      args: [
        {
          name: 'model',
          default: MLInterrogateModels.FLORENCE,
          type: Parameters.oneOf({choices: MLInterrogateModels, descriptions: MLInterrogateModelsToText}),
        },
      ],
      metadata: {
        category: CommandCategories.AI,
        description: 'Generate a prompt from an Image',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
          `${COMMAND_NAME} notsobot -model clip`,
        ],
        id: Formatter.Commands.ToolsMLInterrogate.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url> (-model <choice>)',
      },
      ratelimits: CommandRatelimits.ML,
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.ToolsMLInterrogate.CommandArgs) {
    return Formatter.Commands.ToolsMLInterrogate.createMessage(context, args);
  }
}
