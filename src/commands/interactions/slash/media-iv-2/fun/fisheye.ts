import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../..//../basecommand';


export const COMMAND_NAME = 'fisheye';

export class MediaIVFisheyeCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Apply a Fisheye Effect on an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv_2.fun.fisheye.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationFisheye.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv_2.fun.fisheye.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationFisheye.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationFisheye.createMessage(context, args);
  }
}
