import { Command, CommandClient } from 'detritus-client';

import { CommandCategories, MLDiffusionModels, MLDiffusionModelsToText } from '../../../constants';
import { DefaultParameters, Formatter, Parameters } from '../../../utils';

import { BaseImageCommand } from '../basecommand';


export const COMMAND_NAME = 'reimagine';

export default class ReimagineCommand extends BaseImageCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      args: [
        {name: 'add', type: Parameters.parsedMentionsText, metadata: {description: 'Add text to generated prompt'}},
        {name: 'seed', type: Number, metadata: {description: 'Initial Noise (at least 1)'}},
        {name: 'steps', type: Number, metadata: {description: 'Number of Samples to take (1 to 8)'}},
        {
          name: 'use',
          label: 'model',
          default: DefaultParameters.mlDiffusionModel,
          type: Parameters.oneOf({choices: MLDiffusionModels, descriptions: MLDiffusionModelsToText}),
        },
      ],
      metadata: {
        category: CommandCategories.AI,
        description: 'Alter an Image by generating a prompt of the Imagine then Imagining that prompt',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} https://cdn.nsb.gg/assets/brands/notsobot.png`,
        ],
        id: Formatter.Commands.ToolsMLReimagine.COMMAND_ID,
        usage: '?<emoji,user:id|mention,url> (-add <query>) (-seed <number>) (-steps <number>) (-use <choice>)',
      },
      ratelimits: [
        {duration: 6000, limit: 3, key: Formatter.Commands.ToolsMLReimagine.COMMAND_ID, type: 'guild'},
        {duration: 2000, limit: 1, key: Formatter.Commands.ToolsMLReimagine.COMMAND_ID, type: 'channel'},
      ],
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.ToolsMLReimagine.CommandArgs) {
    return Formatter.Commands.ToolsMLReimagine.createMessage(context, args);
  }
}
