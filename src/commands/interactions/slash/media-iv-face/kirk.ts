import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'kirk';

export class MediaIVKirkCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Swap Kirk\'s face onto the faces in an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv_5.face.kirk.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationFaceSwapKirk.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv_5.face.kirk.name');

  constructor() {
    super({
      options: [
        {
          name: 'faces',
          description: 'How many faces get swapped, biggest first (1..8)',
          ...I18n.optionLocalizations('commands.media_iv_5.face.kirk.faces'),
          maxValue: 8,
          minValue: 1,
          type: Number,
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationFaceSwapKirk.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationFaceSwapKirk.createMessage(context, args);
  }
}
