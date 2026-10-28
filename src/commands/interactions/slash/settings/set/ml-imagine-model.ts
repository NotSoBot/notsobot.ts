import { Interaction } from 'detritus-client';

import { MLDiffusionModels, MLDiffusionModelsToText } from '../../../../../constants';
import { Formatter, I18n, Parameters } from '../../../../../utils';

import { BaseInteractionCommandOption } from '../../../basecommand';



export class SettingsSetMLImagineModelCommand extends BaseInteractionCommandOption {
  description = 'Set your default model for imagine';
  descriptionLocalizations = I18n.localizations('commands.settings.set.ml_imagine_model.description');
  metadata = {
    id: Formatter.Commands.SettingsSetMLImagineModel.COMMAND_ID,
  };
  name = 'ml-imagine-model';
  nameLocalizations = I18n.localizations('commands.settings.set.ml_imagine_model.name');

  constructor() {
    super({
      options: [
        {
          name: 'model',
          description: 'Diffusion Model',
          ...I18n.optionLocalizations('commands.settings.set.ml_imagine_model.model'),
          value: Parameters.oneOf({choices: MLDiffusionModels, descriptions: MLDiffusionModelsToText}),
          onAutoComplete: Parameters.AutoComplete.mlDiffusionModel,
        },
        {
          name: 'clear',
          description: 'Clear Preference',
          ...I18n.optionLocalizations('commands.settings.set.ml_imagine_model.clear'),
          type: Boolean,
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.SettingsSetMLImagineModel.CommandArgs) {
    return Formatter.Commands.SettingsSetMLImagineModel.createMessage(context, args);
  }
}
