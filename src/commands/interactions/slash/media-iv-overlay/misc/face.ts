import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionMediasCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'face';

export class MediaIVOverlayFaceCommand extends BaseInteractionMediasCommandOption {
  description = 'Overlay an Image or Video onto the faces in another one';
  descriptionLocalizations = I18n.localizations('commands.media_iv.overlay.face.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFace.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.overlay.face.name');

  constructor() {
    super({
      options: [
        {name: 'scale', description: 'Overlay Media\'s Scale relative to the face (default: 1.35)', ...I18n.optionLocalizations('commands.media_iv.overlay.face.scale'), type: 'number'},
      ],
      minAmount: 2,
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFace.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFace.createMessage(context, args);
  }
}
