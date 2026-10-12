import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'rgb-split';

export class MediaIVRGBSplitCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Split the red, green and blue channels of an Image or Video apart';
  descriptionLocalizations = I18n.localizations('commands.media_iv_3.fun.rgb_split.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationRGBSplit.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv_3.fun.rgb_split.name');

  constructor() {
    super({
      options: [
        {name: 'offset', description: 'Channel Offset in pixels (1..100) (Default: 5)', ...I18n.optionLocalizations('commands.media_iv_3.fun.rgb_split.offset'), type: Number},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationRGBSplit.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationRGBSplit.createMessage(context, args);
  }
}
