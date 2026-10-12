import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'tunnel';

export class MediaIVTunnelCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Apply a Tunnel effect on an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv_2.fun.tunnel.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationTunnel.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv_2.fun.tunnel.name');

  constructor() {
    super({
      options: [
        {name: 'spiral', description: 'Spiral Tunnel Effect', ...I18n.optionLocalizations('commands.media_iv_2.fun.tunnel.spiral'), type: Boolean},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationTunnel.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationTunnel.createMessage(context, args);
  }
}
