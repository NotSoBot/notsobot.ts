import { Command, CommandClient } from 'detritus-client';

import { CommandCategories, MLDiffusionModels, MLDiffusionModelsToText } from '../../../constants';
import { DefaultParameters, Formatter, Parameters } from '../../../utils';

import { BaseImageCommand } from '../basecommand';


export const COMMAND_NAME = 'edit';

export default class EditCommand extends BaseImageCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      args: [
        {name: 'safe', default: DefaultParameters.safe, type: () => true},
        {name: 'seed', type: Number, metadata: {description: 'initial noise'}},
        {name: 'steps', type: Number, metadata: {description: 'number of samples to take (1..16)'}},
        {name: 'strength', type: 'float', metadata: {description: 'strength of prompt (0.05..1)'}},
        {
          name: 'use',
          label: 'model',
          default: DefaultParameters.mlDiffusionModel,
          type: Parameters.oneOf({choices: MLDiffusionModels, descriptions: MLDiffusionModelsToText}),
        },
      ],
      metadata: {
        category: CommandCategories.TOOLS,
        description: 'Alter an Image with machine learning (thanks evan)',
        examples: [
          `${COMMAND_NAME} an animal eating strawberries`,
          `${COMMAND_NAME} https://cdn.notsobot.com/brands/notsobot.png an animal eating strawberries -seed 5`,
        ],
        id: Formatter.Commands.ToolsMLEdit.COMMAND_ID,
        usage: '?<emoji,user:id|mention,url> <...query> (-safe) (-seed <number>) (-steps <number>) (-strength <number>) (-use <MLDiffusionModel>)',
      },
      ratelimits: [
        {duration: 6000, limit: 3, key: Formatter.Commands.ToolsMLEdit.COMMAND_ID, type: 'guild'},
        {duration: 2000, limit: 1, key: Formatter.Commands.ToolsMLEdit.COMMAND_ID, type: 'channel'},
      ],
      type: [
        {name: 'url', type: Parameters.mediaUrlPositional({audio: false, video: false})},
        {name: 'query', type: Parameters.targetText, consume: true},
      ],
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.ToolsMLEdit.CommandArgs) {
    return Formatter.Commands.ToolsMLEdit.createMessage(context, args);
  }
}
