import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'buscemi';

export class MediaIVBuscemiCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Swap Steve Buscemi\'s face onto the faces in an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv_5.face.buscemi.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationFaceSwapBuscemi.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv_5.face.buscemi.name');

  constructor() {
    super({
      options: [
        {
          name: 'faces',
          description: 'How many faces get swapped, biggest first (1..8)',
          ...I18n.optionLocalizations('commands.media_iv_5.face.buscemi.faces'),
          maxValue: 8,
          minValue: 1,
          type: Number,
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationFaceSwapBuscemi.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationFaceSwapBuscemi.createMessage(context, args);
  }
}
