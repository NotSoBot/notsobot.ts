import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../basecommand';

import { FACE_OPTION } from './options';


export const COMMAND_NAME = 'clown';

export class MediaIVClownCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Clownify an Image or Video\'s face';
  descriptionLocalizations = I18n.localizations('commands.media_iv_5.face.clown.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationFaceClown.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv_5.face.clown.name');

  constructor() {
    super({
      options: [
        FACE_OPTION,
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationFaceClown.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationFaceClown.createMessage(context, args);
  }
}
