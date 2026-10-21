import { Interaction } from 'detritus-client';
import { ApplicationCommandOptionTypes } from 'detritus-client/lib/constants';

import { Formatter, I18n } from '../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'universe';

export class MediaIVUniverseCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Blend an Image or Video into outer space';
  descriptionLocalizations = I18n.localizations('commands.media_iv_5.fun.universe.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationUniverse.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv_5.fun.universe.name');

  constructor() {
    super({
      options: [
        {name: 'background', description: 'Which space background (1..4) (Default: 1)', ...I18n.optionLocalizations('commands.media_iv_5.fun.universe.background'), label: 'space', type: ApplicationCommandOptionTypes.INTEGER, minValue: 1, maxValue: 4},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationUniverse.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationUniverse.createMessage(context, args);
  }
}
