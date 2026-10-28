import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'spin';

export class MediaIVSpinCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Create a spinning disk from an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv_2.fun.spin.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationSpin.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv_2.fun.spin.name');

  constructor() {
    super({
      options: [
        {name: 'counterclockwise', description: 'Rotate the Media counter-clockwise', ...I18n.optionLocalizations('commands.media_iv_2.fun.spin.counterclockwise'), type: Boolean},
        {name: 'nocircle', description: 'Do not turn the Media into a Circle', ...I18n.optionLocalizations('commands.media_iv_2.fun.spin.nocircle'), type: Boolean},
        {name: 'nocrop', description: 'Do not Crop', ...I18n.optionLocalizations('commands.media_iv_2.fun.spin.nocrop'), type: Boolean},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationSpin.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationSpin.createMessage(context, args);
  }
}
