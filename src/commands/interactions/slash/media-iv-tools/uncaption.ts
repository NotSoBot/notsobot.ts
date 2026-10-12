import { Interaction } from 'detritus-client';
import { ApplicationCommandOptionTypes } from 'detritus-client/lib/constants';

import { Formatter, I18n } from '../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'uncaption';

export class MediaIVToolsUncaptionCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Uncaption an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv_tools.uncaption.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationUncaption.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv_tools.uncaption.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationUncaption.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationUncaption.createMessage(context, args);
  }
}
