import { Interaction } from 'detritus-client';

import { MediaCartoonMethods, MediaCartoonMethodsToText } from '../../../../../constants';
import { Formatter, I18n, Parameters } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'cartoon';

export class MediaIVCartoonCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Apply a Cartoon Effect on an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv_3.fun.cartoon.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationCartoon.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv_3.fun.cartoon.name');

  constructor() {
    super({
      options: [
        {name: 'amount', description: 'Amount (0..10) (Default: 4.0)', ...I18n.optionLocalizations('commands.media_iv_3.fun.cartoon.amount'), type: 'number'},
        {name: 'brightness', description: 'Brightness (0..100) (Default: 100)', ...I18n.optionLocalizations('commands.media_iv_3.fun.cartoon.brightness'), type: Number},
        {
          name: 'method',
          description: 'Edge Method',
          ...I18n.optionLocalizations('commands.media_iv_3.fun.cartoon.method'),
          choices: Parameters.Slash.oneOf({
            choices: MediaCartoonMethods,
            defaultChoice: MediaCartoonMethods.COLOR_DODGE_BLUR,
            descriptions: MediaCartoonMethodsToText,
          }),
        },
        {name: 'levels', description: 'Levels (2..10) (Default: 6)', ...I18n.optionLocalizations('commands.media_iv_3.fun.cartoon.levels'), type: Number},
        {name: 'pattern', description: 'Pattern (0..100) (Default: 70)', ...I18n.optionLocalizations('commands.media_iv_3.fun.cartoon.pattern'), type: Number},
        {name: 'strength', description: 'Saturation (0..300) (Default: 150)', ...I18n.optionLocalizations('commands.media_iv_3.fun.cartoon.strength'), label: 'saturation', type: Number},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationCartoon.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationCartoon.createMessage(context, args);
  }
}
