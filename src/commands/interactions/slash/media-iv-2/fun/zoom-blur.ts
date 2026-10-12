import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'zoom-blur';

export class MediaIVZoomBlurCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Apply a Zoom Blur to an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv_2.fun.zoom_blur.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationZoomBlur.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv_2.fun.zoom_blur.name');

  constructor() {
    super({
      options: [
        {name: 'amount', description: 'Zoom Amount (Default: 1.2)', ...I18n.optionLocalizations('commands.media_iv_2.fun.zoom_blur.amount'), type: 'number'},
        {name: 'expand', description: 'Expand back to Original Size', ...I18n.optionLocalizations('commands.media_iv_2.fun.zoom_blur.expand'), type: Boolean},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationZoomBlur.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationZoomBlur.createMessage(context, args);
  }
}
