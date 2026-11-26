import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../basecommand';


const { DEFAULT_SIZE, MAX_SIZE, MIN_SIZE } = Formatter.Commands.MediaIVManipulationFaceBigHead;

export const COMMAND_NAME = 'big-head';

export class MediaIVBigHeadCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Make every head in an Image or Video bigger, like a bobblehead';
  descriptionLocalizations = I18n.localizations('commands.media_iv_face_2.big_head.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationFaceBigHead.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv_face_2.big_head.name');

  constructor() {
    super({
      options: [
        {
          name: 'size',
          description: `How much bigger the heads get, ${MIN_SIZE} to ${MAX_SIZE} (Default: ${DEFAULT_SIZE})`,
          ...I18n.optionLocalizations('commands.media_iv_face_2.big_head.size'),
          maxValue: MAX_SIZE,
          minValue: MIN_SIZE,
          type: 'number',
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationFaceBigHead.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationFaceBigHead.createMessage(context, args);
  }
}
