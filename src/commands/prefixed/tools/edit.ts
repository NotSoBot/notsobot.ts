import { Command, CommandClient } from 'detritus-client';

import { CommandCategories, MLDiffusionModels, MLDiffusionModelsToText } from '../../../constants';
import { DefaultParameters, Formatter, Parameters } from '../../../utils';

import { BaseMediasCommand } from '../basecommand';


export const COMMAND_NAME = 'edit';

export default class EditCommand extends BaseMediasCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      args: [
        {name: 'expand', type: Boolean},
        {name: 'seed', type: Number, metadata: {description: 'initial noise (at least 1)'}},
        {name: 'steps', type: Number, metadata: {description: 'number of samples to take (1 to 16)'}},
        {name: 'strength', type: 'float', metadata: {description: 'strength of prompt (0 to 1)'}},
        {
          name: 'use',
          label: 'model',
          default: DefaultParameters.mlDiffusionModel,
          type: Parameters.oneOf({choices: MLDiffusionModels, descriptions: MLDiffusionModelsToText}),
        },
      ],
      maxAmount: 3,
      minAmount: 1,
      metadata: {
        category: CommandCategories.AI,
        description: 'Alter an Image with machine learning (thanks evan)',
        examples: [
          `${COMMAND_NAME} an animal eating strawberries`,
          `${COMMAND_NAME} https://cdn.notsobot.com/brands/notsobot.png an animal eating strawberries -seed 5`,
        ],
        id: Formatter.Commands.ToolsMLEdit.COMMAND_ID,
        usage: '?<emoji,user:id|mention,url> <...query> (-expand) (-seed <number>) (-steps <number>) (-strength <float>) (-use <MLDiffusionModel>)',
      },
      ratelimits: [
        {duration: 6000, limit: 3, key: Formatter.Commands.ToolsMLEdit.COMMAND_ID, type: 'guild'},
        {duration: 2000, limit: 1, key: Formatter.Commands.ToolsMLEdit.COMMAND_ID, type: 'channel'},
      ],
      type: [
        // both see the whole content, so `.edit @cake @notsobot make them kiss` works without quoting the users
        {name: 'urls', type: Parameters.mediaUrlsLeading({maxAmount: 3, minAmount: 1, audio: false, video: false}), consume: true},
        {name: 'query', type: Parameters.textAfterLeadingMedia(3), consume: true},
      ],
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.ToolsMLEdit.CommandArgs) {
    return Formatter.Commands.ToolsMLEdit.createMessage(context, args);
  }
}
