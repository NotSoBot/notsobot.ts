import { Interaction } from 'detritus-client';

import { MediaLegofyPalettes } from '../../../../constants';
import { Formatter, I18n, Parameters } from '../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'legofy';

export class MediaIVLegofyCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Legofy an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.fun.legofy.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationLegofy.COMMAND_ID,
  };
  name = COMMAND_NAME;

  constructor() {
    super({
      options: [
        {name: 'dither', description: 'Add Random Noise', ...I18n.optionLocalizations('commands.media_iv.fun.legofy.dither'), type: Boolean},
        {name: 'palette', description: 'Lego Color Palette', ...I18n.optionLocalizations('commands.media_iv.fun.legofy.palette'), choices: Parameters.Slash.oneOf({choices: MediaLegofyPalettes})},
        {name: 'size', description: 'Size of each Lego Block', ...I18n.optionLocalizations('commands.media_iv.fun.legofy.size'), type: Number},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationLegofy.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationLegofy.createMessage(context, args);
  }
}
