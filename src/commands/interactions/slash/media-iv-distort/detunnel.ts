import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'detunnel';

export class MediaIVDetunnelCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Unroll an Image or Video around its center into a flat strip (the reverse of tunnel)';
  descriptionLocalizations = I18n.localizations('commands.media_iv_2.fun.detunnel.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationDetunnel.COMMAND_ID,
  };
  name = COMMAND_NAME;

  constructor() {
    super({
      options: [
        {name: 'spiral', description: 'Spiral Tunnel Effect', ...I18n.optionLocalizations('commands.media_iv_2.fun.detunnel.spiral'), type: Boolean},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationDetunnel.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationDetunnel.createMessage(context, args);
  }
}
