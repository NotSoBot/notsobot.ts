import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../utils';

import { BaseInteractionMediasCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'crop-transparency';

export class MediaIVAdjustCropTransparencyCommand extends BaseInteractionMediasCommandOption {
  description = 'Cut an image or video to the shape of a second image\'s transparency';
  descriptionLocalizations = I18n.localizations('commands.media_iv_adjust.crop_transparency.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationCropTransparency.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv_adjust.crop_transparency.name');

  constructor() {
    super({
      maxAmount: 2,
      minAmount: 2,
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationCropTransparency.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationCropTransparency.createMessage(context, args);
  }
}
