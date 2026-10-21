import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'zoom';

export class MediaIVZoomCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Zoom into an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv_2.fun.zoom.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationZoom.COMMAND_ID,
  };
  name = COMMAND_NAME;

  constructor() {
    super({
      options: [
        {name: 'amount', description: 'Zoom Amount (Default: 1.2)', ...I18n.optionLocalizations('commands.media_iv_2.fun.zoom.amount'), type: 'number'},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationZoom.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationZoom.createMessage(context, args);
  }
}
