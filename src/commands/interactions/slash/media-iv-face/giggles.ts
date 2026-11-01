import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'giggles';

export class MediaIVGigglesCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Biggest smile, a propeller cap and a lollipop over a dreamy rainbow sky';
  descriptionLocalizations = I18n.localizations('commands.media_iv_5.face.giggles.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationGiggles.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv_5.face.giggles.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationGiggles.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationGiggles.createMessage(context, args);
  }
}
