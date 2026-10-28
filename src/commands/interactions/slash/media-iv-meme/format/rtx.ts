import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionMediasCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'rtx';

export class MediaIVMemeRTXCommand extends BaseInteractionMediasCommandOption {
  description = 'Compare two Images or Videos side by side with RTX OFF and RTX ON badges';
  descriptionLocalizations = I18n.localizations('commands.media_iv_6.meme_2.rtx.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayRTX.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv_6.meme_2.rtx.name');

  constructor() {
    super({minAmount: 2});
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayRTX.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayRTX.createMessage(context, args);
  }
}
