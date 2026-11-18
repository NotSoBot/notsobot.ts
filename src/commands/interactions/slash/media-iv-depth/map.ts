import { Interaction } from 'detritus-client';

import { MediaDepthColormaps } from '../../../../constants';
import { Formatter, I18n, Parameters } from '../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../basecommand';

const MediaDepthColormapsNames = {GRAY: 'Gray', INFERNO: 'Inferno', MAGMA: 'Magma', PLASMA: 'Plasma', TURBO: 'Turbo', VIRIDIS: 'Viridis'};


export const COMMAND_NAME = 'map';

export class MediaIVDepthMapCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Show an image or video\'s estimated depth: near is bright, far is dark';
  descriptionLocalizations = I18n.localizations('commands.media_iv_depth.map.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationDepth.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv_depth.map.name');

  constructor() {
    super({
      options: [
        {
          name: 'colormap',
          description: 'The colors it uses (Default: Gray)',
          ...I18n.optionLocalizations('commands.media_iv_depth.map.colormap'),
          choices: Parameters.Slash.oneOf({
            choices: MediaDepthColormaps,
            defaultChoice: MediaDepthColormaps.GRAY,
            descriptions: MediaDepthColormapsNames,
            localizationKey: 'choices.depth_colormaps',
          }),
        },
        {
          name: 'invert',
          description: 'Far bright instead of near',
          ...I18n.optionLocalizations('commands.media_iv_depth.map.invert'),
          type: Boolean,
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationDepth.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationDepth.createMessage(context, args);
  }
}
