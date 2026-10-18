import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'tv-simulator';

export class MediaIVTVSimulatorCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Make an Image or Video look like an analog TV losing line sync';
  descriptionLocalizations = I18n.localizations('commands.media_iv_5.fun.tv_simulator.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationTVSimulator.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv_5.fun.tv_simulator.name');

  constructor() {
    super({
      options: [
        {name: 'line-sync', description: 'How well the TV holds the picture, 1 is clean and lower tears more (0..1)', ...I18n.optionLocalizations('commands.media_iv_5.fun.tv_simulator.line_sync'), label: 'lineSync', type: Number},
        {name: 'detail-zoom', description: 'Zooms into the distortion for bigger, slower waves (1..8)', ...I18n.optionLocalizations('commands.media_iv_5.fun.tv_simulator.detail_zoom'), label: 'detailZoom', type: Number},
        {name: 'vertical', description: 'Tears the picture up and down instead of sideways', ...I18n.optionLocalizations('commands.media_iv_5.fun.tv_simulator.vertical'), type: Boolean},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationTVSimulator.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationTVSimulator.createMessage(context, args);
  }
}
