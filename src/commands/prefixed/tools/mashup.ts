import { Command, CommandClient } from 'detritus-client';

import { CommandCategories, MLDiffusionModels, MLDiffusionModelsToText } from '../../../constants';
import { DefaultParameters, Formatter, Parameters } from '../../../utils';

import { BaseImageOrVideosCommand } from '../basecommand';


export const COMMAND_NAME = 'mashup';

export default class MashupCommand extends BaseImageOrVideosCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      args: [
        {name: 'safe', default: DefaultParameters.safe, type: () => true},
        {name: 'seed', type: Number, metadata: {description: 'initial noise'}},
        {name: 'steps', type: Number, metadata: {description: 'number of samples to take (1 to 16)'}},
        {name: 'strength', type: 'float', metadata: {description: 'strength of prompt (0.01 to 1)'}},
        {
          name: 'use',
          label: 'model',
          type: Parameters.oneOf({choices: MLDiffusionModels, descriptions: MLDiffusionModelsToText}),
        },
      ],
      metadata: {
        category: CommandCategories.TOOLS,
        description: 'Mashup two emojis together using Google\'s Emoji Kitchen or AI',
        examples: [
          `${COMMAND_NAME} :strawberry: :bird:`,
          `${COMMAND_NAME} @NotSoBot :strawberry:`,
        ],
        id: Formatter.Commands.ToolsMLMashup.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url> ?<emoji,user:id|mention|name,url> (-safe) (-seed <number>) (-steps <number>) (-strength <number>) (-use <MLDiffusionModel>)',
      },
      minAmount: 2,
      ratelimits: [
        {duration: 6000, limit: 3, key: Formatter.Commands.ToolsMLEdit.COMMAND_ID, type: 'guild'},
        {duration: 2000, limit: 1, key: Formatter.Commands.ToolsMLEdit.COMMAND_ID, type: 'channel'},
      ],
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.ToolsMLMashup.CommandArgs) {
    return Formatter.Commands.ToolsMLMashup.createMessage(context, args);
  }
}
