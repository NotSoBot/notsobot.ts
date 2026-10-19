import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionMediasCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'swap';

export class MediaIVFaceSwapCommand extends BaseInteractionMediasCommandOption {
  description = 'Put the second media\'s face onto the faces of the first media';
  descriptionLocalizations = I18n.localizations('commands.media_iv_5.face.swap.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationFaceSwap.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv_5.face.swap.name');

  constructor() {
    super({
      options: [
        {
          name: 'faces',
          description: 'How many faces get swapped, biggest first (1..8)',
          ...I18n.optionLocalizations('commands.media_iv_5.face.swap.faces'),
          maxValue: 8,
          minValue: 1,
          type: Number,
        },
      ],
      minAmount: 2,
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationFaceSwap.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationFaceSwap.createMessage(context, args);
  }
}
