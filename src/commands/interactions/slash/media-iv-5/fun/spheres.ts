import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'spheres';

export class MediaIVSpheresCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Hang an Image or Video as Dali\'s Galatea of the Spheres';
  descriptionLocalizations = I18n.localizations('commands.media_iv_5.fun.spheres.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationSpheres.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv_5.fun.spheres.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationSpheres.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationSpheres.createMessage(context, args);
  }
}
