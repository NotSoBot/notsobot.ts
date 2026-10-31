import { Interaction } from 'detritus-client';
import { ApplicationCommandOptionTypes } from 'detritus-client/lib/constants';

import { Formatter, I18n, Parameters } from '../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'phosimp';

export class MediaIVPhoSimpCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Apply numbered filters (0 to 1256) from the game PHOSIMP to an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv_3.fun.phosimp.description');
  metadata = {
    credits: Formatter.Commands.MediaIVManipulationPhoSimp.CREDITS,
    id: Formatter.Commands.MediaIVManipulationPhoSimp.COMMAND_ID,
  };
  name = COMMAND_NAME;

  constructor() {
    super({
      options: [
        {name: 'filters', description: 'PhoSimp Filters, separated with space', ...I18n.optionLocalizations('commands.media_iv_3.fun.phosimp.filters'), value: Parameters.phosimpFilters},
        {name: 'grid-x', description: 'Filter Grid Columns (1..16)', ...I18n.optionLocalizations('commands.media_iv_3.fun.phosimp.grid_x'), label: 'gridx', maxValue: 16, minValue: 1, type: ApplicationCommandOptionTypes.INTEGER},
        {name: 'grid-y', description: 'Filter Grid Rows (1..16)', ...I18n.optionLocalizations('commands.media_iv_3.fun.phosimp.grid_y'), label: 'gridy', maxValue: 16, minValue: 1, type: ApplicationCommandOptionTypes.INTEGER},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationPhoSimp.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationPhoSimp.createMessage(context, args);
  }
}
