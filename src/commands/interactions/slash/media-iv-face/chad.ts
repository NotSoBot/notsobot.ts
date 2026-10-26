import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'chad';

export class MediaIVChadCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Swap Gigachad\'s face onto the faces in an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv_5.face.chad.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationFaceSwapChad.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv_5.face.chad.name');

  constructor() {
    super({
      options: [
        {
          name: 'faces',
          description: 'How many faces get swapped, biggest first (1..8)',
          ...I18n.optionLocalizations('commands.media_iv_5.face.chad.faces'),
          maxValue: 8,
          minValue: 1,
          type: Number,
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationFaceSwapChad.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationFaceSwapChad.createMessage(context, args);
  }
}
