import { Interaction } from 'detritus-client';

import { Formatter, I18n, Parameters } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'framecount';

export class MediaIVToolsSetFrameCountCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Set an Animated Image or Video\'s Frame Count';
  descriptionLocalizations = I18n.localizations('commands.media_iv_tools.set.framecount.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationSetFrameCount.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv_tools.set.framecount.name');

  constructor() {
    super({
      options: [
        {
          name: 'count',
          description: 'Frame Amount',
          ...I18n.optionLocalizations('commands.media_iv_tools.set.framecount.count'),
          required: true,
          type: Number,
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationSetFrameCount.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationSetFrameCount.createMessage(context, args);
  }
}
