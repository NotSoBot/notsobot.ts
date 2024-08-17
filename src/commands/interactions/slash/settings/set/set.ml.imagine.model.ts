import { Interaction } from 'detritus-client';

import { Formatter, Parameters } from '../../../../../utils';

import { BaseInteractionCommandOption } from '../../../basecommand';



export class SettingsSetMLImagineModelCommand extends BaseInteractionCommandOption {
  description = 'Set your default ML Imagine Model.';
  metadata = {
    id: Formatter.Commands.SettingsSetMLImagineModel.COMMAND_ID,
  };
  name = 'ml-imagine-model';

  constructor() {
  super({
    options: [
      {
        name: 'model',
        description: 'Diffusion Model',
        choices: Parameters.Slash.ML_IMAGINE_MODELS,
      },
    ],
  });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.SettingsSetMLImagineModel.CommandArgs) {
    return Formatter.Commands.SettingsSetMLImagineModel.createMessage(context, args);
  }
}
