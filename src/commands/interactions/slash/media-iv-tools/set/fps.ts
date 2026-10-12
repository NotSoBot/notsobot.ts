import { Interaction } from 'detritus-client';

import { Formatter, I18n, Parameters } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'fps';

export class MediaIVToolsSetFPSCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Set an Animated Image or Video\'s FPS';
  descriptionLocalizations = I18n.localizations('commands.media_iv_tools.set.fps.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationSetFPS.COMMAND_ID,
  };
  name = COMMAND_NAME;

  constructor() {
    super({
      options: [
        {
          name: 'fps',
          description: 'Frames Per Second',
          ...I18n.optionLocalizations('commands.media_iv_tools.set.fps.fps'),
          required: true,
          type: Number,
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationSetFPS.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationSetFPS.createMessage(context, args);
  }
}
