import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'globe';

export class MediaIVGlobeCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Create a Globe out of an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv_3.fun.globe.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationGlobe.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv_3.fun.globe.name');

  constructor() {
    super({
      options: [
        {name: 'tiled', description: 'Make a Tiled Globe', ...I18n.optionLocalizations('commands.media_iv_3.fun.globe.tiled'), type: Boolean},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationGlobe.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationGlobe.createMessage(context, args);
  }
}
